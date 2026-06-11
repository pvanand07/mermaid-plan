import type { RefObject } from 'react'
import { formatValidationMessage } from '../mermaid/validateDiagram'
import type { MermaidValidationResult } from '../mermaid/validateDiagram'
import type { AgentToolCall, AgentToolResult, MermaidToolResult, NoteToolResult } from './types'
import type { ToolStatus } from './chatTypes'

export interface ToolContext {
  diagramCodeRef: RefObject<string>
  noteMdRef: RefObject<string>
  onDiagramUpdate: (code: string) => void
  onNoteUpdate: (noteMd: string) => void
  onAgentDiagramSave?: (code: string, commitMessage?: string) => Promise<void>
  onAgentNoteSave?: (noteMd: string, commitMessage?: string) => Promise<void>
  validateDiagramCode?: (code: string) => Promise<MermaidValidationResult>
}

export interface ToolHandlerResult {
  toolResult: AgentToolResult
  toolStatus: ToolStatus
}

export function formatToolStatusMessage(
  toolName: 'update_mermaid' | 'update_note' | undefined,
  result: AgentToolResult,
): string {
  if (toolName === 'update_note') {
    const noteResult = result as NoteToolResult
    return noteResult.ok ? 'Note updated' : `Note update failed: ${noteResult.error ?? 'Unknown error'}`
  }
  return formatValidationMessage(result as MermaidToolResult)
}

async function handleUpdateMermaid(
  toolCall: Extract<AgentToolCall, { name: 'update_mermaid' }>,
  ctx: ToolContext,
): Promise<ToolHandlerResult> {
  const { code, commitMessage } = toolCall.arguments
  ctx.onDiagramUpdate(code)
  ctx.diagramCodeRef.current = code

  const validation = ctx.validateDiagramCode
    ? await ctx.validateDiagramCode(code)
    : { ok: true as const, diagramType: 'diagram' }

  if (validation.ok && ctx.onAgentDiagramSave) {
    await ctx.onAgentDiagramSave(code, commitMessage)
  }

  return {
    toolResult: validation,
    toolStatus: {
      toolName: 'update_mermaid',
      commitMessage,
      result: validation,
    },
  }
}

async function handleUpdateNote(
  toolCall: Extract<AgentToolCall, { name: 'update_note' }>,
  ctx: ToolContext,
): Promise<ToolHandlerResult> {
  const { noteMd: nextNote, commitMessage } = toolCall.arguments
  ctx.onNoteUpdate(nextNote)
  ctx.noteMdRef.current = nextNote

  let result: NoteToolResult = { ok: true }
  try {
    if (ctx.onAgentNoteSave) {
      await ctx.onAgentNoteSave(nextNote, commitMessage)
    }
  } catch {
    result = { ok: false, error: 'Failed to save note' }
  }

  return {
    toolResult: result,
    toolStatus: {
      toolName: 'update_note',
      commitMessage,
      result,
    },
  }
}

export async function runAgentTool(
  toolCall: AgentToolCall,
  ctx: ToolContext,
): Promise<ToolHandlerResult> {
  if (toolCall.name === 'update_mermaid') {
    return handleUpdateMermaid(toolCall, ctx)
  }
  return handleUpdateNote(toolCall, ctx)
}
