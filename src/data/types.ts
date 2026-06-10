/** @deprecated Seed-only UI type; use DiagramRecord for persisted data */
export interface Folder {
  id: string
  name: string
  count: number
  color: string
  iconColor: string
}

/** @deprecated Seed-only UI type; use DiagramRecord for persisted data */
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

export type VersionField = 'mermaidCode' | 'noteMd' | 'title'

export interface DiagramRecord {
  id: string
  title: string
  mermaidCode: string
  noteMd?: string
  folderPath: string
  type: string
  starred: boolean
  createdAt: string
  updatedAt: string
  mermaidRevision: number
  noteRevision: number
  snapshotVersion: number
}

export interface FolderRecord {
  path: string
  createdAt: string
}

export interface DiagramVersionRecord {
  id: string
  diagramId: string
  snapshotVersion: number
  mermaidRevision: number
  noteRevision: number
  mermaidCode: string
  noteMd?: string
  title: string
  changedFields: VersionField[]
  createdAt: string
}

export interface CreateDiagramInput {
  title: string
  mermaidCode: string
  noteMd?: string
  folderPath?: string
  starred?: boolean
}

export interface UpdateDiagramPatch {
  title?: string
  mermaidCode?: string
  noteMd?: string | null
  folderPath?: string
  starred?: boolean
  mermaidRevision?: number
  noteRevision?: number
  snapshotVersion?: number
}
