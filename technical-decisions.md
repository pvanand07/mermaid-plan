# Mermaid Studio — React Technical Decisions

How this codebase applies common React architecture principles. Each section states the **decision made**, **where it lives**, and **tradeoffs** — grounded in the actual code, not generic best practices.

For system-wide context (data model, agent API, folder layout), see [`architecture.md`](./architecture.md).

---

## 1. Component Design

### Decision: Soft container/presentational split with composition

The app does **not** enforce a strict smart/dumb boundary, but the split is recognizable:

| Role | Examples | Responsibility |
|------|----------|----------------|
| **Page containers** | `EditorPage` → `EditorSession`, `MyDiagramsPage`, `TemplatesPage` | Wire hooks, handle loading/not-found, pass props to children |
| **Feature shells** | `CodeEditor`, `TopBar`, `Preview`, `AiPanel` | Own local UI state; receive data + callbacks from parent |
| **Presentational** | `DiagramCard`, `FolderCard`, `PageHeader`, `SearchInput`, `MermaidRender`, `StarButton` | Render from props; minimal logic |

**Composition over inheritance** is used throughout:

- `AppLayout` → `AppSidebar` + `children`
- `CodeEditor` → `NoteEditor` | `MarkdownPreview` | `TemplateSelect` | `AiPanel`
- `EditorSession` → `TopBar` + `CodeEditor` + `Preview`

**Single responsibility** is mostly respected: `MermaidRender` only renders SVG; `ExportDropdown` only handles export actions; `VersionHistoryPanel` only manages history UI.

### Exceptions (intentional pragmatism)

Some “card” components reach into data/actions directly instead of receiving callbacks from a parent:

- `DiagramCard` calls `toggleStar(diagram.id)` from `diagramRepository`
- `TemplateCard` uses `useStartNewDiagram()` internally

This keeps page JSX flat at the cost of mixing presentation with a single side effect. Acceptable at current scale; would refactor to `onStar` / `onUse` props if cards gain more behavior.

### Editor boundary (the most important split)

```
EditorPage (route param)
  └── EditorSession key={id}     ← remounts on diagram switch
        ├── useDiagramEditor()   ← all persisted editor state + save logic
        ├── useDebouncedPreview()
        └── local UI: panelMode, zoom
```

`EditorSession` is the container. `CodeEditor` and `Preview` are siblings that never talk to each other — all coordination goes through the parent. This is the cleanest architectural seam in the app.

---

## 2. State Architecture

### Decision: Hook-centric local state + one Context; no global store

| State kind | Location | Examples |
|------------|----------|----------|
| **Persisted diagram state** | `useDiagramEditor` | `title`, `code`, `noteMd`, `folderPath`, `saveStatus` |
| **Persisted list data** | Dexie via `useLiveQuery` in hooks/pages | diagrams, folders, versions |
| **Ephemeral editor UI** | `EditorSession` local `useState` | `panelMode`, `zoom` |
| **Ephemeral feature UI** | Component local `useState` | `aiOpen` in `CodeEditor`, `open` in `VersionHistoryPanel`, search query on pages |
| **App chrome** | `SidebarContext` | `collapsed`, `mobileOpen`, `isMobile` |
| **Browser persistence** | `useLocalStorage` | sidebar collapsed preference |

**No Redux, Zustand, or Jotai.** The only React Context is sidebar layout — a genuine app-wide UI concern.

### What was deliberately *not* globalized

- Editor state stays in `useDiagramEditor`, not Context — only one editor mounts at a time
- AI chat messages stay in `AiPanel` — scoped to the open panel + persisted per diagram in IndexedDB
- Modal/panel open state stays local — no “UI slice” in global state

### Lifted state pattern

`EditorSession` lifts `panelMode` and `zoom` because both `CodeEditor` and `Preview` are siblings. Diagram content state is lifted into the hook and passed down as controlled props (`code` + `setCode`).

### Refs for imperative / stale-closure concerns

`useDiagramEditor` uses refs for save deduplication (`lastSavedRef`, `isSavingRef`, `saveTimerRef`). `AiPanel` uses refs (`diagramCodeRef`, `noteMdRef`, `abortRef`) so the agent loop always reads the latest diagram context without re-subscribing mid-stream.

