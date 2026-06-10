export type EditorMode = 'diagram' | 'note'

interface EditorModeTabsProps {
  mode: EditorMode
  onModeChange: (mode: EditorMode) => void
}

export function EditorModeTabs({ mode, onModeChange }: EditorModeTabsProps) {
  return (
    <div className="editor-mode-tabs">
      <button
        type="button"
        className={`editor-mode-tab${mode === 'diagram' ? ' active' : ''}`}
        onClick={() => onModeChange('diagram')}
      >
        Diagram
      </button>
      <button
        type="button"
        className={`editor-mode-tab${mode === 'note' ? ' active' : ''}`}
        onClick={() => onModeChange('note')}
      >
        Note
      </button>
    </div>
  )
}
