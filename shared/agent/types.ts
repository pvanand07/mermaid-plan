import type { z } from 'zod'
import type {
  chatMessageSchema,
  chatRequestSchema,
  continueRequestSchema,
  diagramRenderStatusSchema,
  toolResultSchema,
} from './schemas.ts'

export type ChatMessage = z.infer<typeof chatMessageSchema>
export type AgentToolResult = z.infer<typeof toolResultSchema>
export type DiagramRenderStatus = z.infer<typeof diagramRenderStatusSchema>
export type AgentChatRequest = z.infer<typeof chatRequestSchema>
export type AgentContinueRequest = z.infer<typeof continueRequestSchema>

export interface DiagramContextPayload {
  diagramCode?: string
  noteMd?: string
  diagramTitle?: string
  diagramRenderStatus?: DiagramRenderStatus
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
  paused?: boolean
  toolCall?: AgentToolCallPayload
  conversationState?: unknown
  usage?: {
    inputTokens?: number
    outputTokens?: number
    totalTokens?: number
  }
}
