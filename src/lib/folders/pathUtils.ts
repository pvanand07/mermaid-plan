export function normalizeFolderPath(path: string): string {
  return path
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean)
    .join('/')
}

export function getFolderName(path: string): string {
  const normalized = normalizeFolderPath(path)
  if (!normalized) return 'Root'
  const segments = normalized.split('/')
  return segments[segments.length - 1] ?? normalized
}

export function getParentPath(path: string): string {
  const normalized = normalizeFolderPath(path)
  if (!normalized) return ''
  const segments = normalized.split('/')
  segments.pop()
  return segments.join('/')
}

export function joinFolderPath(parent: string, name: string): string {
  const parentNorm = normalizeFolderPath(parent)
  const nameNorm = normalizeFolderPath(name)
  if (!nameNorm) return parentNorm
  return parentNorm ? `${parentNorm}/${nameNorm}` : nameNorm
}

export function isDescendantPath(child: string, ancestor: string): boolean {
  const childNorm = normalizeFolderPath(child)
  const ancestorNorm = normalizeFolderPath(ancestor)
  if (!ancestorNorm) return childNorm.length > 0
  return childNorm === ancestorNorm || childNorm.startsWith(`${ancestorNorm}/`)
}

export function getChildFolderPaths(parentPath: string, allPaths: string[]): string[] {
  const parent = normalizeFolderPath(parentPath)
  const children = new Set<string>()

  for (const raw of allPaths) {
    const path = normalizeFolderPath(raw)
    if (!path) continue

    if (!parent) {
      const first = path.split('/')[0]
      if (first) children.add(first)
      continue
    }

    if (!path.startsWith(`${parent}/`)) continue
    const rest = path.slice(parent.length + 1)
    const next = rest.split('/')[0]
    if (next) children.add(joinFolderPath(parent, next))
  }

  return [...children].sort((a, b) => getFolderName(a).localeCompare(getFolderName(b)))
}

export function getBreadcrumbSegments(path: string): { label: string; path: string }[] {
  const normalized = normalizeFolderPath(path)
  if (!normalized) return [{ label: 'Root', path: '' }]

  const segments: { label: string; path: string }[] = [{ label: 'Root', path: '' }]
  let current = ''
  for (const part of normalized.split('/')) {
    current = current ? `${current}/${part}` : part
    segments.push({ label: part, path: current })
  }
  return segments
}

export function countDiagramsInSubtree(
  folderPath: string,
  diagramPaths: string[],
): number {
  const target = normalizeFolderPath(folderPath)
  return diagramPaths.filter((p) => {
    const norm = normalizeFolderPath(p)
    return norm === target || isDescendantPath(norm, target)
  }).length
}
