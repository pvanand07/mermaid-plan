import { useRef, useState } from 'react'
import { AlignLeft, CheckCircle2, Copy, Eye, Pencil, Sparkles } from 'lucide-react'
import type { Template } from '../../data/types'
import { useEditor } from '../../hooks/useEditor'
import { formatValidationMessage } from '../../lib/mermaid/validateDiagram'
import { cn } from '../../lib/cn'
import { AiPanel } from './AiPanel'
import { NoteEditor } from './NoteEditor'
import { TemplateSelect } from './TemplateSelect'
import './CodeEditor.css'

export type EditorPanelMode = 'code' | 'note'
export type NoteView = 'edit' | 'preview'

interface CodeEditorProps {
  panelMode: EditorPanelMode
  onPanelModeChange: (mode: EditorPanelMode) => void
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
  } = useEditor()

  const [aiOpen, setAiOpen] = useState(false)
  const [noteView, setNoteView] = useState<NoteView>('edit')
  const [validateMessage, setValidateMessage] = useState<string | null>(null)
  const [validateOk, setValidateOk] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)

  const updateCode = (next: string) => {
    setValidateOk(true)
    setValidateMessage(null)
    setCode(next)
  }

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  const handleValidate = async () => {
    const result = await validateDiagramCode(code)
    setValidateOk(result.ok)
    setValidateMessage(result.ok ? 'No issues detected' : formatValidationMessage(result))
  }

  const updateNote = (next: string) => {
    setNoteMd(next)
  }

  const handleTemplateSelect = (template: Template) => {
    if (code.trim() && !window.confirm(`Replace the current diagram with the "${template.name}" template?`)) {
      return
    }
    setValidateOk(true)
    setValidateMessage(null)
    applyTemplate(template)
  }

  const lineCount = code.split('\n').length
  const lines = Array.from({ length: Math.max(lineCount, 1) }, (_, i) => i + 1)

  return (
    <div className="code-editor-panel panel">
      <AiPanel
        open={aiOpen}
        diagramId={diagramId}
        diagramTitle={title}
        diagramCode={code}
        noteMd={noteMd}
        onDiagramUpdate={updateCode}
        onNoteUpdate={updateNote}
        onAgentDiagramSave={applyAgentDiagramUpdate}
        onAgentNoteSave={applyAgentNoteUpdate}
        validateDiagramCode={validateDiagramCode}
        onMinimize={() => setAiOpen(false)}
      />
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
            <button type="button" className="toolbar-btn" onClick={() => setCode(code.trim())}>
              <AlignLeft size={14} className="icon-muted" /> Format
            </button>
            <button type="button" className="toolbar-btn" onClick={() => void navigator.clipboard.writeText(code)}>
              <Copy size={14} className="icon-muted" /> Copy
            </button>
            <button type="button" className="toolbar-btn" onClick={() => void handleValidate()}>
              <CheckCircle2 size={14} className="icon-muted" /> Validate
            </button>
          </div>
        )}
      </div>

      {panelMode === 'code' ? (
        <>
          <div className="editor-container">
            <div className="line-numbers" ref={lineNumbersRef}>
              {lines.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => updateCode(e.target.value)}
              onScroll={handleScroll}
              spellCheck={false}
              className="code-textarea"
              placeholder="Write Mermaid code here, or choose a template…"
            />
          </div>

          <div className="panel-footer">
            <div className={`status-item${validateOk ? ' success' : ''}`}>
              <span className="dot" />
              {validateMessage ?? 'No issues detected'}
            </div>
            <div className="status-right">
              <span>Ln 1, Col 1</span>
              <span>{lineCount} lines</span>
            </div>
          </div>
        </>
      ) : (
        <NoteEditor noteMd={noteMd} setNoteMd={setNoteMd} view={noteView} />
      )}
    </div>
  )
}
