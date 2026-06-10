import { createElement } from 'react'
import { Link } from 'react-router-dom'
import { getTemplateIcon, type Template } from '../data'
import { cn } from '../lib/cn'
import { MermaidRender } from './MermaidRender'
import { StarButton } from './StarButton'

export function TemplateCard({ template }: { template: Template }) {
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
          <Link
            to="/editor"
            state={{
              code: template.mermaidCode,
              title: template.name,
              description: template.description,
            }}
            className="template-use-btn"
          >
            Use template
          </Link>
          <StarButton starred={template.starred} />
        </div>
      </div>
    </div>
  )
}
