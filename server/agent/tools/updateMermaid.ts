import { tool } from '@openrouter/agent/tool'
import { z } from 'zod'

export const updateMermaidInputSchema = z.object({
  code: z.string().describe('Complete Mermaid diagram source (no ```mermaid fences)'),
  summary: z.string().optional().describe('Brief note of what changed'),
})

export const updateMermaidOutputSchema = z.object({
  ok: z.boolean(),
  error: z.string().optional(),
  phase: z.enum(['parse', 'render']).optional(),
  diagramType: z.string().optional(),
})

export type UpdateMermaidInput = z.infer<typeof updateMermaidInputSchema>
export type UpdateMermaidOutput = z.infer<typeof updateMermaidOutputSchema>

export const updateMermaidTool = tool({
  name: 'update_mermaid',
  description:
    'Replace the full Mermaid diagram source in the editor. Use when creating, editing, or fixing diagram code.',
  inputSchema: updateMermaidInputSchema,
  outputSchema: updateMermaidOutputSchema,
  execute: false,
})
