import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { z } from 'zod'
import { config } from '../config.js'
import { createAgentRun } from '../agent/runAgent.js'
import type { AgentChatResponse } from '../types.js'

const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1),
      }),
    )
    .min(1),
  diagramCode: z.string().optional(),
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

  try {
    const { result, model } = createAgentRun(parsed.data)
    const [text, response] = await Promise.all([result.getText(), result.getResponse()])

    const body: AgentChatResponse = {
      message: {
        role: 'assistant',
        content: text,
      },
      model,
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

  const { result, model } = createAgentRun(parsed.data)

  return streamSSE(c, async (stream) => {
    try {
      await stream.writeSSE({
        event: 'meta',
        data: JSON.stringify({ model }),
      })

      let content = ''
      for await (const delta of result.getTextStream()) {
        content += delta
        await stream.writeSSE({
          event: 'text',
          data: JSON.stringify({ delta }),
        })
      }

      const response = await result.getResponse()
      await stream.writeSSE({
        event: 'done',
        data: JSON.stringify({
          message: {
            role: 'assistant',
            content,
          },
          model,
          usage: response.usage,
        }),
      })
    } catch (error) {
      const mapped = mapAgentError(error)
      await stream.writeSSE({
        event: 'error',
        data: JSON.stringify({ error: mapped.message }),
      })
    }
  })
})
