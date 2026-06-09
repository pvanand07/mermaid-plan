import { Link } from 'react-router-dom'
import { Folder, MoreVertical, Star } from 'lucide-react'
import { badgeColors, type Diagram } from '../data/mockData'
import { MermaidRender } from './MermaidRender'

export function DiagramCard({ diagram }: { diagram: Diagram }) {
  const badgeClass = badgeColors[diagram.type] ?? 'badge-default'

  return (
    <Link to={`/editor/${diagram.id}`} className="card diagram-card">
      <div className="diagram-card-preview">
        <MermaidRender code={diagram.mermaidCode} scale={0.65} />
      </div>
      <div className="diagram-card-body">
        <div className="diagram-card-title-row">
          <h3 className="diagram-card-title">{diagram.title}</h3>
          <button
            type="button"
            className={`star-btn${diagram.starred ? ' active' : ''}`}
            onClick={(e) => e.preventDefault()}
          >
            <Star size={16} fill={diagram.starred ? 'currentColor' : 'none'} />
          </button>
        </div>
        <p className="diagram-card-meta">Edited {diagram.editedAgo}</p>
        <div className="diagram-card-footer">
          <span className={`badge ${badgeClass}`}>{diagram.type}</span>
          <div className="diagram-card-actions">
            {diagram.folder && (
              <Folder size={14} color="#CBD5E1" aria-label={diagram.folder} />
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
