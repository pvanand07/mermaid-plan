import { Link } from 'react-router-dom'
import { Folder, MoreVertical } from 'lucide-react'
import { getDiagramBadge, type Diagram } from '../data'
import { cn } from '../lib/cn'
import { MermaidRender } from './MermaidRender'
import { StarButton } from './StarButton'

export function DiagramCard({ diagram }: { diagram: Diagram }) {
  const badgeClass = getDiagramBadge(diagram.type)

  return (
    <Link to={`/editor/${diagram.id}`} className="card diagram-card">
      <div className="diagram-card-preview">
        <MermaidRender code={diagram.mermaidCode} scale={0.65} />
      </div>
      <div className="diagram-card-body">
        <div className="diagram-card-title-row">
          <h3 className="diagram-card-title">{diagram.title}</h3>
          <StarButton starred={diagram.starred} onClick={(e) => e.preventDefault()} />
        </div>
        <p className="diagram-card-meta">Edited {diagram.editedAgo}</p>
        <div className="diagram-card-footer">
          <span className={cn('badge', badgeClass)}>{diagram.type}</span>
          <div className="diagram-card-actions">
            {diagram.folder && (
              <Folder size={14} className="icon-faint" aria-label={diagram.folder} />
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
