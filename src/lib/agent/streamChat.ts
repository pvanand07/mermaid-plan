import type { AgentStreamRequest } from './types'

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
  onDone?: (content: string) => void
  onError?: (message: string) => void
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
): { rest: string; finished: boolean } {
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
      } else if (parsed.event === 'done') {
        const payload = JSON.parse(parsed.data) as { message?: { content?: string } }
        handlers.onDone?.(payload.message?.content ?? '')
        return { rest, finished: true }
      } else if (parsed.event === 'error') {
        const payload = JSON.parse(parsed.data) as { error?: string }
        const message = payload.error ?? 'Agent request failed'
        handlers.onError?.(message)
        throw new AgentChatError(message)
      }
    }

    boundary = rest.indexOf('\n\n')
  }

  return { rest, finished: false }
}

async function consumeSseStream(
  body: ReadableStream<Uint8Array>,
  handlers: StreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

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

      const processed = processSseBuffer(buffer, handlers)
      buffer = processed.rest
      if (processed.finished) {
        await reader.cancel()
        return
      }

      if (done) {
        buffer += decoder.decode()
        const final = processSseBuffer(buffer, handlers)
        if (final.finished) {
          await reader.cancel()
        }
        return
      }
    }
  } finally {
    reader.releaseLock()
  }
}

export async function streamAgentChat(
  request: AgentStreamRequest,
  handlers: StreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch('/api/agent/chat/stream', {
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

  await consumeSseStream(response.body, handlers, signal)
}
