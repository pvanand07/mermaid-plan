import { useRef, useState } from 'react'
import { Bot, Minus, Send, Sparkles } from 'lucide-react'
import { cn } from '../../lib/cn'
import './AiPanel.css'

type MessageRole = 'assistant' | 'user'

interface ChatMessage {
  id: string
  role: MessageRole
  content: string
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
  onMinimize: () => void
}

export function AiPanel({ open, onMinimize }: AiPanelProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  if (!open) return null

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    requestAnimationFrame(scrollToBottom)
  }

  const handlePromptClick = (prompt: string) => {
    setInput(prompt)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

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
              <div className="ai-message-bubble">{message.content}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {messages.length === 1 && (
          <div className="ai-panel-suggestions">
            <p className="ai-panel-suggestions-label">Try asking</p>
            <div className="ai-panel-chips">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="ai-chip"
                  onClick={() => handlePromptClick(prompt)}
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
            aria-label="Message to AI assistant"
          />
          <button
            type="button"
            className="ai-panel-send"
            onClick={handleSend}
            disabled={!input.trim()}
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </div>
    </div>
  )
}
