import { useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { CodeEditor } from '../components/editor/CodeEditor'
import { Preview } from '../components/editor/Preview'
import { TopBar } from '../components/editor/TopBar'
import { defaultEditorCode, diagrams } from '../data'
import { useDebouncedPreview } from '../hooks/useDebouncedPreview'

function editorSessionKey(id: string | undefined, state: unknown): string {
  const navigation = state as { code?: string; title?: string } | null
  return `${id ?? 'new'}:${navigation?.title ?? ''}:${navigation?.code?.length ?? 0}`
}

function EditorSession() {
  const { id } = useParams()
  const location = useLocation()
  const state = location.state as { code?: string; title?: string } | null

  const diagram = diagrams.find((d) => d.id === id)
  const initialCode = state?.code ?? diagram?.mermaidCode ?? defaultEditorCode
  const title = state?.title ?? diagram?.title ?? 'FlowChart'

  const [code, setCode] = useState(initialCode)
  const [autoRender, setAutoRender] = useState(true)
  const [zoom, setZoom] = useState(100)
  const { previewCode, renderNow } = useDebouncedPreview(code, autoRender)

  return (
    <AppLayout embedMobileMenu>
      <TopBar
        title={title}
        subtitle="Colorful process or dependency graph."
        code={code}
        onRender={renderNow}
      />
      <div className="workspace">
        <CodeEditor
          code={code}
          setCode={setCode}
          autoRender={autoRender}
          setAutoRender={setAutoRender}
          onFormat={() => setCode(code.trim())}
          onCopy={() => void navigator.clipboard.writeText(code)}
        />
        <Preview
          previewCode={previewCode}
          exportCode={code}
          filename={title}
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

  return <EditorSession key={editorSessionKey(id, location.state)} />
}
