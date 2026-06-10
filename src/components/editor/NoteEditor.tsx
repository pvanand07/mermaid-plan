import { useState } from 'react'
import { MarkdownPreview } from './MarkdownPreview'

interface NoteEditorProps {
  noteMd: string
  setNoteMd: (value: string) => void
}

export function NoteEditor({ noteMd, setNoteMd }: NoteEditorProps) {
  const [tab, setTab] = useState<'edit' | 'preview'>('edit')

  return (
    <div className="note-editor panel">
      <div className="panel-header">
        <div className="tabs">
          <button
            type="button"
            className={`tab${tab === 'edit' ? ' active' : ''}`}
            onClick={() => setTab('edit')}
          >
            Edit
          </button>
          <button
            type="button"
            className={`tab${tab === 'preview' ? ' active' : ''}`}
            onClick={() => setTab('preview')}
          >
            Preview
          </button>
        </div>
      </div>
      <div className="note-editor-body">
        {tab === 'edit' ? (
          <textarea
            className="note-textarea"
            value={noteMd}
            onChange={(e) => setNoteMd(e.target.value)}
            placeholder="Add an optional markdown note…"
            spellCheck
          />
        ) : (
          <MarkdownPreview content={noteMd} />
        )}
      </div>
    </div>
  )
}
