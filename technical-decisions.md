# Mermaid Studio — React Technical Decisions

How this codebase applies common React architecture principles. Each section states the **decision made**, **where it lives**, and **tradeoffs** — grounded in the actual code, not generic best practices.

For system-wide context (data model, agent API, folder layout), see [`architecture.md`](./architecture.md).

---

## 1. Component Design

### Decision: Soft container/presentational split with composition

The app does **not** enforce a strict smart/dumb boundary, but the split is recognizable:

| Role | Examples | Responsibility |
|------|----------|----------------|
| **Page containers** | `EditorPage` → `EditorSession`, `MyDiagramsPage`, `TemplatesPage` | Wire hooks/loaders; compose feature shells |
| **Feature shells** | `CodeEditor`, `TopBar`, `Preview`, `AiPanel` | Local UI state; editor shells read `useEditor()` |
| **Logic hooks** | `useDiagramEditor`, `useAgentChat`, `usePersistedConversation` | Business logic extracted from components |
| **Presentational** | `DiagramCard`, `FolderCard`, `PageHeader`, `SearchInput`, `MermaidRender`, `StarButton` | Render from props; minimal logic |

**Composition over inheritance** is used throughout:

- `AppLayout` → `AppSidebar` + `children`
- `CodeEditor` → `NoteEditor` | `MarkdownPreview` | `TemplateSelect` | `AiPanel`
- `EditorSession` → `EditorProvider` → `TopBar` + `CodeEditor` + `Preview`

**Single responsibility** is mostly respected: `MermaidRender` only renders SVG; `ExportDropdown` only handles export actions; `VersionHistoryPanel` only manages history UI.

### Exceptions (intentional pragmatism)

Some “card” components reach into data/actions directly instead of receiving callbacks from a parent:

- `DiagramCard` calls `toggleStar(diagram.id)` from `diagramRepository`
- `TemplateCard` uses `useStartNewDiagram()` internally

This keeps page JSX flat at the cost of mixing presentation with a single side effect. Acceptable at current scale; would refactor to `onStar` / `onUse` props if cards gain more behavior.

### Editor boundary (the most important split)

```
EditorPage (useLoaderData → DiagramRecord)
  └── EditorSession key={id}           ← remounts on diagram switch
        ├── useDiagramEditor({ initial })  ← persisted state + autosave
        ├── useDebouncedPreview()
        ├── EditorProvider               ← shared editor API via useEditor()
        ├── TopBar ()                    ← zero props
        ├── CodeEditor (panelMode only)  ← 2 props; rest from context
        └── Preview (preview + export)   ← siblings, no direct coupling
```

`EditorSession` is the composition root. `EditorProvider` collapses the former 9–13 prop surfaces on `TopBar` / `CodeEditor` into a single context value. `CodeEditor` and `Preview` remain siblings — preview validation flows up via `onRenderResult` and back down through `validateDiagramCode` on the context.

---

## 2. State Architecture

### Decision: Hook-centric local state + two scoped Contexts; no global store

| State kind | Location | Examples |
|------------|----------|----------|
| **Persisted diagram state** | `useDiagramEditor` | `title`, `code`, `noteMd`, `folderPath`, `saveStatus` |
| **Editor API surface** | `EditorContext` (scoped to `EditorSession`) | setters, versions, `validateDiagramCode`, agent apply |
| **Persisted list data** | Dexie via `useLiveQuery` in hooks/pages | diagrams, folders, versions |
| **AI chat state** | `useAgentChat` reducer | messages, streaming, tool status |
| **Ephemeral editor UI** | `EditorSession` local `useState` | `panelMode`, `zoom` |
| **Ephemeral feature UI** | Component local `useState` | `aiOpen` in `CodeEditor`, search query on pages |
| **App chrome** | `SidebarContext` | `collapsed`, `mobileOpen`, `isMobile` |
| **Browser persistence** | `useLocalStorage` | sidebar collapsed preference |

**No Redux, Zustand, or Jotai.** Context is limited to genuine cross-cutting UI: sidebar chrome (app-wide) and editor API (one session at a time).

### What was deliberately *not* globalized

- Editor context is **scoped** under `EditorSession` — invalid outside the editor route
- AI chat reducer stays in `useAgentChat`, not Context — only `AiPanel` consumes it
- Modal/panel open state stays local — no “UI slice” in global state

