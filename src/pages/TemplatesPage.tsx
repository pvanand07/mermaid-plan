import { Link } from 'react-router-dom'
import {
  ChevronDown,
  Code2,
  Grid3x3,
  MoreVertical,
  Plus,
  Search,
} from 'lucide-react'
import { useState } from 'react'
import { AppLayout } from '../components/AppLayout'
import { TemplateCard } from '../components/TemplateCard'
import { templateCategories, templates } from '../data/mockData'

export function TemplatesPage() {
  const [activeCategory, setActiveCategory] = useState('All')

  return (
    <AppLayout>
      <main className="dashboard-main">
        <div className="page-container">
          <div className="page-header">
            <div>
              <h1 className="page-title">Templates</h1>
              <p className="page-subtitle">Choose a template to get started quickly.</p>
            </div>
            <div className="page-actions">
              <button type="button" className="btn btn-secondary">
                <Code2 size={16} />
                Import Mermaid code
              </button>
              <Link to="/editor" className="btn btn-primary">
                <Plus size={16} />
                Blank Diagram
              </Link>
              <button type="button" className="btn-icon-only">
                <MoreVertical size={16} />
              </button>
            </div>
          </div>

          <div className="toolbar-row">
            <div className="search-input-wrapper">
              <Search size={16} className="search-input-icon" />
              <input type="text" placeholder="Search templates..." className="search-input" />
            </div>
            <button type="button" className="filter-btn">
              <Grid3x3 size={16} color="#94A3B8" />
              All Categories
              <ChevronDown size={16} color="#94A3B8" />
            </button>
            <button type="button" className="filter-btn">
              Sort: Popular
              <ChevronDown size={16} color="#94A3B8" />
            </button>
          </div>

          <div className="chip-row">
            {templateCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`chip${activeCategory === cat ? ' active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="card-grid">
            {templates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>

          <div className="load-more-row">
            <button type="button" className="btn btn-secondary">
              Load more templates
              <ChevronDown size={16} color="#94A3B8" />
            </button>
          </div>
        </div>
      </main>
    </AppLayout>
  )
}
