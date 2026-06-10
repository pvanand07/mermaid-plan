import type { DiagramVersionRecord } from '../../data/types'
import {
  buildLineDiff,
  countLineChanges,
  mergeDiffLines,
  type DiffLine,
  type LineChangeStats,
} from './lineDiff'

export interface VersionDiffSummary {
  stats: LineChangeStats
  lines: DiffLine[]
  titleChanged: boolean
  isInitial: boolean
}

export function summarizeVersionDiff(
  version: DiagramVersionRecord,
  previous: DiagramVersionRecord | undefined,
): VersionDiffSummary {
  if (!previous) {
    const lines = buildLineDiff('', version.mermaidCode)
    const noteLines = version.noteMd?.trim()
      ? buildLineDiff('', version.noteMd)
      : []
    return {
      stats: {
        added: lines.length + noteLines.length,
        removed: 0,
      },
      lines: mergeDiffLines(lines, noteLines),
      titleChanged: false,
      isInitial: true,
    }
  }

  const codeDiff = buildLineDiff(previous.mermaidCode, version.mermaidCode)
  const noteDiff = buildLineDiff(previous.noteMd ?? '', version.noteMd ?? '')
  const codeStats = countLineChanges(previous.mermaidCode, version.mermaidCode)
  const noteStats = countLineChanges(previous.noteMd ?? '', version.noteMd ?? '')

  return {
    stats: {
      added: codeStats.added + noteStats.added,
      removed: codeStats.removed + noteStats.removed,
    },
    lines: mergeDiffLines(codeDiff, noteDiff),
    titleChanged: previous.title !== version.title,
    isInitial: false,
  }
}
