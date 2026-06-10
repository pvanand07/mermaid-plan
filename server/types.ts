export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  role: ChatRole
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

export interface DiagramContextPayload {
  diagramCode?: string
  noteMd?: string
  diagramTitle?: string
}

export interface AgentChatRequest extends DiagramContextPayload {
  messages: ChatMessage[]
  model?: string
}

export interface AgentContinueRequest extends DiagramContextPayload {
  sessionId: string
  toolCallId: string
  toolCallName: 'update_mermaid' | 'update_note'
  toolResult: AgentToolResult
  model?: string
}

export interface UpdateMermaidToolCallPayload {
  id: string
  name: 'update_mermaid'
  arguments: {
    code: string
    commitMessage?: string
  }
}

export interface UpdateNoteToolCallPayload {
  id: string
  name: 'update_note'
  arguments: {
    noteMd: string
    commitMessage?: string
  }
}

export type AgentToolCallPayload = UpdateMermaidToolCallPayload | UpdateNoteToolCallPayload

export interface AgentChatResponse {
  message: ChatMessage
  model: string
  sessionId?: string
  paused?: boolean
  toolCall?: AgentToolCallPayload
  usage?: {
    inputTokens?: number
    outputTokens?: number
    totalTokens?: number
  }
}