---

## 3. Data Fetching & Server State

### Decision: IndexedDB as primary store; Dexie live queries instead of React Query

This app has **no remote diagram API**. “Server state” and “client state” collapse into two buckets:

| Source | Mechanism | Loading / error |
|--------|-----------|-----------------|
| **IndexedDB** | Repository functions + `useLiveQuery` | `useDbReady()` → `{ ready, loading, dbError }`; per-page banners |
| **Agent API** | Imperative `fetch` + SSE in `streamChat.ts` | `AgentChatError`; inline error bubbles in `AiPanel` |

**React Query / SWR are not used** — and that is appropriate here. `useLiveQuery` from `dexie-react-hooks` provides reactive subscriptions to local tables, which is the closest equivalent:

```ts
// useFolderBrowser.ts
const diagrams = useLiveQuery(
  () => (ready && !dbError ? listDiagrams() : []),
  [ready, dbError],
  [],
)
```

When a diagram is updated via `diagramRepository`, all subscribed components re-render automatically — no manual cache invalidation.

### One-shot loads vs subscriptions

| Pattern | Used for |
|---------|----------|
| `useLiveQuery` | Lists that should stay fresh (diagrams, folders, versions) |
| `useEffect` + `getDiagram(id)` | Initial editor load with cancellation flag |
| `useEffect` + `getConversation(diagramId)` | AI chat hydration on diagram mount |
| Debounced `saveConversation` | Write path, not a subscription |

### Agent fetch is intentionally imperative

`streamAgentChat` / `continueAgentChat` are async functions with callback handlers (`onDelta`, `onDone`, `onError`). This fits a streaming protocol that pauses mid-flight for client tool execution. A query-library model would fight the pause/continue loop.

### Repository layer (mandatory indirection)

Components and hooks call `lib/db/*Repository.ts`, not `db.*` directly — with two card-level exceptions noted above. Repositories own transactions, normalization, and cascade deletes.

---

## 4. Custom Hooks

### Decision: Hooks are the primary unit of business logic reuse

| Hook | Extracts |
|------|----------|
| `useDiagramEditor` | Load, autosave, dirty tracking, versioning, agent apply, template apply |
| `useFolderBrowser` | URL path param, folder tree derivation, create folder |
| `useDebouncedPreview` | 300ms debounce before Mermaid re-render |
| `usePreviewViewport` | Pan, zoom, wheel, fit-to-view pointer logic |
| `useStartNewDiagram` | Create diagram in DB + navigate, `creating` guard |
| `useDbReady` | One-time `db.open()` with error capture |
| `useSidebar` | Context consumer |
| `useLocalStorage` | JSON sync to localStorage |
| `useMediaQuery` | Responsive breakpoint |

**Pages stay thin.** `MyDiagramsPage` is mostly JSX wiring `useFolderBrowser` + search filter `useMemo`. `EditorPage` delegates to `EditorSession`.

### Smell check: `useDiagramEditor` (~265 lines)

This is the largest hook and the right place for complexity — it would be worse spread across `EditorSession` effects. It uses:

- 4 `useEffect` blocks (load, dirty/autosave, beforeunload)
- 5 `useCallback` handlers (persist, restore, agent apply, template)
- 4 `useRef` guards

If the editor grows further, split along **persistence** vs **form state** sub-hooks — not by moving logic back into components.

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
  context/         ← single Sidebar context
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
A bug in “AI didn’t update diagram” → `AiPanel` → `streamChat` → server `agent.ts`.

---

## 6. Side Effect Management

### Decision: Effects for subscriptions and lifecycle; event handlers for user actions

**Appropriate `useEffect` usage:**

