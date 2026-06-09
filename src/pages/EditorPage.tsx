import { useCallback, useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { TopBar } from '../components/editor/TopBar'
import { Workspace } from '../components/editor/Workspace'
import { defaultEditorCode, diagrams } from '../data/mockData'

export function EditorPage() {
  const { id } = useParams()
  const location = useLocation()
  const state = location.state as { code?: string; title?: string } | null

  const diagram = diagrams.find((d) => d.id === id)
  const initialCode = state?.code ?? diagram?.mermaidCode ?? defaultEditorCode
  const initialTitle = state?.title ?? diagram?.title ?? 'FlowChart'

  const [code, setCode] = useState(initialCode)
  const [title] = useState(initialTitle)
  const [autoRender, setAutoRender] = useState(true)
  const [previewCode, setPreviewCode] = useState(initialCode)
  const [zoom, setZoom] = useState(100)

  useEffect(() => {
    if (!autoRender) return
    const timer = setTimeout(() => setPreviewCode(code), 300)
    return () => clearTimeout(timer)
  }, [code, autoRender])

  const handleRender = useCallback(() => setPreviewCode(code), [code])

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(code)
  }, [code])

  const handleFormat = useCallback(() => {
    setCode(code.trim())
  }, [code])

  return (
    <AppLayout embedMobileMenu>
      <TopBar
        title={title}
        subtitle="Colorful process or dependency graph."
        onRender={handleRender}
      />
      <Workspace
        code={code}
        setCode={setCode}
        previewCode={previewCode}
        autoRender={autoRender}
        setAutoRender={setAutoRender}
        zoom={zoom}
        setZoom={setZoom}
        onFormat={handleFormat}
        onCopy={handleCopy}
      />
    </AppLayout>
  )
}
