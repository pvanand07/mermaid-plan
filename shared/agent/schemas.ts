import { z } from 'zod'

export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1),
})

export const toolResultSchema = z.object({
  ok: z.boolean(),
  error: z.string().optional(),
  phase: z.enum(['parse', 'render']).optional(),
  diagramType: z.string().optional(),
})

export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1),
  diagramCode: z.string().optional(),
  noteMd: z.string().optional(),
  diagramTitle: z.string().optional(),
  model: z.string().min(1).optional(),
})

export const continueRequestSchema = z.object({
  conversationState: z.unknown(),
  toolCallId: z.string().min(1),
  toolCallName: z.enum(['update_mermaid', 'update_note']),
  toolResult: toolResultSchema,
  diagramCode: z.string().optional(),
  noteMd: z.string().optional(),
  diagramTitle: z.string().optional(),
  model: z.string().min(1).optional(),
})