### Lifted state pattern

`EditorSession` lifts `panelMode` and `zoom` because `CodeEditor` and `Preview` are siblings. Diagram content lives in `useDiagramEditor` and is exposed through `EditorProvider` so `TopBar` and `CodeEditor` do not receive wide prop lists.

### Refs for imperative / stale-closure concerns

`useAutosave` tracks `savedSnapshot` and `isSavingRef`. `useAgentChat` keeps `diagramCodeRef`, `noteMdRef`, `diagramTitleRef`, and `abortRef` so the SSE pause/continue loop reads fresh diagram context without restarting on every keystroke. `previewValidationRef` in `EditorSession` caches the last Mermaid render result for validate/agent paths.

---

## 3. Data Fetching & Server State

### Decision: IndexedDB as primary store; Dexie live queries instead of React Query

This app has **no remote diagram API**. “Server state” and “client state” collapse into two buckets:

| Source | Mechanism | Loading / error |
|--------|-----------|-----------------|
| **IndexedDB** | Route loaders (`ensureDbReady`, `diagramLoader`) + `useLiveQuery` | `DbErrorPage` / `EditorErrorPage` via `errorElement`; dashboard `db-error-banner` |
| **Agent API** | Imperative `fetch` + SSE in `streamChat.ts` | `AgentChatError`; inline error bubbles in `AiPanel` |

**React Query / SWR are not used** — and that is appropriate here. `useLiveQuery` from `dexie-react-hooks` provides reactive subscriptions to local tables, which is the closest equivalent:

```ts
// useFolderBrowser.ts — root loader already awaited ensureDbReady()
const diagrams = useLiveQuery(
  () => (dbError ? [] : listDiagrams({ folderPath })),
  [folderPath, dbError],
  [],
)
```

When a diagram is updated via `diagramRepository`, all subscribed components re-render automatically — no manual cache invalidation.

### One-shot loads vs subscriptions

| Pattern | Used for |
|---------|----------|
| React Router `loader` | `ensureDbReady`, `getDiagram`, `createDiagram` + redirect |
| `useLiveQuery` | Lists that should stay fresh (diagrams, folders, versions) |
| `useLoaderData()` | Editor hydrates from `diagramLoader` — no mount-time fetch effect |
| `usePersistedConversation` | Load chat on `diagramId` change; debounced save via `useDebouncedEffect` |

### Agent fetch is intentionally imperative

`streamAgentChat` / `continueAgentChat` are async functions with callback handlers (`onDelta`, `onDone`, `onError`). This fits a streaming protocol that pauses mid-flight for client tool execution. A query-library model would fight the pause/continue loop.

### Repository layer (mandatory indirection)

Components and hooks call `lib/db/*Repository.ts`, not `db.*` directly — with two card-level exceptions noted above. Repositories own transactions, normalization, and cascade deletes.

---

## 4. Custom Hooks

### Decision: Hooks are the primary unit of business logic reuse

| Hook | Extracts |
|------|----------|
| `useDiagramEditor` | Form state, autosave via `useAutosave`, versioning, agent apply, template apply |
| `useAutosave` | Generic debounced persist + `dirty` / `saved` / `saving` / `error` |
| `useDebouncedValue` | Primitive value debounce |
| `useDebouncedEffect` | Effect debounce (conversation save) |
| `useAgentChat` | AI reducer, SSE stream/pause/continue, abort, tool dispatch |
| `usePersistedConversation` | IndexedDB chat load/save/clear |
| `useEditor` | `EditorContext` consumer |
| `useFolderBrowser` | URL path param, folder tree derivation, create folder |
| `useDebouncedPreview` | 300ms debounce before Mermaid re-render |
| `usePreviewViewport` | Pan, zoom, wheel, fit-to-view pointer logic |
| `useStartNewDiagram` | Create diagram in DB + navigate, `creating` guard |
| `useDbReady` | Legacy `db.open()` check for dashboard banner |
| `useSidebar` | Context consumer |
| `useLocalStorage` | JSON sync to localStorage |
| `useMediaQuery` | Responsive breakpoint |

**Pages stay thin.** `MyDiagramsPage` is mostly JSX wiring `useFolderBrowser` + search filter `useMemo`. `EditorPage` is loader data + `EditorSession` key.

### Smell check: `useDiagramEditor` (~200 lines)

