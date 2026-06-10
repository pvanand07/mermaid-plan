import { MarkdownPreview } from './MarkdownPreview'

interface NoteEditorProps {
  noteMd: string
  setNoteMd: (value: string) => void
  view: 'edit' | 'preview'
}

export function NoteEditor({ noteMd, setNoteMd, view }: NoteEditorProps) {
  return (
    <div className="note-editor-embedded">
      <div className="note-editor-body">
        {view === 'edit' ? (
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
