import { createInitialState, generateConversationId } from '@openrouter/agent'
import type { ConversationState, StateAccessor } from '@openrouter/agent'
import type { MERMAID_AGENT_TOOLS } from './tools/index.js'

type MermaidConversationState = ConversationState<typeof MERMAID_AGENT_TOOLS>

export function createEphemeralAccessor(
  seedState?: MermaidConversationState,
): StateAccessor<typeof MERMAID_AGENT_TOOLS> {
  let state: MermaidConversationState | null =
    seedState ?? createInitialState(generateConversationId())

  return {
    load: async () => state,
    save: async (nextState) => {
      state = nextState
    },
  }
}
