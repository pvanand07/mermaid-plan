import { useEffect, useRef, useState } from 'react'
import { Bot, CheckCircle2, Loader2, Minus, RotateCcw, Send, Sparkles, Wrench } from 'lucide-react'
import {
  AgentChatError,
  continueAgentChat,
  streamAgentChat,
} from '../../lib/agent/streamChat'
import type {
  AgentChatMessage,
  AgentStreamPauseInfo,
  AgentToolCall,
  AgentToolResult,
  MermaidToolResult,
  NoteToolResult,
} from '../../lib/agent/types'
import {
  clearConversation,
  getConversation,
  saveConversation,
} from '../../lib/db/conversationRepository'
import type { StoredChatMessage } from '../../data/types'
import {
  formatValidationMessage,
  validateMermaidDiagram,
} from '../../lib/mermaid/validateDiagram'
import { cn } from '../../lib/cn'
import { MarkdownPreview } from './MarkdownPreview'
import './AiPanel.css'

type MessageRole = 'assistant' | 'user'

interface ToolStatus {
  toolName?: 'update_mermaid' | 'update_note'
  commitMessage?: string
  result: AgentToolResult
}

interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  streaming?: boolean
  error?: boolean
  toolStatus?: ToolStatus
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Hi! I can help you write, refine, and explain Mermaid diagrams. Describe what you want to build or ask a question about your current diagram.',
}

const SUGGESTED_PROMPTS = [
  'Create a flowchart for user login',
  'Explain this diagram',
  'Document this diagram in the note',
  'Add error handling branches',
]

function formatToolStatusMessage(
  toolName: 'update_mermaid' | 'update_note' | undefined,
  result: AgentToolResult,
): string {
  if (toolName === 'update_note') {
    const noteResult = result as NoteToolResult
    return noteResult.ok ? 'Note updated' : `Note update failed: ${noteResult.error ?? 'Unknown error'}`
  }
  return formatValidationMessage(result as MermaidToolResult)
}

interface AiPanelProps {
  open: boolean
  diagramId: string
  diagramTitle: string
  diagramCode: string
  noteMd: string
  onDiagramUpdate: (code: string) => void
  onNoteUpdate: (noteMd: string) => void
  onAgentDiagramSave?: (code: string, commitMessage?: string) => Promise<void>
  onAgentNoteSave?: (noteMd: string, commitMessage?: string) => Promise<void>
  onMinimize: () => void
}

function toStoredMessages(messages: ChatMessage[]): StoredChatMessage[] {
  return messages
    .filter((message) => message.id !== 'welcome' && !message.streaming)
    .map(({ id, role, content, error, toolStatus }) => ({
      id,
      role,
      content,
      error,
      toolStatus,
    }))
}

function syncMessageIdRef(messages: ChatMessage[], ref: { current: number }) {
  let max = 0
  for (const message of messages) {
    const match = message.id.match(/^(?:user|assistant)-(\d+)$/)
    if (match) max = Math.max(max, Number(match[1]))
  }
  ref.current = max
}

function toAgentMessages(messages: ChatMessage[]): AgentChatMessage[] {
  return messages
    .filter((message) => message.id !== 'welcome' && !message.error)
    .map(({ role, content }) => ({ role, content }))
}

