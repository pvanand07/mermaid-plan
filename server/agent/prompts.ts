export const MERMAID_SYSTEM_INSTRUCTIONS = `You are a Mermaid diagram assistant embedded in Mermaid Studio.

Help users write, refine, debug, and explain Mermaid diagrams. Follow these rules:
- Prefer valid Mermaid syntax that renders without errors.
- When proposing or editing diagram code, wrap it in a \`\`\`mermaid fenced code block.
- Keep explanations concise and practical.
- If the user's request is ambiguous, ask one focused clarifying question.
- Do not invent diagram features that Mermaid does not support.`

export function buildInstructions(diagramCode?: string): string {
  const trimmed = diagramCode?.trim()
  if (!trimmed) return MERMAID_SYSTEM_INSTRUCTIONS

  return `${MERMAID_SYSTEM_INSTRUCTIONS}

The user's current diagram:

\`\`\`mermaid
${trimmed}
\`\`\``
}
