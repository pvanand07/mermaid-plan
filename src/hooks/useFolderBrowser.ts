import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useSearchParams } from 'react-router-dom'
import type { DiagramRecord } from '../data/types'
import { listDiagrams } from '../lib/db/diagramRepository'
import { createFolder, listAllFolderPaths } from '../lib/db/folderRepository'
import {
  countDiagramsInSubtree,
  getBreadcrumbSegments,
  getChildFolderPaths,
  getFolderName,
  normalizeFolderPath,
} from '../lib/folders/pathUtils'
import { useDbReady } from './useDbReady'

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
  const { dbError } = useDbReady()

  const diagrams = useLiveQuery(
    () => (!dbError ? listDiagrams() : []),
    [dbError],
    [],
  )

  const folderPaths = useLiveQuery(
    () => (!dbError ? listAllFolderPaths() : []),
    [dbError],
    [],
  )

  const diagramList = useMemo(() => diagrams ?? [], [diagrams])
  const folderPathList = useMemo(() => folderPaths ?? [], [folderPaths])
  const currentPath = normalizeFolderPath(searchParams.get('path') ?? '')

  const childFolders = useMemo(() => {
    return getChildFolderPaths(currentPath, folderPathList).map((path) => ({
      path,
      name: getFolderName(path),
      count: countDiagramsInSubtree(
        path,
        diagramList.map((d) => d.folderPath),
      ),
      ...colorForPath(path),
    }))
  }, [currentPath, folderPathList, diagramList])

  const diagramsInFolder = useMemo(() => {
    return diagramList.filter((d) => normalizeFolderPath(d.folderPath) === currentPath)
  }, [diagramList, currentPath])

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
    return [...diagramList].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 12)
  }, [currentPath, diagramList, diagramsInFolder])

  return {
    currentPath,
    childFolders,
    diagramsInFolder,
    recentDiagrams,
    breadcrumbs,
    navigateToFolder,
    handleCreateFolder,
    allDiagrams: diagramList,
    dbError,
  }
}
