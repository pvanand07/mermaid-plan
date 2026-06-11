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
}

export interface FolderRecord {
  path: string
  createdAt: string
}

export interface DiagramVersionRecord {
  id: string
  diagramId: string
  mermaidCode: string
  noteMd?: string
  title: string
  commitMessage?: string
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
}

export interface StoredChatMessage {
  id: string
  role: 'assistant' | 'user'
  content: string
  error?: boolean
  toolStatus?: {
    toolName?: 'update_mermaid' | 'update_note'
    commitMessage?: string
    result: {
      ok: boolean
      error?: string
      phase?: 'parse' | 'render'
      diagramType?: string
    }
  }
}

export interface ConversationRecord {
  diagramId: string
  messages: StoredChatMessage[]
  updatedAt: string
}
