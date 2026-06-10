import { createInitialState, generateConversationId } from '@openrouter/agent'
import type { ConversationState, StateAccessor } from '@openrouter/agent'
import type { MERMAID_AGENT_TOOLS } from './tools/index.js'

type MermaidConversationState = ConversationState<typeof MERMAID_AGENT_TOOLS>

interface AgentSession {
  accessor: StateAccessor<typeof MERMAID_AGENT_TOOLS>
  createdAt: number
}

const SESSION_TTL_MS = 60 * 60 * 1000
const sessions = new Map<string, AgentSession>()

function pruneExpiredSessions() {
  const now = Date.now()
  for (const [sessionId, session] of sessions) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      sessions.delete(sessionId)
    }
  }
}

export function createAgentSession(): {
  sessionId: string
  accessor: StateAccessor<typeof MERMAID_AGENT_TOOLS>
} {
  pruneExpiredSessions()

  const sessionId = generateConversationId()
  let state: MermaidConversationState | null = createInitialState(sessionId)

  const accessor: StateAccessor<typeof MERMAID_AGENT_TOOLS> = {
    load: async () => state,
    save: async (nextState) => {
      state = nextState
    },
  }

  sessions.set(sessionId, { accessor, createdAt: Date.now() })
  return { sessionId, accessor }
}

export function getAgentSessionAccessor(
  sessionId: string,
): StateAccessor<typeof MERMAID_AGENT_TOOLS> | undefined {
  return sessions.get(sessionId)?.accessor
}
