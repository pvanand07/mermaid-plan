import {
  createUnsentResult,
  fromChatMessages,
  stepCountIs,
  type Item,
  type StateAccessor,
} from '@openrouter/agent'
import { unsentResultsToAPIFormat } from '@openrouter/agent/conversation-state'
import { config } from '../config.js'
import type { AgentChatRequest, AgentContinueRequest } from '../types.js'
import { getOpenRouterClient } from './client.js'
import { buildInstructions } from './prompts.js'
import { MERMAID_AGENT_TOOLS } from './tools/index.js'

const MAX_AGENT_STEPS = 8

interface AgentRunOptions {
  state?: StateAccessor<typeof MERMAID_AGENT_TOOLS>
}

export function createAgentRun(request: AgentChatRequest, options: AgentRunOptions = {}) {
  const client = getOpenRouterClient()
  const model = request.model ?? config.defaultModel

  const result = client.callModel({
    model,
    instructions: buildInstructions(request.diagramCode),
    input: fromChatMessages(request.messages) as Item[],
    tools: MERMAID_AGENT_TOOLS,
    stopWhen: stepCountIs(MAX_AGENT_STEPS),
    ...(options.state ? { state: options.state } : {}),
  })

  return { result, model }
}

export function createAgentContinueRun(request: AgentContinueRequest, options: AgentRunOptions) {
  const client = getOpenRouterClient()
  const model = request.model ?? config.defaultModel

  const unsent = createUnsentResult(request.toolCallId, 'update_mermaid', request.toolResult)
  const toolOutputs = unsentResultsToAPIFormat([unsent])

  const result = client.callModel({
    model,
    instructions: buildInstructions(request.diagramCode),
    input: toolOutputs as Item[],
    tools: MERMAID_AGENT_TOOLS,
    stopWhen: stepCountIs(MAX_AGENT_STEPS),
    state: options.state,
  })

  return { result, model }
}
