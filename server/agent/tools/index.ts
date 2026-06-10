import { updateMermaidTool } from './updateMermaid.js'

export const MERMAID_AGENT_TOOLS = [updateMermaidTool] as const

export { updateMermaidTool }
export type { UpdateMermaidInput, UpdateMermaidOutput } from './updateMermaid.js'
