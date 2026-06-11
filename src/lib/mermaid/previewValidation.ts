import type { MutableRefObject } from 'react'
import type { MermaidValidationResult } from './validateDiagram'
import { parseMermaidSyntax } from './validateDiagram'

export interface PreviewValidationCache {
  code: string
  result: MermaidValidationResult
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function resolveDiagramValidation(
  code: string,
  previewCode: string,
  cacheRef: MutableRefObject<PreviewValidationCache | null>,
  waitMs = 600,
): Promise<MermaidValidationResult> {
  const cached = cacheRef.current
  if (cached?.code === code && previewCode === code) {
    return cached.result
  }

  const deadline = Date.now() + waitMs
  while (Date.now() < deadline) {
    const next = cacheRef.current
    if (next?.code === code) return next.result
    await sleep(50)
  }

  return parseMermaidSyntax(code)
}