Complexity is concentrated here and in `useAgentChat` — appropriate for domain logic. `useDiagramEditor` now:

- Accepts `initial: DiagramRecord` from the route loader (no load effect)
- Delegates debounced persist to `useAutosave`
- 1 `useEffect` (`beforeunload` guard)
- `useCallback` handlers for restore, agent apply, template

Further growth: split **versioning** or **agent apply** into sub-hooks — not back into components.

### `lib/diagram/startNewDiagram.ts`

Navigation + DB create is a plain async function, wrapped by `useStartNewDiagram` for the React lifecycle. Good separation: testable without rendering.

---

## 5. Component Hierarchy & Folder Structure

### Decision: Layer-based with one feature subfolder

```
src/
  pages/           ← route entry points
  components/      ← shared UI
    editor/        ← editor feature (co-located CSS)
  hooks/           ← React logic
  lib/             ← non-React utilities + repositories
  context/         ← SidebarContext + EditorContext (scoped)
  data/            ← static seed + templates
  config/          ← tunables
```

**Not feature-based** (`/features/editor/`, `/features/dashboard/`). At ~80 source files this is still navigable. The `components/editor/` subfolder is the main domain boundary.

### Co-location conventions

| Asset | Location |
|-------|----------|
| Editor CSS | `components/editor/*.css` next to component |
| Global design tokens | `src/styles/gemini.css` imported from `index.css` |
| Tests | Not present in codebase |
| Hook tests | Not present |

### Traceability rule

A bug in “diagram didn’t save” → `useDiagramEditor` → `diagramRepository`.  
A bug in “folder count wrong” → `useFolderBrowser` → `pathUtils`.  
A bug in “AI didn’t update diagram” → `useAgentChat` → `toolRegistry` → `streamChat` → server `agent.ts`.

---

## 6. Side Effect Management

### Decision: Effects for subscriptions and lifecycle; event handlers for user actions

**Appropriate `useEffect` usage:**

| Location | Purpose | Cleanup |
|----------|---------|---------|
| `useAutosave` | Debounced persist on snapshot change | `clearTimeout` |
| `useDiagramEditor` | `beforeunload` guard | `removeEventListener` |
| `useDebouncedPreview` | Debounce code → preview | `clearTimeout` |
| `useDebouncedEffect` | Debounced conversation save | `clearTimeout` |
| `usePersistedConversation` | Load conversation on `diagramId` | `cancelled` flag |
| `useAgentChat` | Sync diagram refs; scroll messages; abort on unmount | `abort()` |
| `MermaidRender` | Async `mermaid.render` | `cancelled` flag + DOM cleanup |
| `SidebarContext` | Lock body scroll when mobile open | restore overflow |
| `SidebarContext` | Close drawer on route change | — |
| `newDiagramLoader` | Create diagram at `/editor` | — (loader, not component) |

**Derived state uses `useMemo`, not effects:**

- Search filters on `MyDiagramsPage`, `TemplatesPage`
- Folder tree derivation in `useFolderBrowser`
- Breadcrumbs, child folders, recent diagrams

**Event handlers for user intent:**

- Save is **not** triggered by a button — `useAutosave` debounces `persistSnapshot` (acceptable for autosave UX)
- Agent send, template apply, version restore, folder create — all handler-driven
- `validateDiagramCode` runs in click handler (`CodeEditor`) or `toolRegistry` during agent pause — reuses preview cache when possible

### Known effect coupling (acceptable tradeoff)

`useAutosave` derives `dirty` via `useMemo` against `savedSnapshot` and schedules persist in a `useEffect` — explicit separation of derived dirty state from the debounce timer.

### Double `requestAnimationFrame` in `Preview`

`scheduleFitToView` uses rAF × 2 to wait for SVG layout — a DOM-timing effect workaround, not data flow.

---

## 7. Prop Design & Component API

### Decision: Context for editor seams; narrow props elsewhere

**Well-narrowed APIs (post-refactor):**

```ts
TopBar()                                    // reads useEditor()
CodeEditor({ panelMode, onPanelModeChange }) // 2 props; rest from context
DiagramCard({ diagram }: { diagram: DiagramRecord })
FolderCard({ path, name, count, color, iconColor, onOpen })
SearchInput({ placeholder, value, onChange })
MermaidRender({ code, onResult?, className?, scale? })
```

**Remaining wide API:**

