import { Hand, Maximize, Minus, MousePointer2, Plus, Share2, Download } from 'lucide-react'
import { MermaidRender } from '../MermaidRender'
import './Preview.css'

interface PreviewProps {
  code: string
  zoom: number
  onZoomChange: (zoom: number) => void
}

export function Preview({ code, zoom, onZoomChange }: PreviewProps) {
  return (
    <div className="preview-panel panel">
      <div className="panel-header">
        <div className="preview-title">Preview</div>
        <div className="preview-toolbar">
          <div className="zoom-controls">
            <button
              type="button"
              className="icon-btn"
              onClick={() => onZoomChange(Math.max(25, zoom - 10))}
            >
              <Minus size={14} />
            </button>
            <span className="zoom-level">{zoom}%</span>
            <button
              type="button"
              className="icon-btn"
              onClick={() => onZoomChange(Math.min(200, zoom + 10))}
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="divider" />
          <button type="button" className="btn-toolbar-icon">
            <Maximize size={14} />
          </button>
          <button type="button" className="btn-toolbar-icon">
            <Share2 size={14} />
          </button>
          <div className="divider" />
          <button type="button" className="download-btn">
            <Download size={14} color="#475569" /> Download SVG
          </button>
        </div>
      </div>

      <div className="preview-content-container">
        <div className="mermaid-wrapper">
          <MermaidRender code={code} scale={zoom / 100} />
        </div>
      </div>

      <div className="preview-footer">
        <div className="hints">
          <div className="hint">
            <Hand size={14} /> Drag to pan
          </div>
          <span className="dot-separator">•</span>
          <div className="hint">Scroll to zoom</div>
          <span className="dot-separator">•</span>
          <div className="hint">
            <MousePointer2 size={14} /> Double-click a node to edit
          </div>
        </div>
      </div>
    </div>
  )
}
