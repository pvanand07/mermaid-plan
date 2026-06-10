import { useRef, useState } from 'react'
import mermaid from 'mermaid'
import { AlignLeft, CheckCircle2, Copy, Eye, Pencil } from 'lucide-react'
import { cn } from '../../lib/cn'
import { NoteEditor } from './NoteEditor'
import './CodeEditor.css'

export type EditorPanelMode = 'code' | 'note'
export type NoteView = 'edit' | 'preview'

interface CodeEditorProps {
  code: string
  setCode: (code: string) => void
  onFormat: () => void
  onCopy: () => void
  panelMode: EditorPanelMode
  onPanelModeChange: (mode: EditorPanelMode) => void
  noteMd: string
  setNoteMd: (value: string) => void
}

export function CodeEditor({
  code,
  setCode,
  onFormat,
  onCopy,
  panelMode,
  onPanelModeChange,
  noteMd,
  setNoteMd,
}: CodeEditorProps) {
  const [noteView, setNoteView] = useState<NoteView>('edit')
  const [validateMessage, setValidateMessage] = useState<string | null>(null)
  const [validateOk, setValidateOk] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  const handleValidate = async () => {
    try {
      await mermaid.parse(code)
      setValidateOk(true)
      setValidateMessage('No issues detected')
    } catch (err) {
      setValidateOk(false)
      setValidateMessage(err instanceof Error ? err.message : 'Invalid syntax')
    }
  }

  const lineCount = code.split('\n').length
  const lines = Array.from({ length: Math.max(lineCount, 1) }, (_, i) => i + 1)

  return (
    <div className="code-editor-panel panel">
      <div className="panel-header">
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
            <button type="button" className="toolbar-btn" onClick={onFormat}>
              <AlignLeft size={14} className="icon-muted" /> Format
            </button>
            <button type="button" className="toolbar-btn" onClick={onCopy}>
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
              onChange={(e) => setCode(e.target.value)}
              onScroll={handleScroll}
              spellCheck={false}
              className="code-textarea"
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
