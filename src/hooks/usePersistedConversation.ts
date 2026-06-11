import { useEffect, useRef } from 'react'
import type { StoredChatMessage } from '../data/types'
import type { ChatMessage } from '../lib/agent/chatTypes'
import { WELCOME_MESSAGE } from '../lib/agent/chatTypes'
import {
  clearConversation,
  getConversation,
  saveConversation,
} from '../lib/db/conversationRepository'
import { useDebouncedEffect } from './useDebouncedEffect'

function toStoredMessages(messages: ChatMessage[]): StoredChatMessage[] {
  return messages
    .filter((message) => message.id !== 'welcome' && !message.streaming)
    .map(({ id, role, content, error, toolStatus }) => ({
      id,
      role,
      content,
      error,
      toolStatus,
    }))
}

function syncMessageIdRef(messages: ChatMessage[], ref: { current: number }) {
  let max = 0
  for (const message of messages) {
    const match = message.id.match(/^(?:user|assistant)-(\d+)$/)
    if (match) max = Math.max(max, Number(match[1]))
  }
  ref.current = max
}

interface UsePersistedConversationOptions {
  diagramId: string
  messages: ChatMessage[]
  isStreaming: boolean
  onHydrate: (messages: ChatMessage[], nextId: number) => void
  messageIdRef: React.MutableRefObject<number>
  debounceMs?: number
}

export function usePersistedConversation({
  diagramId,
  messages,
  isStreaming,
  onHydrate,
  messageIdRef,
  debounceMs = 500,
}: UsePersistedConversationOptions) {
  const skipSaveRef = useRef(true)
  const isHydratingRef = useRef(true)

  useEffect(() => {
    skipSaveRef.current = true
    isHydratingRef.current = true
    let cancelled = false

    void getConversation(diagramId).then((record) => {
      if (cancelled) return

      if (record?.messages.length) {
        onHydrate(record.messages, 0)
        syncMessageIdRef(record.messages, messageIdRef)
      } else {
        onHydrate([WELCOME_MESSAGE], 0)
        messageIdRef.current = 0
      }

      skipSaveRef.current = false
      isHydratingRef.current = false
    })

    return () => {
      cancelled = true
    }
  }, [diagramId, messageIdRef, onHydrate])

  useDebouncedEffect(
    () => {
      if (skipSaveRef.current || isStreaming) return

      const stored = toStoredMessages(messages)
      if (stored.length === 0) return

      void saveConversation(diagramId, stored)
    },
    [diagramId, isStreaming, messages],
    debounceMs,
  )

  const resetPersistence = async () => {
    skipSaveRef.current = true
    if (diagramId) {
      await clearConversation(diagramId)
    }
    skipSaveRef.current = false
  }

  return { resetPersistence }
}
