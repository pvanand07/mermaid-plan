import { Folder, MoreVertical } from 'lucide-react'
import { cn } from '../lib/cn'

interface FolderCardProps {
  path: string
  name: string
  count: number
  color: string
  iconColor: string
  onOpen: () => void
}

export function FolderCard({ name, count, color, iconColor, onOpen }: FolderCardProps) {
  return (
    <button type="button" className="card folder-card folder-card--clickable" onClick={onOpen}>
      <div className={cn('folder-card-icon', color)}>
        <Folder size={20} className={iconColor} />
      </div>
      <div className="folder-card-info">
        <div className="folder-card-name">{name}</div>
        <div className="folder-card-count">
          {count} diagram{count === 1 ? '' : 's'}
        </div>
      </div>
      <span className="menu-btn" aria-hidden>
        <MoreVertical size={16} />
      </span>
    </button>
  )
}
