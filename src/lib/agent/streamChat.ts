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

interface StreamProcessResult {
  finished: boolean
  paused?: AgentStreamPauseInfo
}

function parseSseBlock(block: string): { event: string; data: string } | null {
  let event = 'message'
  const dataLines: string[] = []

  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim()
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim())
    }
  }

  if (dataLines.length === 0) return null
  return { event, data: dataLines.join('\n') }
}

function processSseBuffer(
  buffer: string,
  handlers: StreamHandlers,
  state: { lastToolCall?: AgentToolCall; sessionId?: string },
): { rest: string; result?: StreamProcessResult } {
  let rest = buffer
  let boundary = rest.indexOf('\n\n')

  while (boundary !== -1) {
    const block = rest.slice(0, boundary)
    rest = rest.slice(boundary + 2)
    const parsed = parseSseBlock(block)

    if (parsed) {
      if (parsed.event === 'text') {
        const payload = JSON.parse(parsed.data) as { delta?: string }
        if (payload.delta) handlers.onDelta(payload.delta)
      } else if (parsed.event === 'meta') {
        const payload = JSON.parse(parsed.data) as { sessionId?: string }
        if (payload.sessionId) state.sessionId = payload.sessionId
      } else if (parsed.event === 'tool_call') {
        const payload = JSON.parse(parsed.data) as AgentToolCall
        state.lastToolCall = payload
        handlers.onToolCall?.(payload)
      } else if (parsed.event === 'paused') {
        const payload = JSON.parse(parsed.data) as {
          sessionId?: string
          toolCallId?: string
        }
        const sessionId = payload.sessionId ?? state.sessionId
        const toolCall = state.lastToolCall

        if (sessionId && payload.toolCallId && toolCall) {
          return {
            rest,
            result: {
              finished: true,
              paused: {
                sessionId,
                toolCallId: payload.toolCallId,
                toolCall,
              },
            },
          }
        }
      } else if (parsed.event === 'done') {
        const payload = JSON.parse(parsed.data) as { message?: { content?: string } }
        handlers.onDone?.(payload.message?.content ?? '')
        return { rest, result: { finished: true } }
      } else if (parsed.event === 'error') {
        const payload = JSON.parse(parsed.data) as { error?: string }
        const message = payload.error ?? 'Agent request failed'
        handlers.onError?.(message)
        throw new AgentChatError(message)
      }
    }

    boundary = rest.indexOf('\n\n')
  }

  return { rest }
}

async function consumeSseStream(
  body: ReadableStream<Uint8Array>,
  handlers: StreamHandlers,
  signal?: AbortSignal,
): Promise<AgentStreamPauseInfo | undefined> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  const state: { lastToolCall?: AgentToolCall; sessionId?: string } = {}

  try {
    while (true) {
      if (signal?.aborted) {
        await reader.cancel()
        throw new AgentChatError('Request cancelled')
      }

      const { done, value } = await reader.read()
      if (value) {
        buffer += decoder.decode(value, { stream: true })
      }

      const processed = processSseBuffer(buffer, handlers, state)
      buffer = processed.rest

      if (processed.result?.finished) {
        await reader.cancel()
        return processed.result.paused
      }

      if (done) {
        buffer += decoder.decode()
        const final = processSseBuffer(buffer, handlers, state)
        if (final.result?.finished) {
          await reader.cancel()
          return final.result.paused
        }
        return undefined
      }
    }
  } finally {
    reader.releaseLock()
  }
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
  return postAgentStream('/api/agent/chat/stream', request, handlers, signal)
}

export async function continueAgentChat(
  request: AgentContinueRequest,
  handlers: StreamHandlers,
  signal?: AbortSignal,
): Promise<AgentStreamPauseInfo | undefined> {
  return postAgentStream('/api/agent/chat/continue', request, handlers, signal)
}
