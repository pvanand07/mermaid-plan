import type { ConversationRecord, StoredChatMessage } from '../../data/types'
import { db } from './mermaidStudioDb'

export async function getConversation(
  diagramId: string,
): Promise<ConversationRecord | undefined> {
  return db.conversations.get(diagramId)
}

export async function saveConversation(
  diagramId: string,
  messages: StoredChatMessage[],
): Promise<ConversationRecord> {
  const record: ConversationRecord = {
    diagramId,
    messages,
    updatedAt: new Date().toISOString(),
  }
  await db.conversations.put(record)
  return record
}

export async function clearConversation(diagramId: string): Promise<void> {
  await db.conversations.delete(diagramId)
}
