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

export interface AgentChatRequest {
  messages: ChatMessage[]
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

export interface AgentToolCallPayload {
  id: string
  name: string
  arguments: {
    code: string
    summary?: string
  }
}

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
