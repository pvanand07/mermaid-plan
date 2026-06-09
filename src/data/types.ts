export interface Folder {
  id: string
  name: string
  count: number
  color: string
  iconColor: string
}

export interface Diagram {
  id: string
  title: string
  type: string
  editedAgo: string
  starred: boolean
  folder?: string
  mermaidCode: string
}

export interface Template {
  id: string
  name: string
  description: string
  category: string
  iconColor: string
  bgColor: string
  starred: boolean
  mermaidCode: string
}
