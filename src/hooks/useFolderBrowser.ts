import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { DiagramRecord } from '../data/types'
import { useDiagramStore } from '../context/DiagramStoreContext'
import {
  countDiagramsInSubtree,
  getBreadcrumbSegments,
  getChildFolderPaths,
  getFolderName,
  normalizeFolderPath,
} from '../lib/folders/pathUtils'

const FOLDER_COLORS = [
  { color: 'tint-violet-bg', iconColor: 'tint-violet-text' },
  { color: 'tint-blue-bg', iconColor: 'tint-blue-text' },
  { color: 'tint-emerald-bg', iconColor: 'tint-emerald-text' },
  { color: 'tint-orange-bg', iconColor: 'tint-orange-text' },
] as const

function colorForPath(path: string) {
  let hash = 0
  for (let i = 0; i < path.length; i++) hash = (hash + path.charCodeAt(i)) % 997
  return FOLDER_COLORS[hash % FOLDER_COLORS.length]
}

export function useFolderBrowser() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { diagrams, folderPaths, createFolder } = useDiagramStore()

  const currentPath = normalizeFolderPath(searchParams.get('path') ?? '')

  const childFolders = useMemo(() => {
    return getChildFolderPaths(currentPath, folderPaths).map((path) => ({
      path,
      name: getFolderName(path),
      count: countDiagramsInSubtree(
        path,
        diagrams.map((d) => d.folderPath),
      ),
      ...colorForPath(path),
    }))
  }, [currentPath, folderPaths, diagrams])

  const diagramsInFolder = useMemo(() => {
    return diagrams.filter((d) => normalizeFolderPath(d.folderPath) === currentPath)
  }, [diagrams, currentPath])

  const breadcrumbs = useMemo(() => getBreadcrumbSegments(currentPath), [currentPath])

  const navigateToFolder = (path: string) => {
    const normalized = normalizeFolderPath(path)
    if (!normalized) {
      setSearchParams({})
    } else {
      setSearchParams({ path: normalized })
    }
  }

  const handleCreateFolder = async () => {
    const name = window.prompt('Folder name')
    if (!name?.trim()) return
    const newPath = currentPath ? `${currentPath}/${name.trim()}` : name.trim()
    await createFolder(newPath)
  }

  const recentDiagrams = useMemo((): DiagramRecord[] => {
    if (currentPath) return diagramsInFolder
    return [...diagrams].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 12)
  }, [currentPath, diagrams, diagramsInFolder])

  return {
    currentPath,
    childFolders,
    diagramsInFolder,
    recentDiagrams,
    breadcrumbs,
    navigateToFolder,
    handleCreateFolder,
    allDiagrams: diagrams,
  }
}
