import Dexie, { type Table, type Transaction } from 'dexie'
import type {
  ConversationRecord,
  DiagramRecord,
  DiagramVersionRecord,
  FolderRecord,
} from '../../data/types'
import { storageConfig } from '../../config/storage'

const SEED_DIAGRAM_IDS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const
const storeSchema = {
  diagrams: 'id, folderPath, updatedAt, starred, title',
  folders: 'path, createdAt',
  diagramVersions: 'id, diagramId, createdAt',
  conversations: 'diagramId, updatedAt',
} as const

async function purgeSeedData(tx: Transaction): Promise<void> {
  const diagrams = tx.table<DiagramRecord, string>('diagrams')
  const versions = tx.table<DiagramVersionRecord, string>('diagramVersions')
  const conversations = tx.table<ConversationRecord, string>('conversations')

  for (const id of SEED_DIAGRAM_IDS) {
    await diagrams.delete(id)
    await versions.where('diagramId').equals(id).delete()
    await conversations.where('diagramId').equals(id).delete()
  }
}

export class MermaidStudioDB extends Dexie {
  diagrams!: Table<DiagramRecord, string>
  folders!: Table<FolderRecord, string>
  diagramVersions!: Table<DiagramVersionRecord, string>
  conversations!: Table<ConversationRecord, string>

  constructor() {
    super(storageConfig.dbName)
    this.version(1).stores({
      diagrams: storeSchema.diagrams,
      folders: storeSchema.folders,
      diagramVersions: storeSchema.diagramVersions,
    })

    this.version(2).stores(storeSchema)

    this.version(3).stores(storeSchema).upgrade(purgeSeedData)
  }
}

export const db = new MermaidStudioDB()
