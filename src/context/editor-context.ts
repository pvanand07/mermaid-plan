import { createContext, type MutableRefObject } from 'react'
import type { DiagramVersionRecord, Template } from '../data/types'
import type { SaveStatus } from '../hooks/useDiagramEditor'
import type { PreviewValidationCache } from '../lib/mermaid/previewValidation'
import type { MermaidValidationResult } from '../lib/mermaid/validateDiagram'

export interface EditorContextValue {
  diagramId: string
  title: string
  setTitle: (title: string) => void
  code: string
  setCode: (code: string) => void
  noteMd: string
  setNoteMd: (noteMd: string) => void
  folderPath: string
  setFolderPath: (folderPath: string) => void
  saveStatus: SaveStatus
  versions: DiagramVersionRecord[]
  folderPaths: string[]
  restoreVersion: (versionId: string) => Promise<void>
  applyAgentDiagramUpdate: (code: string, commitMessage?: string) => Promise<void>
  applyAgentNoteUpdate: (noteMd: string, commitMessage?: string) => Promise<void>
  applyTemplate: (template: Template) => void
  previewCode: string
  previewValidationRef: MutableRefObject<PreviewValidationCache | null>
  validateDiagramCode: (code: string) => Promise<MermaidValidationResult>
  validationError: Extract<MermaidValidationResult, { ok: false }> | null
  previewRenderStatus: MermaidValidationResult | null
}

export const EditorContext = createContext<EditorContextValue | null>(null)
