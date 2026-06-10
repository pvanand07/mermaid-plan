const TYPE_MAP: Record<string, string> = {
  flowchart: 'Flowchart',
  graph: 'Flowchart',
  sequencediagram: 'Sequence',
  classdiagram: 'Class Diagram',
  statediagram: 'State Diagram',
  'statediagram-v2': 'State Diagram',
  erdiagram: 'ER Diagram',
  gantt: 'Gantt',
  pie: 'Pie Chart',
  journey: 'User Journey',
  gitgraph: 'Git Graph',
  mindmap: 'Mindmap',
  timeline: 'Timeline',
  c4context: 'C4 Context',
}

export function detectDiagramType(mermaidCode: string): string {
  const firstLine = mermaidCode
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length > 0 && !l.startsWith('%%'))

  if (!firstLine) return 'Flowchart'

  const token = firstLine.split(/\s+/)[0]?.toLowerCase() ?? ''
  return TYPE_MAP[token] ?? 'Flowchart'
}
