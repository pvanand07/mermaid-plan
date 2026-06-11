import { Bot, CheckCircle2, Loader2, Minus, RotateCcw, Send, Sparkles, Wrench } from 'lucide-react'
import { useAgentChat } from '../../hooks/useAgentChat'
import { formatToolStatusMessage } from '../../lib/agent/toolRegistry'
import { cn } from '../../lib/cn'
import { MarkdownPreview } from './MarkdownPreview'
import './AiPanel.css'

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
  validateDiagramCode?: (code: string) => Promise<import('../../lib/mermaid/validateDiagram').MermaidValidationResult>
  onMinimize: () => void
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
  validateDiagramCode,
  onMinimize,
}: AiPanelProps) {
  const {
    input,
    setInput,
    messages,
    isStreaming,
    sendMessage,
    reset,
    messagesEndRef,
    showSuggestions,
  } = useAgentChat({
    diagramId,
    diagramTitle,
    diagramCode,
    noteMd,
    onDiagramUpdate,
    onNoteUpdate,
    onAgentDiagramSave,
    onAgentNoteSave,
    validateDiagramCode,
  })

  if (!open) return null

  const handleSend = () => {
    void sendMessage(input)
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
        <div className="ai-panel-header-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={() => void reset()}
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
            {['Create a flowchart for user login', 'Explain this diagram', 'Document this diagram in the note', 'Add error handling branches'].map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="ai-chip"
                onClick={() => void sendMessage(prompt)}
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