| Location | Purpose | Cleanup |
|----------|---------|---------|
| `useDiagramEditor` | Load diagram on `id` change | `cancelled` flag |
| `useDiagramEditor` | Debounced autosave on content change | `clearTimeout` |
| `useDiagramEditor` | `beforeunload` guard | `removeEventListener` |
| `useDebouncedPreview` | Debounce code → preview | `clearTimeout` |
| `AiPanel` | Load conversation on `diagramId` | `cancelled` flag |
| `AiPanel` | Debounced conversation save | `clearTimeout` |
| `AiPanel` | Abort in-flight stream on unmount | `abort()` |
| `MermaidRender` | Async `mermaid.render` | `cancelled` flag + DOM cleanup |
| `SidebarContext` | Lock body scroll when mobile open | restore overflow |
| `SidebarContext` | Close drawer on route change | — |
| `NewEditorRedirect` | Create diagram once on mount | `startedRef` guard |

**Derived state uses `useMemo`, not effects:**

- Search filters on `MyDiagramsPage`, `TemplatesPage`
- Folder tree derivation in `useFolderBrowser`
- Breadcrumbs, child folders, recent diagrams

**Event handlers for user intent:**

- Save is **not** triggered by a button — it is debounced from the dirty-detection effect (acceptable for autosave UX)
- Agent send, template apply, version restore, folder create — all handler-driven
- `validateMermaidDiagram` runs in click handler (`CodeEditor`) or agent tool pause handler (`AiPanel`)

### Known effect coupling (acceptable tradeoff)

The autosave effect in `useDiagramEditor` both marks `dirty` and schedules `persist`. This is state-to-state sync via effect, but it is the standard debounced-autosave pattern. Alternative: derive `dirty` with `useMemo` comparing to `lastSavedRef` and use a separate effect only for the timer.

### Double `requestAnimationFrame` in `Preview`

`scheduleFitToView` uses rAF × 2 to wait for SVG layout — a DOM-timing effect workaround, not data flow.

---

## 7. Prop Design & Component API

### Decision: Controlled props + narrow callbacks; editor is the wide boundary

**Well-narrowed APIs:**

```ts
DiagramCard({ diagram }: { diagram: DiagramRecord })
FolderCard({ path, name, count, color, iconColor, onOpen })
SearchInput({ placeholder, value, onChange })
MermaidRender({ code, className?, scale?, onRendered?, onError? })
```

**Wide APIs (documented debt):**

| Component | Prop count | Notes |
|-----------|------------|-------|
| `CodeEditor` | 13 | Controlled editor + agent callbacks + panel mode |
| `AiPanel` | 9 | Needs diagram context + save hooks + minimize |
| `TopBar` | 9 | Title, folder, versions, save status |

These wide surfaces mark **integration components** — the seam between the editor hook and the UI tree. Mitigation already applied: pass `applyAgentDiagramUpdate` rather than the whole `editor` object; split `previewCode` vs `exportCode` on `Preview`.

### Patterns used

- **Controlled inputs:** `code` + `setCode`, not `defaultCode`
- **Optional callbacks** for non-critical paths: `onApplyTemplate?`, `onAgentDiagramSave?`
- **Discriminated modes** via props: `panelMode: 'code' | 'note'` instead of `showNote: boolean`
- **No render props, no compound components** — kept simple

### Red flag avoided

Components do not receive the full `DiagramRecord` when they only need `code` — except cards that genuinely display the whole record.

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

## 9. Error Boundaries

### Decision: Not implemented — inline error handling instead

There are **no `ErrorBoundary` components** and no `componentDidCatch` usage.

**Current fault isolation:**

| Failure | Handling |
|---------|----------|
| DB unavailable | `db-error-banner` at page level |
| Diagram not found | Conditional render in `EditorSession` |
| Mermaid parse/render | Inline error in `MermaidRender`; validate message in `CodeEditor` |
| Agent API failure | Error bubble in `AiPanel` chat |
| Save failure | `saveStatus: 'error'` in `TopBar` |
| Server 500 | JSON error from Hono `onError` |

**Gap:** An uncaught render throw in any component crashes the full SPA.

**Recommended addition (not yet built):**

```
<ErrorBoundary fallback={<EditorCrash />}>
  <EditorSession />
</ErrorBoundary>
```

Place at **page level** (`EditorPage`, `MyDiagramsPage`) — not around every `MermaidRender`.

---

## 10. Routing Architecture

### Decision: Flat explicit routes; no lazy loading; no auth guards

