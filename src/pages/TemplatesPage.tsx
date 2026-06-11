import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AppLayout } from '../components/AppLayout'
import { PageHeader } from '../components/PageHeader'
import { SearchInput } from '../components/SearchInput'
import { TemplateCard } from '../components/TemplateCard'
import { templateCategories, templates } from '../data'
import { useStartNewDiagram } from '../hooks/useStartNewDiagram'
import { cn } from '../lib/cn'

export function TemplatesPage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [query, setQuery] = useState('')
  const { startNewDiagram, creating } = useStartNewDiagram()

  const visibleTemplates = useMemo(() => {
    const q = query.trim().toLowerCase()
    return templates.filter((t) => {
      const inCategory = activeCategory === 'All' || t.category === activeCategory
      if (!inCategory) return false
      if (!q) return true
      return (
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      )
    })
  }, [activeCategory, query])

  return (
    <AppLayout>
      <main className="dashboard-main">
        <div className="page-container">
          <PageHeader
            title="Templates"
            subtitle="Choose a template to get started quickly."
            actions={
              <button
                type="button"
                className="btn btn-primary"
                disabled={creating}
                onClick={() => void startNewDiagram()}
              >
                <Plus size={16} />
                Blank Diagram
              </button>
            }
          />

          <div className="toolbar-row">
            <SearchInput
              placeholder="Search templates..."
              value={query}
              onChange={setQuery}
            />
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
        </div>
      </main>
    </AppLayout>
  )
}
