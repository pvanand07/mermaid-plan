import { OpenRouter } from '@openrouter/agent'
import { assertApiKey } from '../config.js'

let client: OpenRouter | null = null

export function getOpenRouterClient(): OpenRouter {
  if (!client) {
    client = new OpenRouter({
      apiKey: assertApiKey(),
    })
  }
  return client
}