```tsx
// App.tsx
<Route path="/" element={<MyDiagramsPage />} />
<Route path="/templates" element={<TemplatesPage />} />
<Route path="/editor" element={<NewEditorRedirect />} />
<Route path="/editor/:id" element={<EditorPage />} />
```

| Choice | Rationale |
|--------|-----------|
| Routes in `App.tsx` | Small route table; easy to see entire map |
| `NewEditorRedirect` at `/editor` | Ensures DB record exists before `/editor/:id` |
| `EditorSession key={id}` | Full remount on diagram switch — resets local UI state |
| Legacy redirects (`/diagrams`, `/examples`) | Backward-compatible URLs |
| No `React.lazy` | Bundle is small; simplicity over code splitting |
| No protected routes | No auth in v1 |

**Folder navigation** uses `?path=` query params on `/`, not nested routes — keeps one page component, puts folder state in URL.

### SidebarProvider wraps router

`SidebarProvider` uses `useLocation` to close the mobile drawer on navigation — routing and layout are intentionally coupled at the provider level.

---

## Quick Diagnostic — This Codebase

| Question | Mermaid Studio answer |
|----------|----------------------|
| Can I find where a bug would live in under 30 seconds? | **Mostly yes** — hooks map to domains; repositories map to tables |
| Do components re-render unexpectedly? | **Unlikely** — preview debounced; live queries scoped; no global store fan-out |
| Is the same fetch logic repeated in multiple components? | **No** — repositories + hooks; agent stream centralized in `streamChat.ts` |
| Do components accept 10+ props? | **No at editor seams** — `EditorProvider` + `useEditor()` for `TopBar`/`CodeEditor` |
| Is `useEffect` used for derived values? | **Rarely** — filters use `useMemo`; autosave dirty via `useAutosave` + `useMemo` |
| Is global state full of UI state? | **No** — only sidebar chrome in Context |

### Trace a user action: “Edit diagram title”

```
TopBar input onChange
  → editor.setTitle (useDiagramEditor)
  → dirty effect detects change → saveStatus 'dirty'
  → 1500ms debounce → persist() → updateDiagram (repository)
  → Dexie put → useLiveQuery subscribers refresh (dashboard card meta)
  → saveStatus 'saved'
```

### Trace: “Ask AI to fix diagram”

```
AiPanel sendMessage
  → streamAgentChat (SSE)
  → on tool_call: update_mermaid
  → onDiagramUpdate(code) → editor state
  → resolveDiagramValidation (reuses preview render)
  → onAgentDiagramSave → applyAgentDiagramUpdate → DB + version snapshot
  → continueAgentChat (SSE resume)
```

A new developer can follow these paths without crossing global state or hidden context.

---

## Summary of Architectural Bets

| Bet | Choice | Payoff | Risk |
|-----|--------|--------|------|
| State location | Fat hooks, thin pages | Easy to test logic clusters | `useDiagramEditor` may need splitting |
| Persistence | Dexie + repositories | Offline-first, reactive UI | No sync, no React Query ecosystem |
| Global state | Context for sidebar + scoped editor | No over-centralization | Editor context only valid under `EditorSession` |
| AI integration | Imperative SSE + client tools | Matches pause/validate flow | Stateless continue payloads |
| Memoization | Minimal | Simple mental model | May need tuning at scale |
| Error handling | Route `errorElement` + DB loader | Page-level failure surfaces | Loader throws still need component guards |
| Routing | `createBrowserRouter` + loaders | Drops load effects, redirect page | Client-only IndexedDB loaders |
| Folder structure | Layer + `editor/` subfolder | Works at current size | May need `/features` split later |

---

## When to Revisit These Decisions

- **Add React Query** if a remote diagram API replaces IndexedDB
- **Add Zustand/Context for editor** if multiple editor panes or split-view are needed
- **Add `React.lazy`** when `mermaid` + editor chunk exceeds acceptable FCP
- **Add component error boundaries** for non-route failures (export, render edge cases)
- **Extract editor context** if a second consumer of `CodeEditor` appears outside `EditorSession`
- **Move to feature folders** when `src/components` exceeds ~30 top-level files

---

*Derived from the `mermaid-plan` React client. Pair with [`architecture.md`](./architecture.md) for full-stack context.*
