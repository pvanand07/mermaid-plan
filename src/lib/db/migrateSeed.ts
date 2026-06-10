import { diagrams as seedDiagrams, folders as seedFolders } from '../../data/diagrams'
import type { DiagramRecord, DiagramVersionRecord } from '../../data/types'
import { detectDiagramType } from '../diagram/detectDiagramType'
import { normalizeFolderPath } from '../folders/pathUtils'
import { db } from './mermaidStudioDb'

function seedTimestamp(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
}

export async function migrateSeedIfEmpty(): Promise<void> {
  const now = new Date().toISOString()
  const folderPaths = new Set<string>()

  for (const folder of seedFolders) {
    folderPaths.add(normalizeFolderPath(folder.name))
  }

  const records: DiagramRecord[] = seedDiagrams.map((seed, index) => {
    const folderPath = seed.folder ? normalizeFolderPath(seed.folder) : ''
    if (folderPath) folderPaths.add(folderPath)

    const noteMd = undefined
    return {
      id: seed.id,
      title: seed.title,
      mermaidCode: seed.mermaidCode,
      noteMd,
      folderPath,
      type: seed.type || detectDiagramType(seed.mermaidCode),
      starred: seed.starred,
      createdAt: seedTimestamp(index + 1),
      updatedAt: seedTimestamp(Math.max(0, index - 1)),
      mermaidRevision: 1,
      noteRevision: 0,
      snapshotVersion: 1,
    }
  })

  const versions: DiagramVersionRecord[] = records.map((record) => ({
    id: crypto.randomUUID(),
    diagramId: record.id,
    snapshotVersion: 1,
    mermaidRevision: 1,
    noteRevision: 0,
    mermaidCode: record.mermaidCode,
    noteMd: record.noteMd,
    title: record.title,
    changedFields: ['mermaidCode'],
    createdAt: record.createdAt,
  }))

  await db.transaction('rw', db.diagrams, db.folders, db.diagramVersions, async () => {
    // Re-check inside the transaction — avoids duplicate seed when init runs
    // concurrently (e.g. React Strict Mode double-mounting useEffect).
    const count = await db.diagrams.count()
    if (count > 0) return

    await db.diagrams.bulkAdd(records)
    await db.folders.bulkPut(
      [...folderPaths].map((path) => ({ path, createdAt: now })),
    )
    await db.diagramVersions.bulkAdd(versions)
  })
}

let initPromise: Promise<void> | null = null

export async function initDatabase(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      await db.open()
      await migrateSeedIfEmpty()
    })()
  }
  return initPromise
}
