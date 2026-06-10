import type { FolderRecord } from '../../data/types'
import {
  getParentPath,
  isDescendantPath,
  joinFolderPath,
  normalizeFolderPath,
} from '../folders/pathUtils'
import { db } from './mermaidStudioDb'

export async function listFolderStubs(): Promise<FolderRecord[]> {
  return db.folders.orderBy('path').toArray()
}

export async function listAllFolderPaths(): Promise<string[]> {
  const [stubs, diagrams] = await Promise.all([
    db.folders.toArray(),
    db.diagrams.toArray(),
  ])
  const paths = new Set<string>()
  for (const stub of stubs) paths.add(normalizeFolderPath(stub.path))
  for (const diagram of diagrams) {
    const path = normalizeFolderPath(diagram.folderPath)
    if (path) paths.add(path)
    let parent = getParentPath(path)
    while (parent) {
      paths.add(parent)
      parent = getParentPath(parent)
    }
  }
  return [...paths].sort()
}

export async function createFolder(path: string): Promise<FolderRecord> {
  const normalized = normalizeFolderPath(path)
  if (!normalized) throw new Error('Folder path cannot be empty')

  const existing = await db.folders.get(normalized)
  if (existing) return existing

  const record: FolderRecord = {
    path: normalized,
    createdAt: new Date().toISOString(),
  }
  await db.folders.add(record)
  return record
}

export async function renameFolder(oldPath: string, newPath: string): Promise<void> {
  const oldNorm = normalizeFolderPath(oldPath)
  const newNorm = normalizeFolderPath(newPath)
  if (!oldNorm || !newNorm) throw new Error('Invalid folder path')
  if (oldNorm === newNorm) return

  await db.transaction('rw', db.folders, db.diagrams, async () => {
    const stub = await db.folders.get(oldNorm)
    if (stub) {
      await db.folders.delete(oldNorm)
      await db.folders.put({ ...stub, path: newNorm })
    } else {
      await db.folders.put({ path: newNorm, createdAt: new Date().toISOString() })
    }

    const diagrams = await db.diagrams.toArray()
    for (const diagram of diagrams) {
      const fp = normalizeFolderPath(diagram.folderPath)
      if (fp === oldNorm) {
        await db.diagrams.update(diagram.id, { folderPath: newNorm })
      } else if (isDescendantPath(fp, oldNorm)) {
        const suffix = fp.slice(oldNorm.length)
        await db.diagrams.update(diagram.id, {
          folderPath: `${newNorm}${suffix}`,
        })
      }
    }

    const childStubs = await db.folders.toArray()
    for (const child of childStubs) {
      const cp = normalizeFolderPath(child.path)
      if (cp === oldNorm) continue
      if (isDescendantPath(cp, oldNorm)) {
        const suffix = cp.slice(oldNorm.length)
        await db.folders.delete(cp)
        await db.folders.put({
          path: `${newNorm}${suffix}`,
          createdAt: child.createdAt,
        })
      }
    }
  })
}

export async function deleteFolder(path: string): Promise<void> {
  const normalized = normalizeFolderPath(path)
  if (!normalized) throw new Error('Cannot delete root')

  const diagrams = await db.diagrams.toArray()
  const hasContent = diagrams.some(
    (d) =>
      normalizeFolderPath(d.folderPath) === normalized ||
      isDescendantPath(normalizeFolderPath(d.folderPath), normalized),
  )
  if (hasContent) {
    throw new Error('Folder is not empty. Move or delete diagrams first.')
  }

  await db.folders.delete(normalized)

  const childStubs = await db.folders.toArray()
  for (const stub of childStubs) {
    if (isDescendantPath(normalizeFolderPath(stub.path), normalized)) {
      await db.folders.delete(stub.path)
    }
  }
}

export function buildFolderPath(parentPath: string, name: string): string {
  return joinFolderPath(parentPath, name)
}
