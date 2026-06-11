import type { AgentToolResult } from './types'

export type ChatMessageRole = 'assistant' | 'user'

export interface ToolStatus {
  toolName?: 'update_mermaid' | 'update_note'
  commitMessage?: string
  result: AgentToolResult
}

export interface ChatMessage {
  id: string
  role: ChatMessageRole
  content: string
  streaming?: boolean
  error?: boolean
  toolStatus?: ToolStatus
}

export const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Hi! I can help you write, refine, and explain Mermaid diagrams. Describe what you want to build or ask a question about your current diagram.',
}

export const SUGGESTED_PROMPTS = [
  'Create a flowchart for user login',
  'Explain this diagram',
  'Document this diagram in the note',
  'Add error handling branches',
]
