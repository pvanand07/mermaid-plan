import { Folder, MoreVertical } from 'lucide-react'
import type { Folder as FolderType } from '../data/mockData'

export function FolderCard({ folder }: { folder: FolderType }) {
  return (
    <div className="card folder-card">
      <div className={`folder-card-icon ${folder.color}`}>
        <Folder size={20} className={folder.iconColor} />
      </div>
      <div className="folder-card-info">
        <div className="folder-card-name">{folder.name}</div>
        <div className="folder-card-count">{folder.count} diagrams</div>
      </div>
      <button type="button" className="menu-btn">
        <MoreVertical size={16} />
      </button>
    </div>
  )
}
