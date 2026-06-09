import { Link } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Code2,
  Filter,
  Grid3x3,
  List,
  Plus,
  Search,
} from 'lucide-react'
import { AppLayout } from '../components/AppLayout'
import { DiagramCard } from '../components/DiagramCard'
import { FolderCard } from '../components/FolderCard'
import { diagrams, folders } from '../data/mockData'

export function MyDiagramsPage() {
  return (
    <AppLayout>
      <main className="dashboard-main">
        <div className="page-container">
          <div className="page-header">
            <div>
              <h1 className="page-title">My Diagrams</h1>
              <p className="page-subtitle">All your saved diagrams in one place.</p>
            </div>
            <div className="page-actions">
              <button type="button" className="btn btn-secondary">
                <Code2 size={16} />
                Import Mermaid code
              </button>
              <Link to="/editor" className="btn btn-primary">
                <Plus size={16} />
                New Diagram
              </Link>
            </div>
          </div>

          <div className="toolbar-row">
            <div className="search-input-wrapper">
              <Search size={16} className="search-input-icon" />
              <input
                type="text"
                placeholder="Search diagrams and folders..."
                className="search-input"
              />
            </div>
            <button type="button" className="filter-btn">
              Sort: Recently edited
              <ChevronRight size={16} style={{ transform: 'rotate(90deg)', color: '#94A3B8' }} />
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
              {folders.map((folder) => (
                <FolderCard key={folder.id} folder={folder} />
              ))}
              <button type="button" className="new-folder-card">
                <Plus size={16} />
                New Folder
              </button>
            </div>
          </section>

          <section className="content-section">
            <div className="section-heading-row">
              <h2 className="section-heading">Recent</h2>
              <button type="button" className="btn-ghost">
                View all →
              </button>
            </div>
            <div className="card-grid">
              {diagrams.map((diagram) => (
                <DiagramCard key={diagram.id} diagram={diagram} />
              ))}
            </div>
          </section>

          <div className="pagination-row">
            <div style={{ flex: 1 }} />
            <div className="pagination">
              <button type="button" className="pagination-btn nav">
                <ChevronLeft size={16} />
              </button>
              {[1, 2, 3].map((page) => (
                <button
                  key={page}
                  type="button"
                  className={`pagination-btn${page === 1 ? ' active' : ''}`}
                >
                  {page}
                </button>
              ))}
              <span className="pagination-ellipsis">...</span>
              <button type="button" className="pagination-btn">
                12
              </button>
              <button type="button" className="pagination-btn nav">
                <ChevronRight size={16} />
              </button>
            </div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="filter-btn">
                Show 12 per page
                <ChevronRight size={16} style={{ transform: 'rotate(90deg)', color: '#94A3B8' }} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  )
}