| Component | Prop count | Notes |
|-----------|------------|-------|
| `AiPanel` | 9 | Bridge between `CodeEditor` local `aiOpen` and `useAgentChat`; could shrink if chat moves fully into context |

`EditorProvider` eliminated the former 9-prop `TopBar` and 13-prop `CodeEditor` surfaces. `Preview` still takes explicit `previewCode` vs `exportCode` because debounce timing differs.

### Patterns used

- **Scoped context** for editor fields consumed by multiple siblings (`useEditor`)
- **Controlled inputs** via context setters, not `defaultCode`
- **Optional callbacks** on `AiPanel`: `onAgentDiagramSave?`, `validateDiagramCode?`
- **Discriminated modes** via props: `panelMode: 'code' | 'note'`
- **No render props, no compound components** — kept simple

### Red flag avoided

`TopBar` and `CodeEditor` no longer receive the full editor hook return — they pull only what they need from `EditorContextValue`.

---

## 8. Memoization Strategy

### Decision: Minimal — no `React.memo`, targeted `useMemo` / `useCallback`

| Tool | Usage in codebase |
|------|-------------------|
| `React.memo` | **None** |
| `useMemo` | Search/filter lists; folder browser derived data |
| `useCallback` | `useDiagramEditor` persist handlers; `usePreviewViewport` pointer handlers; `Preview` fit-to-view |

**Rationale:** The app is not list-heavy at a scale where row memoization matters. `MermaidRender` is the expensive child and re-renders are already gated by `useDebouncedPreview` (300ms). Adding `React.memo` to cards would add comparison overhead with little gain.

**`useCallback` in `usePreviewViewport`** stabilizes handlers passed to DOM event props on `Preview` — reasonable for a hook that returns a handler bundle.

### When to add memoization later

- Dashboard with 100+ live-updating `DiagramCard` thumbnails
- Profiling shows `MermaidRender` re-rendering on unrelated parent state (e.g. sidebar toggle)

---

## 9. Error Boundaries & Route Errors

### Decision: Route-level `errorElement`; no React `ErrorBoundary` yet

React Router loaders throw `Response` objects for expected failures; dedicated error pages render instead of the route element.

| Failure | Handling |
|---------|----------|
| DB open failure | `rootLoader` → `DbErrorPage` (`errorElement` on `/`) |
| Diagram not found | `diagramLoader` 404 → `EditorErrorPage` |
| DB degraded on dashboard | `db-error-banner` via `useFolderBrowser().dbError` |
| Mermaid parse/render | Inline error in `MermaidRender`; validate message in `CodeEditor` |
| Agent API failure | Error bubble in `AiPanel` chat |
| Save failure | `saveStatus: 'error'` in `TopBar` |
| Server 500 | JSON error from Hono `onError` |

**Gap:** Uncaught **render** throws still crash the full SPA — loaders do not catch component exceptions.

**Recommended addition (not yet built):**

```
<ErrorBoundary fallback={<EditorCrash />}>
  <EditorSession />
</ErrorBoundary>
```

Place at **page level** inside `EditorPage` — not around every `MermaidRender`.

---

## 10. Routing Architecture

### Decision: `createBrowserRouter` with loaders; no lazy loading; no auth guards

```tsx
// router.tsx (simplified)
createBrowserRouter([
  {
    path: '/',
    loader: rootLoader,           // ensureDbReady()
    errorElement: <DbErrorPage />,
    element: <SidebarProvider><AppShell /></SidebarProvider>,
    children: [
      { index: true, element: <MyDiagramsPage /> },
      { path: 'editor', loader: newDiagramLoader },  // create + redirect
      {
        path: 'editor/:id',
        loader: diagramLoader,
        errorElement: <EditorErrorPage />,
        element: <EditorPage />,
      },
      // templates, legacy redirects…
    ],
  },
])
```

| Choice | Rationale |
|--------|-----------|
| Routes in `router.tsx` | Loaders + `errorElement` need data APIs outside JSX components |
| `newDiagramLoader` at `/editor` | Creates DB record then `redirect()` — no mount-only redirect component |
| `diagramLoader` | Hydrates editor before paint; 404 is a thrown `Response` |
| `EditorSession key={id}` | Full remount on diagram switch — resets local UI state |
| Legacy redirects (`/diagrams`, `/examples`) | Backward-compatible URLs |
| No `React.lazy` | Bundle is small; simplicity over code splitting |
| No protected routes | No auth in v1 |

