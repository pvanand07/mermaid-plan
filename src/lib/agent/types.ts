export type AgentChatRole = 'user' | 'assistant'

export interface AgentChatMessage {
  role: AgentChatRole
  content: string
}

export interface AgentStreamRequest {
  messages: AgentChatMessage[]
  diagramCode?: string
  model?: string
}
