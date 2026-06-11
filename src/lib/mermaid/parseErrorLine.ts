/** Extract 1-based line numbers from Mermaid parse/render error messages. */
export function parseMermaidErrorLines(error: string): number[] {
  const lines = new Set<number>()

  const patterns = [
    /\bon line (\d+)\b/gi,
    /\bat line (\d+)\b/gi,
    /\bline (\d+)\b/gi,
  ]

  for (const pattern of patterns) {
    for (const match of error.matchAll(pattern)) {
      const line = Number.parseInt(match[1] ?? '', 10)
      if (line > 0) lines.add(line)
    }
  }

  return [...lines].sort((a, b) => a - b)
}
