import {
  BarChart3,
  GitBranch,
  Layers,
  Map,
  Network,
  PieChart,
  Route,
  Workflow,
  type LucideIcon,
} from 'lucide-react'

export const diagramTypeBadges: Record<string, string> = {
  Flowchart: 'badge-flowchart',
  'User Journey': 'badge-journey',
  Sequence: 'badge-sequence',
  'ER Diagram': 'badge-er',
  Gantt: 'badge-gantt',
  'Class Diagram': 'badge-class',
  Database: 'badge-database',
  'State Diagram': 'badge-state',
}

const templateIcons: Record<string, LucideIcon> = {
  flowchart: Workflow,
  sequence: GitBranch,
  class: Layers,
  er: Network,
  gantt: BarChart3,
  state: Route,
  pie: PieChart,
  journey: Map,
}

export function getDiagramBadge(type: string): string {
  return diagramTypeBadges[type] ?? 'badge-default'
}

export function getTemplateIcon(templateId: string): LucideIcon {
  return templateIcons[templateId] ?? Workflow
}
