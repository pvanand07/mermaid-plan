import { createElement } from 'react'
import { getTemplateIcon, type Template } from '../data'
import { useStartNewDiagram } from '../hooks/useStartNewDiagram'
import { cn } from '../lib/cn'
import { MermaidRender } from './MermaidRender'
import { StarButton } from './StarButton'

export function TemplateCard({ template }: { template: Template }) {
  const { startNewDiagram, creating } = useStartNewDiagram()

  return (
    <div className="card template-card">
      <div className="template-card-preview">
        <div className={cn('template-card-icon', template.bgColor)}>
          {createElement(getTemplateIcon(template.id), {
            size: 16,
            className: template.iconColor,
          })}
        </div>
        <MermaidRender code={template.mermaidCode} scale={0.55} />
      </div>
      <div className="template-card-body">
        <h3 className="template-card-title">{template.name}</h3>
        <p className="template-card-desc">{template.description}</p>
        <div className="template-card-footer">
          <button
            type="button"
            className="template-use-btn"
            disabled={creating}
            onClick={() =>
              void startNewDiagram({
                title: template.name,
                mermaidCode: template.mermaidCode,
                noteMd: template.description,
              })
            }
          >
            Use template
          </button>
          <StarButton starred={template.starred} />
        </div>
      </div>
    </div>
  )
}
