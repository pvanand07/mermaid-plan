import { tool } from '@openrouter/agent/tool'
import { z } from 'zod'

export const updateNoteInputSchema = z.object({
  noteMd: z.string().describe('Complete markdown note for viewers — reading material to help them understand the diagram'),
  commitMessage: z
    .string()
    .optional()
    .describe('Brief commit message describing the note change'),
})

export const updateNoteOutputSchema = z.object({
  ok: z.boolean(),
  error: z.string().optional(),
})

export type UpdateNoteInput = z.infer<typeof updateNoteInputSchema>
export type UpdateNoteOutput = z.infer<typeof updateNoteOutputSchema>

export const updateNoteTool = tool({
  name: 'update_note',
  description:
    'Replace the diagram note shown in the Note tab. Write viewer-facing reading material that helps people understand the diagram: purpose, flows, labels, and how to interpret it.',
  inputSchema: updateNoteInputSchema,
  outputSchema: updateNoteOutputSchema,
  execute: false,
})
