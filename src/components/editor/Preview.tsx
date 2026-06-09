import { useRef } from 'react'
import { Download, Hand, Maximize, Minus, Plus, Share2 } from 'lucide-react'
import { usePreviewViewport } from '../../hooks/usePreviewViewport'
import { MermaidRender } from '../MermaidRender'
import './Preview.css'

interface PreviewProps {
  code: string
  zoom: number
  onZoomChange: (zoom: number) => void
}

export function Preview({ code, zoom, onZoomChange }: PreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const { pan, isDragging, scale, onPointerDown, onPointerMove, onPointerUp, onWheel, resetView } =
    usePreviewViewport(zoom, onZoomChange)

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
          <button type="button" className="btn-toolbar-icon" onClick={resetView} title="Reset view">
            <Maximize size={14} />
          </button>
          <button type="button" className="btn-toolbar-icon">
            <Share2 size={14} />
          </button>
          <div className="divider" />
          <button type="button" className="download-btn">
            <Download size={14} className="icon-muted" /> Download SVG
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className={`preview-content-container${isDragging ? ' is-dragging' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onWheel={onWheel}
      >
        <div
          className="preview-viewport"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          }}
        >
          <div className="mermaid-wrapper">
            <MermaidRender code={code} />
          </div>
        </div>
      </div>

      <div className="preview-footer">
        <div className="hints">
          <div className="hint">
            <Hand size={14} /> Drag to pan
          </div>
          <span className="dot-separator">•</span>
          <div className="hint">Scroll to zoom</div>
        </div>
      </div>
    </div>
  )
}
