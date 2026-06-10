import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ChevronRight as ChevronRightIcon, Filter, Grid3x3, List, Plus } from 'lucide-react'
import { AppLayout } from '../components/AppLayout'
import { DiagramCard } from '../components/DiagramCard'
import { FolderCard } from '../components/FolderCard'
import { ImportCodeButton } from '../components/ImportCodeButton'
import { PageHeader } from '../components/PageHeader'
import { SearchInput } from '../components/SearchInput'
import { useDiagramStore } from '../context/DiagramStoreContext'
import { useFolderBrowser } from '../hooks/useFolderBrowser'
import { cn } from '../lib/cn'

export function MyDiagramsPage() {
  const { loading, dbError } = useDiagramStore()
  const {
    currentPath,
    childFolders,
    recentDiagrams,
    breadcrumbs,
    navigateToFolder,
    handleCreateFolder,
  } = useFolderBrowser()

  const newDiagramHref = currentPath
    ? `/editor?folderPath=${encodeURIComponent(currentPath)}`
    : '/editor'

  if (loading) {
    return (
      <AppLayout>
        <main className="dashboard-main">
          <div className="page-container editor-loading">Loading diagrams…</div>
        </main>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <main className="dashboard-main">
        <div className="page-container">
          {dbError && (
            <div className="db-error-banner">
              Storage unavailable — showing cached data if available. {dbError}
            </div>
          )}

          <PageHeader
            title="My Diagrams"
            subtitle="All your saved diagrams in one place."
            actions={
              <>
                <ImportCodeButton />
                <Link to={newDiagramHref} className="btn btn-primary">
                  <Plus size={16} />
                  New Diagram
                </Link>
              </>
            }
          />

          <nav className="folder-breadcrumbs" aria-label="Folder path">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.path || 'root'} className="breadcrumb-item">
                {i > 0 && <ChevronRightIcon size={14} className="icon-subtle breadcrumb-sep" />}
                <button
                  type="button"
                  className="breadcrumb-link"
                  onClick={() => navigateToFolder(crumb.path)}
                >
                  {crumb.label}
                </button>
              </span>
            ))}
          </nav>

          <div className="toolbar-row">
            <SearchInput placeholder="Search diagrams and folders..." />
            <button type="button" className="filter-btn">
              Sort: Recently edited
              <ChevronRight size={16} className="icon-subtle chevron-rotate-90" />
            </button>
            <button type="button" className="filter-btn">
              <Filter size={16} />
            </button>
            <div className="view-toggle">
              <button type="button" className="view-toggle-btn active" aria-label="Grid view">
                <Grid3x3 size={16} />
              </button>
              <button type="button" className="view-toggle-btn" aria-label="List view">
                <List size={16} />
              </button>
            </div>
          </div>

          <section className="content-section">
            <h2 className="section-heading">Folders</h2>
            <div className="folder-row">
              {childFolders.map((folder) => (
                <FolderCard
                  key={folder.path}
                  path={folder.path}
                  name={folder.name}
                  count={folder.count}
                  color={folder.color}
                  iconColor={folder.iconColor}
                  onOpen={() => navigateToFolder(folder.path)}
                />
              ))}
              <button type="button" className="new-folder-card" onClick={() => void handleCreateFolder()}>
                <Plus size={16} />
                New Folder
              </button>
            </div>
          </section>

          <section className="content-section">
            <div className="section-heading-row">
              <h2 className="section-heading">{currentPath ? 'Diagrams' : 'Recent'}</h2>
              {!currentPath && (
                <button type="button" className="btn-ghost">
                  View all →
                </button>
              )}
            </div>
            {recentDiagrams.length === 0 ? (
              <p className="empty-folder-message">No diagrams in this folder yet.</p>
            ) : (
              <div className="card-grid">
                {recentDiagrams.map((diagram) => (
                  <DiagramCard key={diagram.id} diagram={diagram} />
                ))}
              </div>
            )}
          </section>

          <div className="pagination-row">
            <div style={{ flex: 1 }} />
            <div className="pagination">
              <button type="button" className="pagination-btn nav">
                <ChevronLeft size={16} />
              </button>
              <button type="button" className={cn('pagination-btn', 'active')}>
                1
              </button>
              <button type="button" className="pagination-btn nav">
                <ChevronRight size={16} />
              </button>
            </div>
            <div style={{ flex: 1 }} />
          </div>
        </div>
      </main>
    </AppLayout>
  )
}
