import { Link } from 'react-router-dom'
import { FileText, Folder, MoreVertical } from 'lucide-react'
import type { DiagramRecord } from '../data/types'
import { getDiagramBadge } from '../data/meta'
import { useDiagramStore } from '../context/DiagramStoreContext'
import { formatEditedAgo } from '../lib/formatEditedAgo'
import { getFolderName } from '../lib/folders/pathUtils'
import { cn } from '../lib/cn'
import { MermaidRender } from './MermaidRender'
import { StarButton } from './StarButton'

export function DiagramCard({ diagram }: { diagram: DiagramRecord }) {
  const { toggleStar } = useDiagramStore()
  const badgeClass = getDiagramBadge(diagram.type)
  const hasNote = Boolean(diagram.noteMd?.trim())

  return (
    <Link to={`/editor/${diagram.id}`} className="card diagram-card">
      <div className="diagram-card-preview">
        <MermaidRender code={diagram.mermaidCode} scale={0.65} />
      </div>
      <div className="diagram-card-body">
        <div className="diagram-card-title-row">
          <h3 className="diagram-card-title">{diagram.title}</h3>
          <StarButton
            starred={diagram.starred}
            onClick={(e) => {
              e.preventDefault()
              void toggleStar(diagram.id)
            }}
          />
        </div>
        <p className="diagram-card-meta">Edited {formatEditedAgo(diagram.updatedAt)}</p>
        <div className="diagram-card-footer">
          <span className={cn('badge', badgeClass)}>{diagram.type}</span>
          <div className="diagram-card-actions">
            {hasNote && (
              <FileText size={14} className="icon-faint" aria-label="Has note" />
            )}
            {diagram.folderPath && (
              <Folder
                size={14}
                className="icon-faint"
                aria-label={getFolderName(diagram.folderPath)}
              />
            )}
            <button
              type="button"
              className="menu-btn"
              onClick={(e) => e.preventDefault()}
            >
              <MoreVertical size={16} />
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}
