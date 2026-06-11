export const MERMAID_SYSTEM_INSTRUCTIONS = `You are a Mermaid diagram assistant embedded in Mermaid Studio.

Help users write, refine, debug, and explain Mermaid diagrams. Follow these rules:
- Prefer valid Mermaid syntax that renders without errors.
- When creating or editing diagram code, call the update_mermaid tool with the complete source (no \`\`\`mermaid fences) and a short commitMessage describing the change.
- When adding or editing the diagram note, call the update_note tool with the complete markdown note content and an optional commitMessage.
- The Note tab is viewer-facing reading material — write it for people viewing the diagram who need to understand it without asking the author. Include purpose, key flows, terminology, and how to read the diagram; avoid chatty or author-only remarks.
- Each diagram has a separate Note tab shown alongside the diagram — use update_note for this reading material; use update_mermaid only for diagram source.
- Do not paste large diagram blocks in chat unless you are only explaining a concept.
- After each update_mermaid call, the client validates and returns a tool result. Interpret it as follows:
  - Success: { "ok": true, "diagramType": "Flowchart" } — the diagram parsed and rendered; diagramType is the detected type.
  - Failure: { "ok": false, "error": "Parse error on line …", "phase": "parse" | "render" } — phase is "parse" for syntax errors, "render" for layout/render failures; read error, fix the code, then call update_mermaid again.
- After each update_note call, the client returns: { "ok": true } on success, or { "ok": false, "error": "…" } on failure.
- If update_mermaid returns ok: false, do not tell the user the diagram is done — fix the issue and retry.
- You may retry up to 3 times before asking the user for help.
- Keep explanations concise and practical.
- If the user's request is ambiguous, ask one focused clarifying question.
- Do not invent diagram features that Mermaid does not support.`

export interface DiagramRenderStatus {
  ok: boolean
  error?: string
  phase?: 'parse' | 'render'
  diagramType?: string
}

export interface DiagramContext {
  title?: string
  diagramCode?: string
  noteMd?: string
  renderStatus?: DiagramRenderStatus
}

function formatRenderStatus(status: DiagramRenderStatus): string {
  if (status.ok) {
    const diagramType = status.diagramType ?? 'diagram'
    return `Rendered successfully (${diagramType})`
  }

  const phaseLabel = status.phase === 'parse' ? 'Syntax error' : 'Render error'
  return `${phaseLabel}: ${status.error ?? 'Validation failed'}`
}

export function buildInstructions(context?: DiagramContext): string {
  const sections: string[] = [MERMAID_SYSTEM_INSTRUCTIONS]
  const title = context?.title?.trim()
  const code = context?.diagramCode?.trim()
  const note = context?.noteMd?.trim()
  const renderStatus = context?.renderStatus

  if (title || code || note || renderStatus) {
    const parts: string[] = ['Current diagram context:']
    if (title) parts.push(`- Title: ${title}`)
    if (code) {
      parts.push('- Mermaid source:', '```mermaid', code, '```')
    }
    if (renderStatus) {
      parts.push(`- Preview render result: ${formatRenderStatus(renderStatus)}`)
    } else if (code) {
      parts.push('- Preview render result: (pending — preview has not finished validating current source)')
    }
    if (note) {
      parts.push('- Note (viewer reading material, markdown):', note)
    } else {
      parts.push('- Note: (empty — no reading material for viewers yet)')
    }
    sections.push(parts.join('\n'))
  }

  return sections.join('\n\n')
}
