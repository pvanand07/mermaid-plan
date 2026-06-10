export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  role: ChatRole
  content: string
}

export interface AgentChatRequest {
  messages: ChatMessage[]
  diagramCode?: string
  model?: string
}

export interface AgentChatResponse {
  message: ChatMessage
  model: string
  usage?: {
    inputTokens?: number
    outputTokens?: number
    totalTokens?: number
  }
}
