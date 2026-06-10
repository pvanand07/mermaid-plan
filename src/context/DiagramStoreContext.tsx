import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import type {
  CreateDiagramInput,
  DiagramRecord,
  UpdateDiagramPatch,
} from '../data/types'
import {
  createDiagram,
  deleteDiagram,
  toggleStar,
  updateDiagram,
} from '../lib/db/diagramRepository'
import {
  createFolder,
  deleteFolder,
  listAllFolderPaths,
  renameFolder,
} from '../lib/db/folderRepository'
import { initDatabase } from '../lib/db/migrateSeed'
import { db } from '../lib/db/mermaidStudioDb'

interface DiagramStoreValue {
  diagrams: DiagramRecord[]
  folderPaths: string[]
  loading: boolean
  dbError: string | null
  createDiagram: (input: CreateDiagramInput) => Promise<DiagramRecord>
  updateDiagram: (id: string, patch: UpdateDiagramPatch) => Promise<DiagramRecord>
  deleteDiagram: (id: string) => Promise<void>
  toggleStar: (id: string) => Promise<DiagramRecord>
  createFolder: (path: string) => Promise<void>
  renameFolder: (oldPath: string, newPath: string) => Promise<void>
  deleteFolder: (path: string) => Promise<void>
}

const DiagramStoreContext = createContext<DiagramStoreValue | null>(null)

export function DiagramStoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [dbError, setDbError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    initDatabase()
      .then(() => {
        if (!cancelled) setReady(true)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setDbError(err instanceof Error ? err.message : 'Database unavailable')
          setReady(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const diagrams = useLiveQuery(
    () => (ready && !dbError ? db.diagrams.orderBy('updatedAt').reverse().toArray() : []),
    [ready, dbError],
    [],
  )

  const folderPaths = useLiveQuery(
    () => (ready && !dbError ? listAllFolderPaths() : []),
    [ready, dbError],
    [],
  )

  const value = useMemo<DiagramStoreValue>(
    () => ({
      diagrams: diagrams ?? [],
      folderPaths: folderPaths ?? [],
      loading: !ready,
      dbError,
      createDiagram: async (input) => createDiagram(input),
      updateDiagram: async (id, patch) => updateDiagram(id, patch),
      deleteDiagram: async (id) => deleteDiagram(id),
      toggleStar: async (id) => toggleStar(id),
      createFolder: async (path) => {
        await createFolder(path)
      },
      renameFolder: async (oldPath, newPath) => renameFolder(oldPath, newPath),
      deleteFolder: async (path) => deleteFolder(path),
    }),
    [diagrams, folderPaths, ready, dbError],
  )

  return (
    <DiagramStoreContext.Provider value={value}>{children}</DiagramStoreContext.Provider>
  )
}

export function useDiagramStore(): DiagramStoreValue {
  const ctx = useContext(DiagramStoreContext)
  if (!ctx) throw new Error('useDiagramStore must be used within DiagramStoreProvider')
  return ctx
}

export function useDiagramStoreOptional(): DiagramStoreValue | null {
  return useContext(DiagramStoreContext)
}
