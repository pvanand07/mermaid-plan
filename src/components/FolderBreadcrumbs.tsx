import { ChevronRight, Home } from 'lucide-react'
import { cn } from '../lib/cn'

interface BreadcrumbSegment {
  label: string
  path: string
}

interface FolderBreadcrumbsProps {
  crumbs: BreadcrumbSegment[]
  onNavigate: (path: string) => void
}

export function FolderBreadcrumbs({ crumbs, onNavigate }: FolderBreadcrumbsProps) {
  const showTrail = crumbs.length > 1
  const lastIndex = crumbs.length - 1

  return (
    <nav className="folder-path-bar" aria-label="Folders">
      <div className="folder-path-leading">
        <h2 className="folder-path-title">Folders</h2>
        {showTrail && (
          <ChevronRight size={14} className="folder-path-title-sep icon-subtle" aria-hidden />
        )}
      </div>
      {showTrail && (
        <div className="folder-path-trail" aria-label="Current folder path">
          {crumbs.map((crumb, index) => {
            const isLast = index === lastIndex
            const isRoot = !crumb.path

            return (
              <span key={crumb.path || 'root'} className="folder-path-segment">
                {index > 0 && (
                  <ChevronRight size={14} className="folder-path-sep icon-subtle" aria-hidden />
                )}
                {isLast ? (
                  <span className="folder-path-current" aria-current="page">
                    {crumb.label}
                  </span>
                ) : (
                  <button
                    type="button"
                    className={cn('folder-path-link', isRoot && 'folder-path-link--home')}
                    onClick={() => onNavigate(crumb.path)}
                  >
                    {isRoot ? <Home size={14} aria-hidden /> : crumb.label}
                  </button>
                )}
              </span>
            )
          })}
        </div>
      )}
    </nav>
  )
}
