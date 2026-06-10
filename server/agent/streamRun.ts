import type { ModelResult, Tool } from '@openrouter/agent'
import type { SSEStreamingApi } from 'hono/streaming'
import type { UpdateMermaidInput } from './tools/updateMermaid.js'

export interface StreamedToolCall {
  id: string
  name: string
  arguments: UpdateMermaidInput
}

export interface AgentStreamOutcome {
  content: string
  paused: boolean
  toolCall?: StreamedToolCall
  usage?: {
    inputTokens?: number
    outputTokens?: number
    totalTokens?: number
  }
}

export async function streamAgentResult(
  result: ModelResult<readonly Tool[]>,
  stream: SSEStreamingApi,
  sessionId: string,
): Promise<AgentStreamOutcome> {
  let content = ''
  let updateToolCall: StreamedToolCall | undefined

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
      if (toolCall.name !== 'update_mermaid') continue

      const call: StreamedToolCall = {
        id: toolCall.id,
        name: toolCall.name,
        arguments: toolCall.arguments as UpdateMermaidInput,
      }
      updateToolCall = call

      await stream.writeSSE({
        event: 'tool_call',
        data: JSON.stringify(call),
      })
    }
  })()

  await Promise.all([textTask, toolTask])

  const response = await result.getResponse()
  const usage = response.usage
    ? {
        inputTokens: response.usage.inputTokens,
        outputTokens: response.usage.outputTokens,
        totalTokens: response.usage.totalTokens,
      }
    : undefined

  if (updateToolCall) {
    await stream.writeSSE({
      event: 'paused',
      data: JSON.stringify({
        sessionId,
        toolCallId: updateToolCall.id,
        reason: 'awaiting_tool_result',
      }),
    })

    return {
      content,
      paused: true,
      toolCall: updateToolCall,
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
