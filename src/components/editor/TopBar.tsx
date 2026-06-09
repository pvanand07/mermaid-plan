import { CheckCircle2, Download, MoreVertical, Pencil, Play, Users } from 'lucide-react'
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
              <Pencil size={14} color="#94A3B8" />
            </button>
            <div className="saved-status">
              <CheckCircle2 size={14} color="#6366F1" />
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
          <Download size={14} /> Export <ChevronDownIcon />
        </button>
        <button type="button" className="btn-icon-only">
          <MoreVertical size={16} />
        </button>
      </div>
    </div>
  )
}

function ChevronDownIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ marginLeft: '4px', color: '#64748B' }}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}
