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

export interface UpdateMermaidToolCall {
  id: string
  name: 'update_mermaid'
  arguments: {
    code: string
    summary?: string
  }
}

export interface AgentStreamRequest {
  messages: AgentChatMessage[]
  diagramCode?: string
  model?: string
}

export interface AgentContinueRequest {
  sessionId: string
  toolCallId: string
  toolResult: MermaidToolResult
  diagramCode?: string
  model?: string
}

export interface AgentStreamPauseInfo {
  sessionId: string
  toolCallId: string
  toolCall: UpdateMermaidToolCall
}
