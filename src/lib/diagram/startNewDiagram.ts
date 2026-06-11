import type { NavigateFunction } from 'react-router-dom'
import { emptyEditorCode } from '../../data'
import type { CreateDiagramInput } from '../../data/types'
import { createDiagram } from '../db/diagramRepository'

export type StartNewDiagramInput = Partial<
  Pick<CreateDiagramInput, 'title' | 'mermaidCode' | 'noteMd' | 'folderPath' | 'starred'>
>

export async function startNewDiagram(
  navigate: NavigateFunction,
  input?: StartNewDiagramInput,
): Promise<string> {
  const record = await createDiagram({
    title: input?.title ?? 'Untitled',
    mermaidCode: input?.mermaidCode ?? emptyEditorCode,
    noteMd: input?.noteMd,
    folderPath: input?.folderPath,
    starred: input?.starred,
  })
  navigate(`/editor/${record.id}`)
  return record.id
}
