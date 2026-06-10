import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { z } from 'zod'
import { config } from '../config.js'
import { createAgentContinueRun, createAgentRun } from '../agent/runAgent.js'
import { createAgentSession, getAgentSessionAccessor } from '../agent/sessionStore.js'
import { streamAgentResult } from '../agent/streamRun.js'
import { isClientHandledTool } from '../agent/tools/clientTools.js'
import type { AgentChatResponse, AgentToolCallPayload } from '../types.js'

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1),
})

const toolResultSchema = z.object({
  ok: z.boolean(),
  error: z.string().optional(),
  phase: z.enum(['parse', 'render']).optional(),
  diagramType: z.string().optional(),
})

const chatRequestSchema = z.object({
  messages: z.array(messageSchema).min(1),
  diagramCode: z.string().optional(),
  noteMd: z.string().optional(),
  diagramTitle: z.string().optional(),
  model: z.string().min(1).optional(),
})

const continueRequestSchema = z.object({
  sessionId: z.string().min(1),
  toolCallId: z.string().min(1),
  toolCallName: z.enum(['update_mermaid', 'update_note']),
  toolResult: toolResultSchema,
  diagramCode: z.string().optional(),
  noteMd: z.string().optional(),
  diagramTitle: z.string().optional(),
  model: z.string().min(1).optional(),
})

function missingKeyResponse(c: { json: (body: unknown, status?: number) => Response }) {
  return c.json(
    {
      error: 'Server is not configured',
      message: 'Set OPENROUTER_API_KEY in your environment to enable the agent API.',
    },
    503,
  )
}

function mapAgentError(error: unknown) {
  const statusCode =
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    typeof error.statusCode === 'number'
      ? error.statusCode
      : 500

  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String(error.message)
      : 'Agent request failed'

  return { statusCode, message }
}

export const agentRoutes = new Hono()

agentRoutes.post('/chat', async (c) => {
  if (!config.isConfigured) return missingKeyResponse(c)

  const parsed = chatRequestSchema.safeParse(await c.req.json())
  if (!parsed.success) {
    return c.json({ error: 'Invalid request', details: parsed.error.flatten() }, 400)
  }

  const { sessionId, accessor } = createAgentSession()

  try {
    const { result, model } = createAgentRun(parsed.data, { state: accessor })
    const [text, response] = await Promise.all([result.getText(), result.getResponse()])
    const toolCalls = await result.getToolCalls()
    const clientCall = toolCalls.find((call) => isClientHandledTool(call.name))

    const body: AgentChatResponse = {
      message: {
        role: 'assistant',
        content: text,
      },
      model,
      sessionId,
      paused: !!clientCall,
      toolCall: clientCall
        ? ({
            id: clientCall.id,
            name: clientCall.name,
            arguments: clientCall.arguments,
          } as AgentToolCallPayload)
        : undefined,
      usage: response.usage
        ? {
            inputTokens: response.usage.inputTokens,
            outputTokens: response.usage.outputTokens,
            totalTokens: response.usage.totalTokens,
          }
        : undefined,
    }

    return c.json(body)
  } catch (error) {
    const mapped = mapAgentError(error)
    return c.json({ error: mapped.message }, { status: mapped.statusCode as 400 })
  }
})

agentRoutes.post('/chat/stream', async (c) => {
  if (!config.isConfigured) return missingKeyResponse(c)

  const parsed = chatRequestSchema.safeParse(await c.req.json())
  if (!parsed.success) {
    return c.json({ error: 'Invalid request', details: parsed.error.flatten() }, 400)
  }

  const { sessionId, accessor } = createAgentSession()
  const { result, model } = createAgentRun(parsed.data, { state: accessor })

  return streamSSE(c, async (stream) => {
    try {
      await stream.writeSSE({
        event: 'meta',
        data: JSON.stringify({ model, sessionId }),
      })
      await streamAgentResult(result, stream, sessionId)
    } catch (error) {
      const mapped = mapAgentError(error)
      await stream.writeSSE({
        event: 'error',
        data: JSON.stringify({ error: mapped.message }),
      })
    }
  })
})

agentRoutes.post('/chat/continue', async (c) => {
  if (!config.isConfigured) return missingKeyResponse(c)

  const parsed = continueRequestSchema.safeParse(await c.req.json())
  if (!parsed.success) {
    return c.json({ error: 'Invalid request', details: parsed.error.flatten() }, 400)
  }

  const accessor = getAgentSessionAccessor(parsed.data.sessionId)
  if (!accessor) {
    return c.json({ error: 'Session not found or expired' }, 404)
  }

  const { result, model } = createAgentContinueRun(parsed.data, { state: accessor })

  return streamSSE(c, async (stream) => {
    try {
      await stream.writeSSE({
        event: 'meta',
        data: JSON.stringify({ model, sessionId: parsed.data.sessionId }),
      })
      await streamAgentResult(result, stream, parsed.data.sessionId)
    } catch (error) {
      const mapped = mapAgentError(error)
      await stream.writeSSE({
        event: 'error',
        data: JSON.stringify({ error: mapped.message }),
      })
    }
  })
})