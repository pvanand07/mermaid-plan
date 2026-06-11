import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useParams } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { CodeEditor } from '../components/editor/CodeEditor'
import type { EditorPanelMode } from '../components/editor/CodeEditor'
import { Preview } from '../components/editor/Preview'
import { TopBar } from '../components/editor/TopBar'
import { useDbReady } from '../hooks/useDbReady'
import { useDebouncedPreview } from '../hooks/useDebouncedPreview'
import { useDiagramEditor } from '../hooks/useDiagramEditor'
import { listAllFolderPaths } from '../lib/db/folderRepository'

function EditorSession({ id }: { id: string }) {
  const { dbError, loading } = useDbReady()

  const folderPaths = useLiveQuery(
    () => (!dbError ? listAllFolderPaths() : []),
    [dbError],
    [],
  )

  const editor = useDiagramEditor({ id })

  const [panelMode, setPanelMode] = useState<EditorPanelMode>('code')
  const [zoom, setZoom] = useState(100)
  const previewCode = useDebouncedPreview(editor.code)

  if (loading || !editor.loaded) {
    return (
      <AppLayout embedMobileMenu>
        <div className="editor-loading">Loading diagram…</div>
      </AppLayout>
    )
  }

  if (editor.notFound) {
    return (
      <AppLayout embedMobileMenu>
        <div className="editor-loading">Diagram not found.</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout embedMobileMenu>
      {(dbError || editor.dbError) && (
        <div className="db-error-banner">
          Storage unavailable — changes may not persist. {dbError ?? editor.dbError}
        </div>
      )}
      <TopBar
        title={editor.title}
        code={editor.code}
        saveStatus={editor.saveStatus}
        folderPath={editor.folderPath}
        folderPaths={folderPaths ?? []}
        versions={editor.versions}
        onTitleChange={editor.setTitle}
        onFolderChange={editor.setFolderPath}
        onRestoreVersion={editor.restoreVersion}
      />
      <div className="workspace">
        <CodeEditor
          diagramId={editor.diagramId}
          diagramTitle={editor.title}
          code={editor.code}
          setCode={editor.setCode}
          onFormat={() => editor.setCode(editor.code.trim())}
          onCopy={() => void navigator.clipboard.writeText(editor.code)}
          panelMode={panelMode}
          onPanelModeChange={setPanelMode}
          noteMd={editor.noteMd}
          setNoteMd={editor.setNoteMd}
          onAgentDiagramSave={editor.applyAgentDiagramUpdate}
          onAgentNoteSave={editor.applyAgentNoteUpdate}
          onApplyTemplate={editor.applyTemplate}
        />
        <Preview
          previewCode={previewCode}
          exportCode={editor.code}
          filename={editor.title}
          zoom={zoom}
          onZoomChange={setZoom}
        />
      </div>
    </AppLayout>
  )
}

export function EditorPage() {
  const { id } = useParams()

  if (!id) return null

  return <EditorSession key={id} id={id} />
}
