import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { AppLayout } from '../components/AppLayout'
import { CreateFolderDialog } from '../components/CreateFolderDialog'
import { DiagramCard } from '../components/DiagramCard'
import { FolderBreadcrumbs } from '../components/FolderBreadcrumbs'
import { FolderCard } from '../components/FolderCard'
import { PageHeader } from '../components/PageHeader'
import { SearchInput } from '../components/SearchInput'
import { useFolderBrowser } from '../hooks/useFolderBrowser'
import { useStartNewDiagram } from '../hooks/useStartNewDiagram'
import { getFolderName } from '../lib/folders/pathUtils'

export function MyDiagramsPage() {
  const [query, setQuery] = useState('')
  const [folderDialogOpen, setFolderDialogOpen] = useState(false)
  const {
    dbError,
    currentPath,
    childFolders,
    recentDiagrams,
    breadcrumbs,
    navigateToFolder,
    createFolderAtPath,
  } = useFolderBrowser()
  const { startNewDiagram, creating } = useStartNewDiagram()

  const q = query.trim().toLowerCase()

  const filteredFolders = useMemo(() => {
    if (!q) return childFolders
    return childFolders.filter(
      (f) => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q),
    )
  }, [childFolders, q])

  const filteredDiagrams = useMemo(() => {
    if (!q) return recentDiagrams
    return recentDiagrams.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.folderPath.toLowerCase().includes(q) ||
        getFolderName(d.folderPath).toLowerCase().includes(q),
    )
  }, [recentDiagrams, q])

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
              <button
                type="button"
                className="btn btn-primary"
                disabled={creating}
                onClick={() => void startNewDiagram({ folderPath: currentPath })}
              >
                <Plus size={16} />
                New Diagram
              </button>
            }
          />

          <div className="toolbar-row">
            <SearchInput
              placeholder="Search diagrams and folders..."
              value={query}
              onChange={setQuery}
            />
          </div>

          <FolderBreadcrumbs crumbs={breadcrumbs} onNavigate={navigateToFolder} />

          <section className="content-section content-section--folders">
            <div className="folder-row">
              {filteredFolders.map((folder) => (
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
              <button
                type="button"
                className="new-folder-card"
                onClick={() => setFolderDialogOpen(true)}
              >
                <Plus size={16} />
                New Folder
              </button>
            </div>
          </section>

          <section className="content-section">
            <h2 className="section-heading">{currentPath ? 'Diagrams' : 'Recent'}</h2>
            {filteredDiagrams.length === 0 ? (
              <p className="empty-folder-message">No diagrams in this folder yet.</p>
            ) : (
              <div className="card-grid">
                {filteredDiagrams.map((diagram) => (
                  <DiagramCard key={diagram.id} diagram={diagram} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <CreateFolderDialog
        open={folderDialogOpen}
        parentPath={currentPath}
        siblingNames={childFolders.map((folder) => folder.name)}
        onClose={() => setFolderDialogOpen(false)}
        onCreate={createFolderAtPath}
      />
    </AppLayout>
  )
}
