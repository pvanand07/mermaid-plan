import { useCallback, useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useLoaderData } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { CodeEditor } from '../components/editor/CodeEditor'
import type { EditorPanelMode } from '../components/editor/CodeEditor'
import { Preview } from '../components/editor/Preview'
import { TopBar } from '../components/editor/TopBar'
import { EditorProvider } from '../context/EditorContext'
import type { EditorContextValue } from '../context/editor-context'
import type { DiagramRecord } from '../data/types'
import { useDebouncedPreview } from '../hooks/useDebouncedPreview'
import { useDiagramEditor } from '../hooks/useDiagramEditor'
import { listAllFolderPaths } from '../lib/db/folderRepository'
import type { PreviewValidationCache } from '../lib/mermaid/previewValidation'
import { resolveDiagramValidation } from '../lib/mermaid/previewValidation'
import type { MermaidValidationResult } from '../lib/mermaid/validateDiagram'

function EditorSession({ record }: { record: DiagramRecord }) {
  const editor = useDiagramEditor({ id: record.id, initial: record })
  const folderPaths = useLiveQuery(() => listAllFolderPaths(), [], [])

  const [panelMode, setPanelMode] = useState<EditorPanelMode>('code')
  const [zoom, setZoom] = useState(100)
  const previewCode = useDebouncedPreview(editor.code)
  const previewValidationRef = useRef<PreviewValidationCache | null>(null)

  const handleRenderResult = useCallback((code: string, result: MermaidValidationResult) => {
    previewValidationRef.current = { code, result }
  }, [])

  const validateDiagramCode = useCallback(
    (code: string) => resolveDiagramValidation(code, previewCode, previewValidationRef),
    [previewCode],
  )

  const contextValue = useMemo(
    (): EditorContextValue => ({
      ...editor,
      folderPaths: folderPaths ?? [],
      previewCode,
      previewValidationRef,
      validateDiagramCode,
    }),
    [editor, folderPaths, previewCode, validateDiagramCode],
  )

  return (
    <EditorProvider value={contextValue}>
      <AppLayout embedMobileMenu>
        <TopBar />
        <div className="workspace">
          <CodeEditor panelMode={panelMode} onPanelModeChange={setPanelMode} />
          <Preview
            previewCode={previewCode}
            exportCode={editor.code}
            filename={editor.title}
            zoom={zoom}
            onZoomChange={setZoom}
            onRenderResult={handleRenderResult}
          />
        </div>
      </AppLayout>
    </EditorProvider>
  )
}

export function EditorPage() {
  const record = useLoaderData() as DiagramRecord
  return <EditorSession key={record.id} record={record} />
}
