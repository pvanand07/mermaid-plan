import { Link } from 'react-router-dom'
import {
  BarChart3,
  GitBranch,
  Layers,
  Map,
  Network,
  PieChart,
  Route,
  Star,
  Workflow,
} from 'lucide-react'
import type { Template } from '../data/mockData'
import { MermaidRender } from './MermaidRender'

const iconMap: Record<string, typeof Workflow> = {
  flowchart: Workflow,
  sequence: GitBranch,
  class: Layers,
  er: Network,
  gantt: BarChart3,
  state: Route,
  pie: PieChart,
  journey: Map,
}

export function TemplateCard({ template }: { template: Template }) {
  const Icon = iconMap[template.id] ?? Workflow

  return (
    <div className="card template-card">
      <div className="template-card-preview">
        <div className={`template-card-icon ${template.bgColor}`}>
          <Icon size={16} className={template.iconColor} />
        </div>
        <MermaidRender code={template.mermaidCode} scale={0.55} />
      </div>
      <div className="template-card-body">
        <h3 className="template-card-title">{template.name}</h3>
        <p className="template-card-desc">{template.description}</p>
        <div className="template-card-footer">
          <Link
            to="/editor"
            state={{ code: template.mermaidCode, title: template.name }}
            className="template-use-btn"
          >
            Use template
          </Link>
          <button
            type="button"
            className={`star-btn${template.starred ? ' active' : ''}`}
          >
            <Star size={16} fill={template.starred ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
    </div>
  )
}
