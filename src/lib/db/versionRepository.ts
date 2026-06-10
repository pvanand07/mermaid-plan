import type { DiagramRecord, DiagramVersionRecord } from '../../data/types'
import { storageConfig } from '../../config/storage'
import { db } from './mermaidStudioDb'
import { updateDiagram } from './diagramRepository'

export async function listVersions(diagramId: string): Promise<DiagramVersionRecord[]> {
  const versions = await db.diagramVersions
    .where('diagramId')
    .equals(diagramId)
    .sortBy('createdAt')
  return versions.reverse()
}

export async function getVersion(versionId: string): Promise<DiagramVersionRecord | undefined> {
  return db.diagramVersions.get(versionId)
}

async function pruneOldSnapshots(diagramId: string): Promise<void> {
  const max = storageConfig.versioning.maxSnapshotsPerDiagram
  const versions = await db.diagramVersions
    .where('diagramId')
    .equals(diagramId)
    .sortBy('createdAt')

  if (versions.length <= max) return

  const toDelete = versions.slice(0, versions.length - max)
  await db.diagramVersions.bulkDelete(toDelete.map((v) => v.id))
}

export async function createVersionSnapshot(diagram: DiagramRecord): Promise<DiagramVersionRecord> {
  const record: DiagramVersionRecord = {
    id: crypto.randomUUID(),
    diagramId: diagram.id,
    mermaidCode: diagram.mermaidCode,
    noteMd: diagram.noteMd,
    title: diagram.title,
    createdAt: new Date().toISOString(),
  }

  await db.diagramVersions.add(record)
  await pruneOldSnapshots(diagram.id)
  return record
}

export async function restoreVersion(
  diagramId: string,
  versionId: string,
): Promise<DiagramRecord> {
  const snapshot = await getVersion(versionId)
  if (!snapshot || snapshot.diagramId !== diagramId) {
    throw new Error(`Version not found: ${versionId}`)
  }

  return updateDiagram(diagramId, {
    title: snapshot.title,
    mermaidCode: snapshot.mermaidCode,
    noteMd: snapshot.noteMd ?? null,
  })
}
