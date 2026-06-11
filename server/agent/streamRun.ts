import type { ModelResult, Tool, StateAccessor } from '@openrouter/agent'
import type { SSEStreamingApi } from 'hono/streaming'
import type { AgentUsageRecord } from '../../shared/agent/usage.js'
import type { AgentToolCallPayload } from '../types.js'
import { isClientHandledTool } from './tools/clientTools.js'
import type { MERMAID_AGENT_TOOLS } from './tools/index.js'
import { normalizeAgentUsage } from './usage.js'

export interface AgentStreamOutcome {
  content: string
  paused: boolean
  toolCall?: AgentToolCallPayload
  usage?: AgentUsageRecord
}

export async function streamAgentResult(
  result: ModelResult<readonly Tool[]>,
  stream: SSEStreamingApi,
  accessor: StateAccessor<typeof MERMAID_AGENT_TOOLS>,
): Promise<AgentStreamOutcome> {
  let content = ''
  let clientToolCall: AgentToolCallPayload | undefined

  const textTask = (async () => {
    for await (const delta of result.getTextStream()) {
      content += delta
      await stream.writeSSE({
        event: 'text',
        data: JSON.stringify({ delta }),
      })
    }
  })()

  const toolTask = (async () => {
    for await (const toolCall of result.getToolCallsStream()) {
      if (!isClientHandledTool(toolCall.name)) continue

      const call = {
        id: toolCall.id,
        name: toolCall.name,
        arguments: toolCall.arguments,
      } as AgentToolCallPayload

      clientToolCall = call

      await stream.writeSSE({
        event: 'tool_call',
        data: JSON.stringify(call),
      })
    }
  })()

  await Promise.all([textTask, toolTask])

  const response = await result.getResponse()
  const usage = normalizeAgentUsage(response.usage ?? undefined)

  if (clientToolCall) {
    const conversationState = await accessor.load()
    await stream.writeSSE({
      event: 'paused',
      data: JSON.stringify({
        toolCallId: clientToolCall.id,
        reason: 'awaiting_tool_result',
        conversationState,
      }),
    })

    return {
      content,
      paused: true,
      toolCall: clientToolCall,
      usage,
    }
  }

  await stream.writeSSE({
    event: 'done',
    data: JSON.stringify({
      message: {
        role: 'assistant',
        content,
      },
      usage,
    }),
  })

  return {
    content,
    paused: false,
    usage,
  }
}