**Folder navigation** uses `?path=` query params on `/`, not nested routes — keeps one page component, puts folder state in URL.

### SidebarProvider wraps route outlet

`SidebarProvider` uses `useLocation` to close the mobile drawer on navigation — routing and layout are intentionally coupled at the provider level. `main.tsx` renders `<RouterProvider router={router} />`.

---

## Quick Diagnostic — This Codebase

| Question | Mermaid Studio answer |
|----------|----------------------|
| Can I find where a bug would live in under 30 seconds? | **Mostly yes** — hooks map to domains; repositories map to tables |
| Do components re-render unexpectedly? | **Unlikely** — preview debounced; live queries scoped; no global store fan-out |
| Is the same fetch logic repeated in multiple components? | **No** — repositories + hooks; agent stream centralized in `streamChat.ts` |
| Do components accept 10+ props? | **No at editor seams** — `TopBar`/`CodeEditor` use `useEditor()`; `AiPanel` still ~9 |
| Is `useEffect` used for derived values? | **Rarely** — filters use `useMemo`; dirty via `useAutosave` + `useMemo` |
| Is global state full of UI state? | **No** — sidebar app-wide; editor context scoped to session |

### Trace a user action: “Edit diagram title”

```
TopBar input onChange
  → setTitle via useEditor() → useDiagramEditor
  → useAutosave marks saveStatus 'dirty'
  → 1500ms debounce → persistSnapshot → updateDiagram (repository)
  → Dexie put → useLiveQuery subscribers refresh (dashboard card meta)
  → saveStatus 'saved'
```

### Trace: “Ask AI to fix diagram”

```
AiPanel → useAgentChat.sendMessage
  → streamAgentChat (SSE via eventsource-parser)
  → on tool_call: runAgentTool (toolRegistry)
  → onDiagramUpdate + validateDiagramCode (preview cache)
  → applyAgentDiagramUpdate → DB + version snapshot
  → continueAgentChat (conversationState round-trip)
```

A new developer can follow these paths without crossing global state or hidden context.

---

## Summary of Architectural Bets

| Bet | Choice | Payoff | Risk |
|-----|--------|--------|------|
| State location | Fat hooks, thin pages, scoped context | Clear seams; narrow component APIs | `useAgentChat` + `useDiagramEditor` may need splitting |
| Persistence | Dexie + repositories + route loaders | Offline-first; loader-hydrated editor | No sync, no React Query ecosystem |
| Global state | Sidebar + scoped `EditorContext` | No over-centralization | Editor context invalid outside `EditorSession` |
| AI integration | `useAgentChat` + imperative SSE | Pause/validate flow; thin `AiPanel` | Stateless `conversationState` round-trip |
| Validation | Single Mermaid render path | No duplicate render on validate | Cache invalid when code ≠ debounced preview |
| Memoization | Minimal | Simple mental model | May need tuning at scale |
| Error handling | Route `errorElement` + inline UI | Loader/DB/diagram failures isolated | Render throws still need `ErrorBoundary` |
| Routing | `createBrowserRouter` + loaders | No `NewEditorRedirect`; no load effects | Client-only IndexedDB loaders |
| Folder structure | Layer + `editor/` + `shared/agent` | Works at current size | May need `/features` split later |

---

## When to Revisit These Decisions

- **Add React Query** if a remote diagram API replaces IndexedDB
- **Widen or duplicate `EditorContext`** if split-view or multiple simultaneous editor panes are needed
- **Shrink `AiPanel` props** by moving chat into context or a dedicated provider
- **Add `React.lazy`** when `mermaid` + editor chunk exceeds acceptable FCP
- **Add component error boundaries** for non-route failures (export, render edge cases)
- **Move to feature folders** when `src/components` exceeds ~30 top-level files

---

## Refactor cross-reference

The **collapse duplicated mechanisms** refactor (see [`architecture.md` §21](./architecture.md#21-refactor-collapse-duplicated-mechanisms)) drove most updates in this document: route loaders, `EditorContext`, debounce hooks, `useAgentChat` split, and single-path Mermaid validation.

---

*Derived from the `mermaid-plan` React client after the collapse-duplicated-mechanisms refactor. Pair with [`architecture.md`](./architecture.md) for full-stack context.*