export function AiPanel({
  open,
  diagramId,
  diagramTitle,
  diagramCode,
  noteMd,
  onDiagramUpdate,
  onNoteUpdate,
  onAgentDiagramSave,
  onAgentNoteSave,
  onMinimize,
}: AiPanelProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE])
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const diagramCodeRef = useRef(diagramCode)
  const noteMdRef = useRef(noteMd)
  const diagramTitleRef = useRef(diagramTitle)
  const messageIdRef = useRef(0)
  const skipSaveRef = useRef(true)

  const buildAgentContext = () => ({
    diagramCode: diagramCodeRef.current.trim() || undefined,
    noteMd: noteMdRef.current.trim() || undefined,
    diagramTitle: diagramTitleRef.current.trim() || undefined,
  })

  const createMessageId = (prefix: string) => {
    messageIdRef.current += 1
    return `${prefix}-${messageIdRef.current}`
  }

  useEffect(() => {
    diagramCodeRef.current = diagramCode
  }, [diagramCode])

  useEffect(() => {
    noteMdRef.current = noteMd
  }, [noteMd])

  useEffect(() => {
    diagramTitleRef.current = diagramTitle
  }, [diagramTitle])

  useEffect(() => {
    skipSaveRef.current = true
    let cancelled = false

    void getConversation(diagramId).then((record) => {
      if (cancelled) return

      if (record?.messages.length) {
        setMessages(record.messages)
        syncMessageIdRef(record.messages, messageIdRef)
      } else {
        setMessages([WELCOME_MESSAGE])
        messageIdRef.current = 0
      }

      skipSaveRef.current = false
    })

    return () => {
      cancelled = true
    }
  }, [diagramId])

  useEffect(() => {
    if (skipSaveRef.current || isStreaming) return

    const stored = toStoredMessages(messages)
    if (stored.length === 0) return

    const timer = setTimeout(() => {
      void saveConversation(diagramId, stored)
    }, 500)

    return () => clearTimeout(timer)
  }, [diagramId, isStreaming, messages])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming])

  if (!open) return null

  const updateAssistantMessage = (assistantId: string, updater: (message: ChatMessage) => ChatMessage) => {
    setMessages((prev) =>
      prev.map((message) => (message.id === assistantId ? updater(message) : message)),
    )
  }

  const runAgentStream = async (
    endpoint: 'chat' | 'continue',
    request:
      | ({ messages: AgentChatMessage[] } & ReturnType<typeof buildAgentContext>)
      | ({
          sessionId: string
          toolCallId: string
          toolCallName: AgentToolCall['name']
          toolResult: AgentToolResult
        } & ReturnType<typeof buildAgentContext>),
    assistantId: string,
    controller: AbortController,
  ) => {
    const handlers = {
      onDelta: (delta: string) => {
        updateAssistantMessage(assistantId, (message) => ({
          ...message,
          content: message.content + delta,
        }))
      },
      onToolCall: () => {
        // Tool status is shown after client-side validation completes.
      },
      onDone: (content: string) => {
        updateAssistantMessage(assistantId, (message) => ({
          ...message,
          content: content || message.content,
          streaming: false,
        }))
      },
      onError: (error: string) => {
        updateAssistantMessage(assistantId, (message) => ({
          ...message,
          content: error,
          streaming: false,
          error: true,
        }))
      },
    }

    const streamFn = endpoint === 'chat' ? streamAgentChat : continueAgentChat
    return streamFn(request as never, handlers, controller.signal)
  }

  const handleToolPause = async (
    pause: AgentStreamPauseInfo,
    assistantId: string,
    controller: AbortController,
  ) => {
    const { toolCall } = pause
    let toolResult: AgentToolResult
    let toolStatus: ToolStatus

    if (toolCall.name === 'update_mermaid') {
      const { code, commitMessage } = toolCall.arguments
      onDiagramUpdate(code)
      diagramCodeRef.current = code

      const validation = await validateMermaidDiagram(code)

      if (validation.ok && onAgentDiagramSave) {
        await onAgentDiagramSave(code, commitMessage)
      }

      toolResult = validation
      toolStatus = {
        toolName: 'update_mermaid',
        commitMessage,
        result: validation,
      }
    } else {
      const { noteMd: nextNote, commitMessage } = toolCall.arguments
      onNoteUpdate(nextNote)
      noteMdRef.current = nextNote

      let result: NoteToolResult = { ok: true }
      try {
        if (onAgentNoteSave) {
          await onAgentNoteSave(nextNote, commitMessage)
        }
      } catch {
        result = { ok: false, error: 'Failed to save note' }
      }

      toolResult = result
      toolStatus = {
        toolName: 'update_note',
        commitMessage,
        result,
      }
    }

    updateAssistantMessage(assistantId, (message) => ({
      ...message,
      toolStatus,
    }))

    return runAgentStream(
      'continue',
      {
        sessionId: pause.sessionId,
        toolCallId: pause.toolCallId,
        toolCallName: toolCall.name,
        toolResult,
        ...buildAgentContext(),
      },
      assistantId,
      controller,
    )
  }

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isStreaming) return

    const userMessage: ChatMessage = {
      id: createMessageId('user'),
      role: 'user',
      content: trimmed,
    }
    const assistantId = createMessageId('assistant')
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      streaming: true,
    }

    const nextMessages = [...messages, userMessage]
    setMessages([...nextMessages, assistantMessage])
    setInput('')
    setIsStreaming(true)

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      let pause = await runAgentStream(
        'chat',
        {
          messages: toAgentMessages(nextMessages),
          ...buildAgentContext(),
        },
        assistantId,
        controller,
      )

      while (pause) {
        pause = await handleToolPause(pause, assistantId, controller)
      }

      updateAssistantMessage(assistantId, (message) =>
        message.streaming ? { ...message, streaming: false } : message,
      )
    } catch (error) {
      if (error instanceof AgentChatError && error.message === 'Request cancelled') {
        return
      }

      const message =
        error instanceof AgentChatError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Agent request failed'

      updateAssistantMessage(assistantId, (current) => ({
        ...current,
        content: message,
        streaming: false,
        error: true,
      }))
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
        setIsStreaming(false)
      }
    }
  }

  const handleSend = () => {
    void sendMessage(input)
  }

  const handlePromptClick = (prompt: string) => {
    void sendMessage(prompt)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleReset = async () => {
    if (isStreaming) return

    abortRef.current?.abort()
    abortRef.current = null
    skipSaveRef.current = true
    setMessages([WELCOME_MESSAGE])
    messageIdRef.current = 0
    setInput('')
    setIsStreaming(false)

    if (diagramId) {
      await clearConversation(diagramId)
    }

    skipSaveRef.current = false
  }

  const showSuggestions = messages.length === 1 && messages[0]?.id === 'welcome' && !isStreaming

  return (
    <div className="ai-panel-overlay panel" role="dialog" aria-label="AI assistant">
      <div className="panel-header ai-panel-header">
        <div className="ai-panel-title">
          <Sparkles size={16} className="ai-panel-title-icon" />
          <span>AI Assistant</span>
        </div>
        <div className="ai-panel-header-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={() => void handleReset()}
            disabled={isStreaming || (messages.length === 1 && messages[0]?.id === 'welcome')}
            aria-label="Reset conversation"
            title="Reset conversation"
          >
            <RotateCcw size={16} />
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={onMinimize}
            aria-label="Minimize AI assistant"
            title="Minimize"
          >
            <Minus size={16} />
          </button>
        </div>
      </div>

      <div className="ai-panel-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn('ai-message', message.role === 'user' && 'ai-message--user')}
          >
            {message.role === 'assistant' && (
              <div className="ai-message-avatar" aria-hidden>
                <Bot size={14} />
              </div>
            )}
            <div
              className={cn(
                'ai-message-bubble',
                message.error && 'ai-message-bubble--error',
                message.streaming && 'ai-message-bubble--streaming',
              )}
            >
              {message.role === 'assistant' && !message.error ? (
                <>
                  {message.toolStatus && (
                    <div
                      className={cn(
                        'ai-tool-status',
                        message.toolStatus.result.ok
                          ? 'ai-tool-status--ok'
                          : 'ai-tool-status--error',
                      )}
                    >
                      {message.toolStatus.result.ok ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <Wrench size={14} />
                      )}
                      <div className="ai-tool-status-text">
                        {message.toolStatus.commitMessage && (
                          <span className="ai-tool-status-summary">
                            {message.toolStatus.commitMessage}
                          </span>
                        )}
                        <span>
                          {formatToolStatusMessage(
                            message.toolStatus.toolName ?? 'update_mermaid',
                            message.toolStatus.result,
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                  {message.content ? (
                    <MarkdownPreview content={message.content} className="ai-message-markdown" />
                  ) : (
                    <span className="ai-message-thinking">Thinking…</span>
                  )}
                  {message.streaming && message.content && (
                    <span className="ai-message-cursor" aria-hidden />
                  )}
                </>
              ) : (
                message.content
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {showSuggestions && (
        <div className="ai-panel-suggestions">
          <p className="ai-panel-suggestions-label">Try asking</p>
          <div className="ai-panel-chips">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="ai-chip"
                onClick={() => handlePromptClick(prompt)}
                disabled={isStreaming}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="ai-panel-composer">
        <textarea
          className="ai-panel-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your diagram…"
          rows={2}
          disabled={isStreaming}
          aria-label="Message to AI assistant"
        />
        <button
          type="button"
          className="ai-panel-send"
          onClick={handleSend}
          disabled={!input.trim() || isStreaming}
          aria-label="Send message"
        >
          {isStreaming ? <Loader2 size={16} className="ai-panel-send-spinner" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  )
}
