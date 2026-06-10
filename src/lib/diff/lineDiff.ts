export type DiffLine = { type: 'add' | 'remove'; line: string }

export interface LineChangeStats {
  added: number
  removed: number
}

function lcsMatrix(a: string[], b: string[]): number[][] {
  const m = a.length
  const n = b.length
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }

  return dp
}

export function countLineChanges(before: string, after: string): LineChangeStats {
  const a = before.split('\n')
  const b = after.split('\n')
  const common = lcsMatrix(a, b)[a.length][b.length]
  return { added: b.length - common, removed: a.length - common }
}

export function buildLineDiff(before: string, after: string): DiffLine[] {
  const a = before.split('\n')
  const b = after.split('\n')
  const dp = lcsMatrix(a, b)
  const result: DiffLine[] = []

  let i = a.length
  let j = b.length

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.push({ type: 'add', line: b[j - 1] })
      j--
    } else if (i > 0) {
      result.push({ type: 'remove', line: a[i - 1] })
      i--
    }
  }

  return result.reverse()
}

export function mergeDiffLines(...diffs: DiffLine[][]): DiffLine[] {
  return diffs.flat()
}
