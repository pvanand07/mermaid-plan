import type {
  AgentChatRequest,
  AgentContinueRequest,
  AgentToolResult,
  ChatMessage,
  DiagramContextPayload,
} from '../../../shared/agent/types.ts'

export type AgentChatRole = ChatMessage['role']
export type AgentChatMessage = ChatMessage
export type MermaidToolResult = AgentToolResult & { phase?: 'parse' | 'render'; diagramType?: string }
export type NoteToolResult = AgentToolResult

export type { AgentToolResult, AgentContinueRequest, DiagramContextPayload }

export type AgentStreamRequest = AgentChatRequest

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

export interface AgentStreamPauseInfo {
  toolCallId: string
  toolCall: AgentToolCall
  conversationState: unknown
}
