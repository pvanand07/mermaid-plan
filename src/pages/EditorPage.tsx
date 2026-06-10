import { useState } from 'react'
import { useLocation, useParams, useSearchParams } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { CodeEditor } from '../components/editor/CodeEditor'
import type { EditorPanelMode } from '../components/editor/CodeEditor'
import { Preview } from '../components/editor/Preview'
import { TopBar } from '../components/editor/TopBar'
import { defaultEditorCode } from '../data'
import { useDiagramStore } from '../context/DiagramStoreContext'
import { useDebouncedPreview } from '../hooks/useDebouncedPreview'
import { useDiagramEditor } from '../hooks/useDiagramEditor'
import { normalizeFolderPath } from '../lib/folders/pathUtils'

function editorSessionKey(id: string | undefined, state: unknown, folderPath: string): string {
  const navigation = state as { code?: string; title?: string; noteMd?: string } | null
  return `${id ?? 'new'}:${folderPath}:${navigation?.title ?? ''}:${navigation?.code?.length ?? 0}`
}

function EditorSession() {
  const { id } = useParams()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const state = location.state as {
    code?: string
    title?: string
    noteMd?: string
    description?: string
  } | null
  const { diagrams, folderPaths, loading, dbError } = useDiagramStore()

  const folderPathFromQuery = normalizeFolderPath(searchParams.get('folderPath') ?? '')
  const seedDiagram = id ? diagrams.find((d) => d.id === id) : undefined

  const initialCode = state?.code ?? seedDiagram?.mermaidCode ?? defaultEditorCode
  const initialTitle = state?.title ?? seedDiagram?.title ?? 'FlowChart'
  const initialNoteMd = state?.noteMd ?? seedDiagram?.noteMd
  const initialFolderPath = seedDiagram?.folderPath ?? folderPathFromQuery
  const templateNote = state?.description

  const editor = useDiagramEditor({
    id,
    initialCode,
    initialTitle,
    initialNoteMd,
    initialFolderPath,
    templateNote,
  })

  const [panelMode, setPanelMode] = useState<EditorPanelMode>('code')
  const [autoRender, setAutoRender] = useState(true)
  const [zoom, setZoom] = useState(100)
  const { previewCode, renderNow } = useDebouncedPreview(editor.code, autoRender)

  if (loading || !editor.loaded) {
    return (
      <AppLayout embedMobileMenu>
        <div className="editor-loading">Loading diagram…</div>
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
        mermaidRevision={editor.mermaidRevision}
        noteRevision={editor.noteRevision}
        folderPath={editor.folderPath}
        folderPaths={folderPaths}
        versions={editor.versions}
        onTitleChange={editor.setTitle}
        onFolderChange={editor.setFolderPath}
        onRender={renderNow}
        onRestoreVersion={editor.restoreVersion}
      />
      <div className="workspace">
        <CodeEditor
          code={editor.code}
          setCode={editor.setCode}
          autoRender={autoRender}
          setAutoRender={setAutoRender}
          onFormat={() => editor.setCode(editor.code.trim())}
          onCopy={() => void navigator.clipboard.writeText(editor.code)}
          panelMode={panelMode}
          onPanelModeChange={setPanelMode}
          noteMd={editor.noteMd}
          setNoteMd={editor.setNoteMd}
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
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const folderPath = searchParams.get('folderPath') ?? ''

  return (
    <EditorSession
      key={editorSessionKey(id, location.state, folderPath)}
    />
  )
}
