import Dexie, { type Table } from 'dexie'
import { diagrams as seedDiagrams, folders as seedFolders } from '../../data/diagrams'
import type {
  ConversationRecord,
  DiagramRecord,
  DiagramVersionRecord,
  FolderRecord,
} from '../../data/types'
import { detectDiagramType } from '../diagram/detectDiagramType'
import { normalizeFolderPath } from '../folders/pathUtils'
import { storageConfig } from '../../config/storage'

function seedTimestamp(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
}

export class MermaidStudioDB extends Dexie {
  diagrams!: Table<DiagramRecord, string>
  folders!: Table<FolderRecord, string>
  diagramVersions!: Table<DiagramVersionRecord, string>
  conversations!: Table<ConversationRecord, string>

  constructor() {
    super(storageConfig.dbName)
    this.version(1).stores({
      diagrams: 'id, folderPath, updatedAt, starred, title',
      folders: 'path, createdAt',
      diagramVersions: 'id, diagramId, createdAt',
    })

    this.version(2).stores({
      diagrams: 'id, folderPath, updatedAt, starred, title',
      folders: 'path, createdAt',
      diagramVersions: 'id, diagramId, createdAt',
      conversations: 'diagramId, updatedAt',
    })

    this.on('populate', async () => {
      const now = new Date().toISOString()
      const folderPaths = new Set<string>()

      for (const folder of seedFolders) {
        folderPaths.add(normalizeFolderPath(folder.name))
      }

      const records: DiagramRecord[] = seedDiagrams.map((seed, index) => {
        const folderPath = seed.folder ? normalizeFolderPath(seed.folder) : ''
        if (folderPath) folderPaths.add(folderPath)

        return {
          id: seed.id,
          title: seed.title,
          mermaidCode: seed.mermaidCode,
          noteMd: undefined,
          folderPath,
          type: seed.type || detectDiagramType(seed.mermaidCode),
          starred: seed.starred,
          createdAt: seedTimestamp(index + 1),
          updatedAt: seedTimestamp(Math.max(0, index - 1)),
        }
      })

      const versions: DiagramVersionRecord[] = records.map((record) => ({
        id: crypto.randomUUID(),
        diagramId: record.id,
        mermaidCode: record.mermaidCode,
        noteMd: record.noteMd,
        title: record.title,
        createdAt: record.createdAt,
      }))

      await this.diagrams.bulkAdd(records)
      await this.folders.bulkPut(
        [...folderPaths].map((path) => ({ path, createdAt: now })),
      )
      await this.diagramVersions.bulkAdd(versions)
    })
  }
}

export const db = new MermaidStudioDB()
