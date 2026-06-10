import type {
  CreateDiagramInput,
  DiagramRecord,
  UpdateDiagramPatch,
} from '../../data/types'
import { detectDiagramType } from '../diagram/detectDiagramType'
import { normalizeFolderPath } from '../folders/pathUtils'
import { db } from './mermaidStudioDb'

export async function listDiagrams(opts?: {
  folderPath?: string
}): Promise<DiagramRecord[]> {
  if (opts?.folderPath !== undefined) {
    const path = normalizeFolderPath(opts.folderPath)
    const items = await db.diagrams.where('folderPath').equals(path).toArray()
    return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  return db.diagrams.orderBy('updatedAt').reverse().toArray()
}

export async function getDiagram(id: string): Promise<DiagramRecord | undefined> {
  return db.diagrams.get(id)
}

export async function createDiagram(input: CreateDiagramInput): Promise<DiagramRecord> {
  const now = new Date().toISOString()
  const noteMd = input.noteMd?.trim() || undefined
  const record: DiagramRecord = {
    id: crypto.randomUUID(),
    title: input.title.trim() || 'Untitled',
    mermaidCode: input.mermaidCode,
    noteMd,
    folderPath: normalizeFolderPath(input.folderPath ?? ''),
    type: detectDiagramType(input.mermaidCode),
    starred: input.starred ?? false,
    createdAt: now,
    updatedAt: now,
    mermaidRevision: 1,
    noteRevision: noteMd ? 1 : 0,
    snapshotVersion: 1,
  }
  await db.diagrams.add(record)
  return record
}

export async function updateDiagram(
  id: string,
  patch: UpdateDiagramPatch,
): Promise<DiagramRecord> {
  const existing = await db.diagrams.get(id)
  if (!existing) throw new Error(`Diagram not found: ${id}`)

  const next: DiagramRecord = {
    ...existing,
    ...patch,
    noteMd:
      patch.noteMd === null
        ? undefined
        : patch.noteMd !== undefined
          ? patch.noteMd.trim() || undefined
          : existing.noteMd,
    folderPath:
      patch.folderPath !== undefined
        ? normalizeFolderPath(patch.folderPath)
        : existing.folderPath,
    updatedAt: new Date().toISOString(),
  }

  if (patch.mermaidCode !== undefined) {
    next.type = detectDiagramType(patch.mermaidCode)
  }

  await db.diagrams.put(next)
  return next
}

export async function deleteDiagram(id: string): Promise<void> {
  await db.transaction('rw', db.diagrams, db.diagramVersions, async () => {
    await db.diagramVersions.where('diagramId').equals(id).delete()
    await db.diagrams.delete(id)
  })
}

export async function toggleStar(id: string): Promise<DiagramRecord> {
  const existing = await db.diagrams.get(id)
  if (!existing) throw new Error(`Diagram not found: ${id}`)
  return updateDiagram(id, { starred: !existing.starred })
}
