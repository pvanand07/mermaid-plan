import { createParser, type EventSourceMessage } from 'eventsource-parser'
import { agentApiUrl } from './agentApiBase'
import type {
  AgentContinueRequest,
  AgentStreamPauseInfo,
  AgentStreamRequest,
  AgentToolCall,
} from './types'

export class AgentChatError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'AgentChatError'
    this.status = status
  }
}

interface StreamHandlers {
  onDelta: (delta: string) => void
  onToolCall?: (call: AgentToolCall) => void
  onDone?: (content: string) => void
  onError?: (message: string) => void
}

type StreamEventResult = AgentStreamPauseInfo | 'done' | undefined

function handleSseEvent(
  event: EventSourceMessage,
  handlers: StreamHandlers,
  state: { lastToolCall?: AgentToolCall },
): StreamEventResult {
  const eventName = event.event || 'message'

  if (eventName === 'text') {
    const payload = JSON.parse(event.data) as { delta?: string }
    if (payload.delta) handlers.onDelta(payload.delta)
    return undefined
  }

  if (eventName === 'tool_call') {
    const payload = JSON.parse(event.data) as AgentToolCall
    state.lastToolCall = payload
    handlers.onToolCall?.(payload)
    return undefined
  }

  if (eventName === 'paused') {
    const payload = JSON.parse(event.data) as {
      toolCallId?: string
      conversationState?: unknown
    }
    const toolCall = state.lastToolCall

    if (payload.toolCallId && toolCall && payload.conversationState !== undefined) {
      return {
        toolCallId: payload.toolCallId,
        toolCall,
        conversationState: payload.conversationState,
      }
    }
    return undefined
  }

  if (eventName === 'done') {
    const payload = JSON.parse(event.data) as { message?: { content?: string } }
    handlers.onDone?.(payload.message?.content ?? '')
    return 'done'
  }

  if (eventName === 'error') {
    const payload = JSON.parse(event.data) as { error?: string }
    const message = payload.error ?? 'Agent request failed'
    handlers.onError?.(message)
    throw new AgentChatError(message)
  }

  return undefined
}

async function consumeSseStream(
  body: ReadableStream<Uint8Array>,
  handlers: StreamHandlers,
  signal?: AbortSignal,
): Promise<AgentStreamPauseInfo | undefined> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  const state: { lastToolCall?: AgentToolCall } = {}
  let pauseInfo: AgentStreamPauseInfo | undefined
  let finished = false

  const parser = createParser({
    onEvent(event) {
      const result = handleSseEvent(event, handlers, state)
      if (result === 'done') {
        finished = true
      } else if (result) {
        pauseInfo = result
      }
    },
  })

  try {
    while (true) {
      if (signal?.aborted) {
        await reader.cancel()
        throw new AgentChatError('Request cancelled')
      }

      const { done, value } = await reader.read()
      if (value) {
        parser.feed(decoder.decode(value, { stream: !done }))
      }

      if (pauseInfo || finished) {
        await reader.cancel()
        return pauseInfo
      }

      if (done) {
        parser.feed(decoder.decode())
        break
      }
    }
  } finally {
    reader.releaseLock()
  }

  return pauseInfo
}

async function postAgentStream(
  endpoint: string,
  request: AgentStreamRequest | AgentContinueRequest,
  handlers: StreamHandlers,
  signal?: AbortSignal,
): Promise<AgentStreamPauseInfo | undefined> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(request),
    signal,
  })

  if (!response.ok) {
    let message = 'Agent request failed'
    try {
      const body = (await response.json()) as { error?: string; message?: string }
      message = body.error ?? body.message ?? message
    } catch {
      // ignore JSON parse errors
    }
    throw new AgentChatError(message, response.status)
  }

  if (!response.body) {
    throw new AgentChatError('No response stream')
  }

  return consumeSseStream(response.body, handlers, signal)
}

export async function streamAgentChat(
  request: AgentStreamRequest,
  handlers: StreamHandlers,
  signal?: AbortSignal,
): Promise<AgentStreamPauseInfo | undefined> {
  return postAgentStream(agentApiUrl('/api/agent/chat/stream'), request, handlers, signal)
}

export async function continueAgentChat(
  request: AgentContinueRequest,
  handlers: StreamHandlers,
  signal?: AbortSignal,
): Promise<AgentStreamPauseInfo | undefined> {
  return postAgentStream(agentApiUrl('/api/agent/chat/continue'), request, handlers, signal)
}
