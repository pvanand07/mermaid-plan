import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Download } from 'lucide-react'
import { cn } from '../../lib/cn'
import {
  copyMermaid,
  copySvg,
  downloadMermaid,
  downloadPng,
  downloadSvg,
  sanitizeFilename,
} from '../../lib/exportDiagram'
import './ExportDropdown.css'

type ExportAction = 'svg' | 'png' | 'mmd' | 'copy-svg' | 'copy-mmd'

interface ExportOption {
  id: ExportAction
  label: string
  description: string
}

const exportOptions: ExportOption[] = [
  { id: 'svg', label: 'SVG image', description: 'Vector file for web or design tools' },
  { id: 'png', label: 'PNG image', description: 'Raster image with white background' },
  { id: 'mmd', label: 'Mermaid source', description: 'Download .mmd text file' },
  { id: 'copy-svg', label: 'Copy SVG', description: 'Copy rendered SVG to clipboard' },
  { id: 'copy-mmd', label: 'Copy source', description: 'Copy Mermaid code to clipboard' },
]

interface ExportDropdownProps {
  code: string
  filename: string
  variant?: 'topbar' | 'toolbar'
}

export function ExportDropdown({ code, filename, variant = 'toolbar' }: ExportDropdownProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [busyAction, setBusyAction] = useState<ExportAction | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const safeFilename = sanitizeFilename(filename)

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(() => setMessage(null), 2400)
    return () => window.clearTimeout(timer)
  }, [message])

  const runExport = async (action: ExportAction) => {
    setBusyAction(action)
    setMessage(null)

    try {
      switch (action) {
        case 'svg':
          await downloadSvg(code, safeFilename)
          setMessage('SVG downloaded')
          break
        case 'png':
          await downloadPng(code, safeFilename)
          setMessage('PNG downloaded')
          break
        case 'mmd':
          await downloadMermaid(code, safeFilename)
          setMessage('Source downloaded')
          break
        case 'copy-svg':
          await copySvg(code)
          setMessage('SVG copied')
          break
        case 'copy-mmd':
          await copyMermaid(code)
          setMessage('Source copied')
          break
      }
      setOpen(false)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Export failed')
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <div
      ref={rootRef}
      className={cn('export-dropdown', variant === 'topbar' ? 'export-dropdown-topbar' : 'export-dropdown-toolbar')}
    >
      <button
        type="button"
        className={cn(
          variant === 'topbar' ? 'btn btn-secondary export-dropdown-trigger' : 'export-dropdown-trigger export-dropdown-trigger-toolbar',
          open && 'is-open',
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
      >
        <Download size={14} className={variant === 'toolbar' ? 'icon-muted' : undefined} />
        Export
        <ChevronDown size={14} className={cn('export-chevron', open && 'is-open')} />
      </button>

      {open && (
        <div className="export-dropdown-menu" role="menu">
          {exportOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              role="menuitem"
              className="export-dropdown-item"
              disabled={busyAction !== null}
              onClick={() => void runExport(option.id)}
            >
              <span className="export-dropdown-item-label">{option.label}</span>
              <span className="export-dropdown-item-description">{option.description}</span>
            </button>
          ))}
        </div>
      )}

      {message && <div className="export-dropdown-feedback">{message}</div>}
    </div>
  )
}
