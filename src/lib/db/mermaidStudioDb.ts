import Dexie, { type Table } from 'dexie'
import type { DiagramRecord, DiagramVersionRecord, FolderRecord } from '../../data/types'
import { storageConfig } from '../../config/storage'

export class MermaidStudioDB extends Dexie {
  diagrams!: Table<DiagramRecord, string>
  folders!: Table<FolderRecord, string>
  diagramVersions!: Table<DiagramVersionRecord, string>

  constructor() {
    super(storageConfig.dbName)
    this.version(1).stores({
      diagrams: 'id, folderPath, updatedAt, starred, title',
      folders: 'path, createdAt',
    })
    this.version(2)
      .stores({
        diagrams: 'id, folderPath, updatedAt, starred, title',
        folders: 'path, createdAt',
        diagramVersions: 'id, diagramId, snapshotVersion, createdAt, [diagramId+snapshotVersion]',
      })
      .upgrade(async (tx) => {
        await tx.table('diagrams').toCollection().modify((d: DiagramRecord) => {
          d.mermaidRevision ??= 1
          d.noteRevision ??= d.noteMd ? 1 : 0
          d.snapshotVersion ??= 1
        })
      })
  }
}

export const db = new MermaidStudioDB()
