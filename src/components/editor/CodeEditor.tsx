import { useMemo, useRef, useState } from 'react'
import { Copy, Eye, Loader2, Pencil, Sparkles, Wrench } from 'lucide-react'
import type { Template } from '../../data/types'
import { useAgentChat } from '../../hooks/useAgentChat'
import { useEditor } from '../../hooks/useEditor'
import { cn } from '../../lib/cn'
import { parseMermaidErrorLines } from '../../lib/mermaid/parseErrorLine'
import { formatValidationMessage } from '../../lib/mermaid/validateDiagram'
import { AiPanel } from './AiPanel'
import { NoteEditor } from './NoteEditor'
import { TemplateSelect } from './TemplateSelect'
import './CodeEditor.css'

export type EditorPanelMode = 'code' | 'note'
export type NoteView = 'edit' | 'preview'

const LINE_HEIGHT_PX = 20.8

interface CodeEditorProps {
  panelMode: EditorPanelMode
  onPanelModeChange: (mode: EditorPanelMode) => void
}

function buildFixPrompt(error: { phase: 'parse' | 'render'; error: string }) {
  const phaseLabel = error.phase === 'parse' ? 'syntax' : 'render'
  return [
    `Fix the ${phaseLabel} error in this Mermaid diagram.`,
    '',
    `Error: ${error.error}`,
    '',
    'Update the diagram code so it parses and renders correctly.',
  ].join('\n')
}

export function CodeEditor({ panelMode, onPanelModeChange }: CodeEditorProps) {
  const {
    diagramId,
    title,
    code,
    setCode,
    noteMd,
    setNoteMd,
    applyAgentDiagramUpdate,
    applyAgentNoteUpdate,
    applyTemplate,
    validateDiagramCode,
    validationError,
  } = useEditor()

  const [aiOpen, setAiOpen] = useState(false)
  const [noteView, setNoteView] = useState<NoteView>('edit')
  const [isAiFixing, setIsAiFixing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)
  const highlightsRef = useRef<HTMLDivElement>(null)

  const updateCode = (next: string) => {
    setCode(next)
  }

  const updateNote = (next: string) => {
    setNoteMd(next)
  }

  const agentChat = useAgentChat({
    diagramId,
    diagramTitle: title,
    diagramCode: code,
    noteMd,
    onDiagramUpdate: updateCode,
    onNoteUpdate: updateNote,
    onAgentDiagramSave: applyAgentDiagramUpdate,
    onAgentNoteSave: applyAgentNoteUpdate,
    validateDiagramCode,
  })

  const handleScroll = () => {
    const scrollTop = textareaRef.current?.scrollTop ?? 0
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = scrollTop
    }
    if (highlightsRef.current) {
      highlightsRef.current.style.transform = `translateY(-${scrollTop}px)`
    }
  }

  const handleTemplateSelect = (template: Template) => {
    applyTemplate(template)
  }

  const handleFixWithAi = async () => {
    if (!validationError || agentChat.isStreaming || isAiFixing) return

    setIsAiFixing(true)
    try {
      await agentChat.sendMessage(buildFixPrompt(validationError))
    } finally {
      setIsAiFixing(false)
    }
  }

  const lineCount = code.split('\n').length
  const lines = Array.from({ length: Math.max(lineCount, 1) }, (_, i) => i + 1)
  const errorLines = useMemo(
    () => (validationError ? parseMermaidErrorLines(validationError.error) : []),
    [validationError],
  )
  const fixDisabled = isAiFixing || agentChat.isStreaming

  return (
    <div className="code-editor-panel panel">
      <AiPanel open={aiOpen} chat={agentChat} onMinimize={() => setAiOpen(false)} />
      <div className="panel-header">
        <div className="panel-header-left">
          <button
            type="button"
            className={cn('ai-toggle-btn', aiOpen && 'active')}
            onClick={() => setAiOpen((open) => !open)}
            aria-label={aiOpen ? 'Minimize AI assistant' : 'Open AI assistant'}
            aria-pressed={aiOpen}
            title="AI Assistant"
          >
            <Sparkles size={14} />
          </button>
          <div className="tabs">
          <button
            type="button"
            className={cn('tab', panelMode === 'code' && 'active')}
            onClick={() => onPanelModeChange('code')}
          >
            Code
          </button>
          <button
            type="button"
            className={cn('tab', panelMode === 'note' && 'active')}
            onClick={() => onPanelModeChange('note')}
          >
            Note
          </button>
          </div>
        </div>
        {panelMode === 'note' && (
          <div className="note-view-controls">
            <button
              type="button"
              className={cn('icon-btn', noteView === 'edit' && 'active')}
              onClick={() => setNoteView('edit')}
              aria-label="Edit note"
              title="Edit"
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              className={cn('icon-btn', noteView === 'preview' && 'active')}
              onClick={() => setNoteView('preview')}
              aria-label="Preview note"
              title="Preview"
            >
              <Eye size={14} />
            </button>
          </div>
        )}
        {panelMode === 'code' && (
          <div className="toolbar">
            <TemplateSelect onSelect={handleTemplateSelect} />
            <button type="button" className="toolbar-btn" onClick={() => void navigator.clipboard.writeText(code)}>
              <Copy size={14} className="icon-muted" /> Copy
            </button>
          </div>
        )}
      </div>

      {panelMode === 'code' ? (
        <>
          <div className={cn('editor-container', isAiFixing && 'editor-container--busy')}>
            <div className="line-numbers" ref={lineNumbersRef}>
              {lines.map((line) => (
                <div
                  key={line}
                  className={cn('line-number', errorLines.includes(line) && 'line-number--error')}
                >
                  {line}
                </div>
              ))}
            </div>
            <div className="code-editor-input">
              <div className="code-editor-highlights" aria-hidden>
                <div ref={highlightsRef} className="code-editor-highlights-inner">
                  {errorLines.map((line) => (
                    <div
                      key={line}
                      className="code-editor-error-line"
                      style={{ top: `${16 + (line - 1) * LINE_HEIGHT_PX}px` }}
                    />
                  ))}
                </div>
              </div>
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => updateCode(e.target.value)}
                onScroll={handleScroll}
                spellCheck={false}
                className="code-textarea"
                placeholder="Write Mermaid code here, or choose a template…"
                readOnly={isAiFixing}
                aria-busy={isAiFixing}
              />
            </div>
            {isAiFixing && (
              <div className="editor-busy-overlay" role="status" aria-live="polite">
                <Loader2 size={20} className="editor-busy-spinner" />
                <span>AI is fixing the diagram…</span>
              </div>
            )}
          </div>

          <div className="panel-footer">
            {validationError ? (
              <div className="editor-error-banner" role="alert">
                <span className="editor-error-message">
                  {formatValidationMessage(validationError)}
                </span>
                <button
                  type="button"
                  className="editor-fix-btn"
                  onClick={() => void handleFixWithAi()}
                  disabled={fixDisabled}
                >
                  {isAiFixing ? (
                    <Loader2 size={14} className="editor-fix-btn-spinner" />
                  ) : (
                    <Wrench size={14} />
                  )}
                  Fix with AI
                </button>
              </div>
            ) : (
              <div className="status-right">
                <span>Ln 1, Col 1</span>
                <span>{lineCount} lines</span>
              </div>
            )}
          </div>
        </>
      ) : (
        <NoteEditor noteMd={noteMd} setNoteMd={setNoteMd} view={noteView} />
      )}
    </div>
  )
}
