import { updateMermaidTool } from './updateMermaid.js'
import { updateNoteTool } from './updateNote.js'

export const MERMAID_AGENT_TOOLS = [updateMermaidTool, updateNoteTool] as const

export { updateMermaidTool, updateNoteTool }
export type { UpdateMermaidInput, UpdateMermaidOutput } from './updateMermaid.js'
export type { UpdateNoteInput, UpdateNoteOutput } from './updateNote.js'
export { CLIENT_HANDLED_TOOL_NAMES, isClientHandledTool } from './clientTools.js'
export type { ClientHandledToolName } from './clientTools.js'
