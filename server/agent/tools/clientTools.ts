export const CLIENT_HANDLED_TOOL_NAMES = ['update_mermaid', 'update_note'] as const

export type ClientHandledToolName = (typeof CLIENT_HANDLED_TOOL_NAMES)[number]

export function isClientHandledTool(name: string): name is ClientHandledToolName {
  return (CLIENT_HANDLED_TOOL_NAMES as readonly string[]).includes(name)
}
