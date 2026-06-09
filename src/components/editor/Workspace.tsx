import { CodeEditor } from './CodeEditor'
import { Preview } from './Preview'

interface WorkspaceProps {
  code: string
  setCode: (code: string) => void
  previewCode: string
  autoRender: boolean
  setAutoRender: (val: boolean) => void
  zoom: number
  setZoom: (zoom: number) => void
  onFormat: () => void
  onCopy: () => void
}

export function Workspace({
  code,
  setCode,
  previewCode,
  autoRender,
  setAutoRender,
  zoom,
  setZoom,
  onFormat,
  onCopy,
}: WorkspaceProps) {
  return (
    <div className="workspace">
      <CodeEditor
        code={code}
        setCode={setCode}
        autoRender={autoRender}
        setAutoRender={setAutoRender}
        onFormat={onFormat}
        onCopy={onCopy}
      />
      <Preview code={previewCode} zoom={zoom} onZoomChange={setZoom} />
    </div>
  )
}
