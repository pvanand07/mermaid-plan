import type { DiagramRecord, DiagramVersionRecord, VersionField } from '../../data/types'
import { storageConfig } from '../../config/storage'
import { db } from './mermaidStudioDb'
import { updateDiagram } from './diagramRepository'

export async function listVersions(
  diagramId: string,
  opts?: { field?: VersionField },
): Promise<DiagramVersionRecord[]> {
  const versions = await db.diagramVersions
    .where('diagramId')
    .equals(diagramId)
    .reverse()
    .sortBy('snapshotVersion')

  if (!opts?.field) return versions.reverse()

  return versions
    .filter((v) => v.changedFields.includes(opts.field!))
    .reverse()
}

export async function getVersion(
  diagramId: string,
  snapshotVersion: number,
): Promise<DiagramVersionRecord | undefined> {
  return db.diagramVersions
    .where('[diagramId+snapshotVersion]')
    .equals([diagramId, snapshotVersion])
    .first()
}

async function pruneOldSnapshots(diagramId: string): Promise<void> {
  const max = storageConfig.versioning.maxSnapshotsPerDiagram
  const versions = await db.diagramVersions
    .where('diagramId')
    .equals(diagramId)
    .sortBy('snapshotVersion')

  if (versions.length <= max) return

  const toDelete = versions.slice(0, versions.length - max)
  await db.diagramVersions.bulkDelete(toDelete.map((v) => v.id))
}

export async function createVersionSnapshot(
  diagram: DiagramRecord,
  changedFields: VersionField[],
): Promise<DiagramVersionRecord> {
  const record: DiagramVersionRecord = {
    id: crypto.randomUUID(),
    diagramId: diagram.id,
    snapshotVersion: diagram.snapshotVersion,
    mermaidRevision: diagram.mermaidRevision,
    noteRevision: diagram.noteRevision,
    mermaidCode: diagram.mermaidCode,
    noteMd: diagram.noteMd,
    title: diagram.title,
    changedFields,
    createdAt: new Date().toISOString(),
  }

  await db.diagramVersions.add(record)
  await pruneOldSnapshots(diagram.id)
  return record
}

export async function restoreVersion(
  diagramId: string,
  snapshotVersion: number,
): Promise<DiagramRecord> {
  const snapshot = await getVersion(diagramId, snapshotVersion)
  if (!snapshot) throw new Error(`Version ${snapshotVersion} not found`)

  const existing = await db.diagrams.get(diagramId)
  if (!existing) throw new Error(`Diagram not found: ${diagramId}`)

  const mermaidChanged = snapshot.mermaidCode !== existing.mermaidCode
  const noteChanged = (snapshot.noteMd ?? '') !== (existing.noteMd ?? '')
  const titleChanged = snapshot.title !== existing.title

  const nextMermaidRevision = mermaidChanged
    ? existing.mermaidRevision + 1
    : existing.mermaidRevision
  const nextNoteRevision = noteChanged ? existing.noteRevision + 1 : existing.noteRevision
  const nextSnapshotVersion = existing.snapshotVersion + 1

  const restored = await updateDiagram(diagramId, {
    title: snapshot.title,
    mermaidCode: snapshot.mermaidCode,
    noteMd: snapshot.noteMd ?? null,
    mermaidRevision: nextMermaidRevision,
    noteRevision: nextNoteRevision,
    snapshotVersion: nextSnapshotVersion,
  })

  const changedFields: VersionField[] = []
  if (mermaidChanged) changedFields.push('mermaidCode')
  if (noteChanged) changedFields.push('noteMd')
  if (titleChanged) changedFields.push('title')
  if (changedFields.length === 0) changedFields.push('mermaidCode', 'noteMd', 'title')

  await createVersionSnapshot(restored, changedFields)
  return restored
}
