import type { ChatMessage } from '../shared/agent/types.ts'

export type {
  AgentChatRequest,
  AgentChatResponse,
  AgentContinueRequest,
  AgentToolCallPayload,
  AgentToolResult,
  ChatMessage,
  DiagramContextPayload,
  UpdateMermaidToolCallPayload,
  UpdateNoteToolCallPayload,
} from '../shared/agent/types.ts'

export type ChatRole = ChatMessage['role']
