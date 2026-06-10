import mermaid from 'mermaid'
import { detectDiagramType } from '../diagram/detectDiagramType'
import { cleanupMermaidRenderElement, cleanupMermaidValidationArtifacts } from './cleanup'

export type MermaidValidationResult =
  | { ok: true; diagramType: string }
  | { ok: false; phase: 'parse' | 'render'; error: string }

export async function validateMermaidDiagram(code: string): Promise<MermaidValidationResult> {
  try {
    await mermaid.parse(code)
  } catch (error) {
    return {
      ok: false,
      phase: 'parse',
      error: error instanceof Error ? error.message : 'Invalid syntax',
    }
  }

  const id = `validate-${Date.now()}`
  try {
    await mermaid.render(id, code)
    return { ok: true, diagramType: detectDiagramType(code) }
  } catch (error) {
    return {
      ok: false,
      phase: 'render',
      error: error instanceof Error ? error.message : 'Render failed',
    }
  } finally {
    cleanupMermaidRenderElement(id)
    cleanupMermaidValidationArtifacts()
  }
}

export function formatValidationMessage(
  result: MermaidValidationResult | { ok: boolean; error?: string; phase?: 'parse' | 'render'; diagramType?: string },
): string {
  if (result.ok) {
    const diagramType = 'diagramType' in result && result.diagramType ? result.diagramType : 'diagram'
    return `Diagram rendered successfully (${diagramType})`
  }

  const phaseLabel = result.phase === 'parse' ? 'Syntax error' : 'Render error'
  return `${phaseLabel}: ${result.error ?? 'Validation failed'}`
}
