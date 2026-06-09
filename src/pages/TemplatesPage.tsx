import { Link } from 'react-router-dom'
import { ChevronDown, Grid3x3, MoreVertical, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AppLayout } from '../components/AppLayout'
import { ImportCodeButton } from '../components/ImportCodeButton'
import { PageHeader } from '../components/PageHeader'
import { SearchInput } from '../components/SearchInput'
import { TemplateCard } from '../components/TemplateCard'
import { templateCategories, templates } from '../data'
import { cn } from '../lib/cn'

export function TemplatesPage() {
  const [activeCategory, setActiveCategory] = useState('All')

  const visibleTemplates = useMemo(
    () =>
      activeCategory === 'All'
        ? templates
        : templates.filter((t) => t.category === activeCategory),
    [activeCategory],
  )

  return (
    <AppLayout>
      <main className="dashboard-main">
        <div className="page-container">
          <PageHeader
            title="Templates"
            subtitle="Choose a template to get started quickly."
            actions={
              <>
                <ImportCodeButton />
                <Link to="/editor" className="btn btn-primary">
                  <Plus size={16} />
                  Blank Diagram
                </Link>
                <button type="button" className="btn-icon-only">
                  <MoreVertical size={16} />
                </button>
              </>
            }
          />

          <div className="toolbar-row">
            <SearchInput placeholder="Search templates..." />
            <button type="button" className="filter-btn">
              <Grid3x3 size={16} className="icon-subtle" />
              All Categories
              <ChevronDown size={16} className="icon-subtle" />
            </button>
            <button type="button" className="filter-btn">
              Sort: Popular
              <ChevronDown size={16} className="icon-subtle" />
            </button>
          </div>

          <div className="chip-row">
            {templateCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={cn('chip', activeCategory === cat && 'active')}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="card-grid">
            {visibleTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>

          <div className="load-more-row">
            <button type="button" className="btn btn-secondary">
              Load more templates
              <ChevronDown size={16} className="icon-subtle" />
            </button>
          </div>
        </div>
      </main>
    </AppLayout>
  )
}
