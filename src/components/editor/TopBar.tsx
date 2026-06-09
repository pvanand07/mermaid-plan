import { CheckCircle2, ChevronDown, Download, MoreVertical, Pencil, Play, Users } from 'lucide-react'
import { MobileMenuButton } from '../MobileMenuButton'

interface TopBarProps {
  title: string
  subtitle?: string
  onRender: () => void
}

export function TopBar({ title, subtitle, onRender }: TopBarProps) {
  return (
    <div className="topbar">
      <div className="topbar-left">
        <MobileMenuButton />
        <div className="title-area">
          <div className="title-row">
            <h1>{title}</h1>
            <button type="button" className="icon-btn">
              <Pencil size={14} className="icon-subtle" />
            </button>
            <div className="saved-status">
              <CheckCircle2 size={14} className="icon-primary" />
              <span>Saved</span>
            </div>
          </div>
          {subtitle && <span className="subtitle">{subtitle}</span>}
        </div>
      </div>

      <div className="topbar-right">
        <button type="button" className="btn btn-primary" onClick={onRender}>
          <Play size={14} fill="currentColor" /> Render
        </button>
        <button type="button" className="btn btn-secondary">
          <Users size={14} /> Share
        </button>
        <button type="button" className="btn btn-secondary">
          <Download size={14} /> Export <ChevronDown size={14} className="icon-muted export-chevron" />
        </button>
        <button type="button" className="btn-icon-only">
          <MoreVertical size={16} />
        </button>
      </div>
    </div>
  )
}
