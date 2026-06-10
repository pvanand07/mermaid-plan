import { fromChatMessages, type Item } from '@openrouter/agent'
import { config } from '../config.js'
import type { AgentChatRequest } from '../types.js'
import { getOpenRouterClient } from './client.js'
import { buildInstructions } from './prompts.js'

export function createAgentRun(request: AgentChatRequest) {
  const client = getOpenRouterClient()
  const model = request.model ?? config.defaultModel

  const result = client.callModel({
    model,
    instructions: buildInstructions(request.diagramCode),
    input: fromChatMessages(request.messages) as Item[],
  })

  return { result, model }
}
