import { useCallback, useEffect, useRef, useState } from 'react'
import { Hand, Maximize, Minimize2, Minus, Plus, RotateCcw, Share2 } from 'lucide-react'
import { ExportDropdown } from './ExportDropdown'
import { usePreviewViewport } from '../../hooks/usePreviewViewport'
import { MermaidRender } from '../MermaidRender'
import './Preview.css'

interface PreviewProps {
  previewCode: string
  exportCode: string
  filename: string
  zoom: number
  onZoomChange: (zoom: number) => void
}

export function Preview({ previewCode, exportCode, filename, zoom, onZoomChange }: PreviewProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const { pan, isDragging, scale, onPointerDown, onPointerMove, onPointerUp, onWheel, resetView } =
    usePreviewViewport(zoom, onZoomChange)

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === panelRef.current)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  const toggleFullscreen = useCallback(async () => {
    if (!panelRef.current) return
    if (document.fullscreenElement === panelRef.current) {
      await document.exitFullscreen()
    } else {
      await panelRef.current.requestFullscreen()
    }
  }, [])

  return (
    <div ref={panelRef} className={`preview-panel panel${isFullscreen ? ' is-fullscreen' : ''}`}>
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
            <RotateCcw size={14} />
          </button>
          <button
            type="button"
            className="btn-toolbar-icon"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit full screen' : 'Full screen'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize size={14} />}
          </button>
          <button type="button" className="btn-toolbar-icon">
            <Share2 size={14} />
          </button>
          <div className="divider" />
          <ExportDropdown code={exportCode} filename={filename} variant="toolbar" />
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
            <MermaidRender code={previewCode} />
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
