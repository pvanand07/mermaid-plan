import type { Context } from 'hono'
import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { chatRequestSchema, continueRequestSchema } from '../../shared/agent/schemas.js'
import { config } from '../config.js'
import { normalizeAgentUsage } from '../agent/usage.js'
import { applyPlanRateLimits } from '../middleware/rateLimits.js'
import type { AppVariables } from '../middleware/resolveUser.js'
import { clientIp } from '../middleware/clientIp.js'
import { createEphemeralAccessor } from '../agent/ephemeralState.js'
import { createAgentContinueRun, createAgentRun } from '../agent/runAgent.js'
import { streamAgentResult } from '../agent/streamRun.js'
import { isClientHandledTool } from '../agent/tools/clientTools.js'
import { recordAgentUsage } from '../services/recordAgentUsage.js'
import type {
  AgentChatRequest,
  AgentChatResponse,
  AgentContinueRequest,
  AgentToolCallPayload,
} from '../types.js'
import type { AgentUsageScope } from '../db/types.js'

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

function safeRecordUsage(
  c: Context<{ Variables: AppVariables }>,
  scope: AgentUsageScope,
  model: string,
  usage: ReturnType<typeof normalizeAgentUsage>,
) {
  try {
    recordAgentUsage({
      userId: c.get('userId'),
      scope,
      model,
      usage,
      clientIp: clientIp(c),
    })
  } catch (error) {
    console.error('[usage] Failed to record agent usage', error)
  }
}

function streamAgent(
  c: Context<{ Variables: AppVariables }>,
  scope: 'stream' | 'continue',
  data: ChatRequest | ContinueRequest,
) {
  const accessor =
    scope === 'continue'
      ? createEphemeralAccessor((data as ContinueRequest).conversationState as never)
      : createEphemeralAccessor()

  const { result, model } =
    scope === 'continue'
      ? createAgentContinueRun(data as AgentContinueRequest, { state: accessor })
      : createAgentRun(data as ChatRequest, { state: accessor })

  return streamSSE(c, async (stream) => {
    try {
      await stream.writeSSE({
        event: 'meta',
        data: JSON.stringify({ model }),
      })
      const outcome = await streamAgentResult(result, stream, accessor)
      safeRecordUsage(c, scope, model, outcome.usage)
    } catch (error) {
      const mapped = mapAgentError(error)
      await stream.writeSSE({
        event: 'error',
        data: JSON.stringify({ error: mapped.message }),
      })
    }
  })
}

export const agentRoutes = new Hono<{ Variables: AppVariables }>()

if (config.rateLimit.enabled) {
  applyPlanRateLimits(agentRoutes, '/chat', 'chat')
  applyPlanRateLimits(agentRoutes, '/chat/stream', 'stream')
  applyPlanRateLimits(agentRoutes, '/chat/continue', 'continue')
}

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
    const usage = normalizeAgentUsage(response.usage ?? undefined)

    safeRecordUsage(c, 'chat', model, usage)

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
      usage,
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

  return streamAgent(c, 'stream', parsed.data)
})

agentRoutes.post('/chat/continue', async (c) => {
  if (!config.isConfigured) return missingKeyResponse(c)

  const parsed = continueRequestSchema.safeParse(await c.req.json())
  if (!parsed.success) {
    return c.json({ error: 'Invalid request', details: parsed.error.flatten() }, 400)
  }

  return streamAgent(c, 'continue', parsed.data)
})
