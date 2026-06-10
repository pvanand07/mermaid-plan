export type AgentChatRole = 'user' | 'assistant'

export interface AgentChatMessage {
  role: AgentChatRole
  content: string
}

export interface MermaidToolResult {
  ok: boolean
  error?: string
  phase?: 'parse' | 'render'
  diagramType?: string
}

export interface NoteToolResult {
  ok: boolean
  error?: string
}

export type AgentToolResult = MermaidToolResult | NoteToolResult

export interface UpdateMermaidToolCall {
  id: string
  name: 'update_mermaid'
  arguments: {
    code: string
    commitMessage?: string
  }
}

export interface UpdateNoteToolCall {
  id: string
  name: 'update_note'
  arguments: {
    noteMd: string
    commitMessage?: string
  }
}

export type AgentToolCall = UpdateMermaidToolCall | UpdateNoteToolCall

export interface DiagramContextPayload {
  diagramCode?: string
  noteMd?: string
  diagramTitle?: string
}

export interface AgentStreamRequest extends DiagramContextPayload {
  messages: AgentChatMessage[]
  model?: string
}

export interface AgentContinueRequest extends DiagramContextPayload {
  sessionId: string
  toolCallId: string
  toolCallName: 'update_mermaid' | 'update_note'
  toolResult: AgentToolResult
  model?: string
}

export interface AgentStreamPauseInfo {
  sessionId: string
  toolCallId: string
  toolCall: AgentToolCall
}
