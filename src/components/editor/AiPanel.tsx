import { useEffect, useRef, useState } from 'react'
import { Bot, CheckCircle2, Loader2, Minus, Send, Sparkles, Wrench } from 'lucide-react'
import {
  AgentChatError,
  continueAgentChat,
  streamAgentChat,
} from '../../lib/agent/streamChat'
import type { AgentChatMessage, MermaidToolResult } from '../../lib/agent/types'
import {
  formatValidationMessage,
  validateMermaidDiagram,
} from '../../lib/mermaid/validateDiagram'
import { cn } from '../../lib/cn'
import { MarkdownPreview } from './MarkdownPreview'
import './AiPanel.css'

type MessageRole = 'assistant' | 'user'

interface ToolStatus {
  summary?: string
  result: MermaidToolResult
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
  'Add error handling branches',
  'Convert to a sequence diagram',
]

interface AiPanelProps {
  open: boolean
  diagramCode: string
  onDiagramUpdate: (code: string) => void
  onMinimize: () => void
}

function toAgentMessages(messages: ChatMessage[]): AgentChatMessage[] {
  return messages
    .filter((message) => message.id !== 'welcome' && !message.error)
    .map(({ role, content }) => ({ role, content }))
}

export function AiPanel({ open, diagramCode, onDiagramUpdate, onMinimize }: AiPanelProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE])
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const diagramCodeRef = useRef(diagramCode)
  const messageIdRef = useRef(0)

  const createMessageId = (prefix: string) => {
    messageIdRef.current += 1
    return `${prefix}-${messageIdRef.current}`
  }

  useEffect(() => {
    diagramCodeRef.current = diagramCode
  }, [diagramCode])

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
      | { messages: AgentChatMessage[]; diagramCode?: string }
      | {
          sessionId: string
          toolCallId: string
          toolResult: MermaidToolResult
          diagramCode?: string
        },
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
    pause: {
      sessionId: string
      toolCallId: string
      toolCall: { arguments: { code: string; summary?: string } }
    },
    assistantId: string,
    controller: AbortController,
  ) => {
    const { code, summary } = pause.toolCall.arguments
    onDiagramUpdate(code)
    diagramCodeRef.current = code

    const validation = await validateMermaidDiagram(code)

    updateAssistantMessage(assistantId, (message) => ({
      ...message,
      toolStatus: {
        summary,
        result: validation,
      },
    }))

    return runAgentStream(
      'continue',
      {
        sessionId: pause.sessionId,
        toolCallId: pause.toolCallId,
        toolResult: validation,
        diagramCode: code,
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
          diagramCode: diagramCodeRef.current.trim() || undefined,
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

  const showSuggestions = messages.length === 1 && !isStreaming

  return (
    <div className="ai-panel-overlay panel" role="dialog" aria-label="AI assistant">
      <div className="panel-header ai-panel-header">
        <div className="ai-panel-title">
          <Sparkles size={16} className="ai-panel-title-icon" />
          <span>AI Assistant</span>
        </div>
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
                        {message.toolStatus.summary && (
                          <span className="ai-tool-status-summary">{message.toolStatus.summary}</span>
                        )}
                        <span>{formatValidationMessage(message.toolStatus.result)}</span>
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
