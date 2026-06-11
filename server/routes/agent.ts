import type { Context } from 'hono'
import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { chatRequestSchema, continueRequestSchema } from '../../shared/agent/schemas.ts'
import { config } from '../config.js'
import { createEphemeralAccessor } from '../agent/ephemeralState.js'
import { createAgentContinueRun, createAgentRun } from '../agent/runAgent.js'
import { streamAgentResult } from '../agent/streamRun.js'
import { isClientHandledTool } from '../agent/tools/clientTools.js'
import type {
  AgentChatRequest,
  AgentChatResponse,
  AgentContinueRequest,
  AgentToolCallPayload,
} from '../types.js'

type ChatRequest = AgentChatRequest
type ContinueRequest = AgentContinueRequest

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

function streamAgent(c: Context, mode: 'chat' | 'continue', data: ChatRequest | ContinueRequest) {
  const accessor =
    mode === 'continue'
      ? createEphemeralAccessor((data as ContinueRequest).conversationState as never)
      : createEphemeralAccessor()

  const { result, model } =
    mode === 'continue'
      ? createAgentContinueRun(data as AgentContinueRequest, { state: accessor })
      : createAgentRun(data as ChatRequest, { state: accessor })

  return streamSSE(c, async (stream) => {
    try {
      await stream.writeSSE({
        event: 'meta',
        data: JSON.stringify({ model }),
      })
      await streamAgentResult(result, stream, accessor)
    } catch (error) {
      const mapped = mapAgentError(error)
      await stream.writeSSE({
        event: 'error',
        data: JSON.stringify({ error: mapped.message }),
      })
    }
  })
}

export const agentRoutes = new Hono()

agentRoutes.post('/chat', async (c) => {
  if (!config.isConfigured) return missingKeyResponse(c)

  const parsed = chatRequestSchema.safeParse(await c.req.json())
  if (!parsed.success) {
    return c.json({ error: 'Invalid request', details: parsed.error.flatten() }, 400)
  }

  const accessor = createEphemeralAccessor()

  try {
    const { result, model } = createAgentRun(parsed.data, { state: accessor })
    const [text, response] = await Promise.all([result.getText(), result.getResponse()])
    const toolCalls = await result.getToolCalls()
    const clientCall = toolCalls.find((call) => isClientHandledTool(call.name))
    const conversationState = clientCall ? await accessor.load() : undefined

    const body: AgentChatResponse = {
      message: {
        role: 'assistant',
        content: text,
      },
      model,
      paused: !!clientCall,
      toolCall: clientCall
        ? ({
            id: clientCall.id,
            name: clientCall.name,
            arguments: clientCall.arguments,
          } as AgentToolCallPayload)
        : undefined,
      conversationState,
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

  return streamAgent(c, 'chat', parsed.data)
})

agentRoutes.post('/chat/continue', async (c) => {
  if (!config.isConfigured) return missingKeyResponse(c)

  const parsed = continueRequestSchema.safeParse(await c.req.json())
  if (!parsed.success) {
    return c.json({ error: 'Invalid request', details: parsed.error.flatten() }, 400)
  }

  return streamAgent(c, 'continue', parsed.data)
})
