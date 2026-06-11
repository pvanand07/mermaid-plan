import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { storageConfig } from '../config/storage'
import type { DiagramRecord, Template } from '../data/types'
import { updateDiagram } from '../lib/db/diagramRepository'
import { createVersionSnapshot, listVersions, restoreVersion } from '../lib/db/versionRepository'
import { noteExcerpt } from '../lib/formatEditedAgo'
import { useAutosave } from './useAutosave'

export type { SaveStatus } from './useAutosave'

interface EditorSnapshot {
  title: string
  code: string
  noteMd: string
  folderPath: string
}

interface UseDiagramEditorOptions {
  id: string
  initial: DiagramRecord
}

function snapshotsEqual(a: EditorSnapshot, b: EditorSnapshot) {
  return (
    a.title === b.title &&
    a.code === b.code &&
    a.noteMd === b.noteMd &&
    a.folderPath === b.folderPath
  )
}

export function useDiagramEditor({ id, initial }: UseDiagramEditorOptions) {
  const [title, setTitle] = useState(initial.title)
  const [code, setCode] = useState(initial.mermaidCode)
  const [noteMd, setNoteMd] = useState(initial.noteMd ?? '')
  const [folderPath, setFolderPath] = useState(initial.folderPath)

  const lastSnapshotAtRef = useRef<number | null>(null)
  const lastContentRef = useRef({
    title: initial.title,
    code: initial.mermaidCode,
    noteMd: initial.noteMd ?? '',
  })
  const versions = useLiveQuery(() => listVersions(id), [id], [])

  const snapshot = useMemo(
    (): EditorSnapshot => ({ title, code, noteMd, folderPath }),
    [title, code, noteMd, folderPath],
  )

  const persistSnapshot = useCallback(async () => {
    const contentChanged =
      snapshot.title !== lastContentRef.current.title ||
      snapshot.code !== lastContentRef.current.code ||
      snapshot.noteMd !== lastContentRef.current.noteMd

    const record = await updateDiagram(id, {
      title: snapshot.title,
      mermaidCode: snapshot.code,
      noteMd: snapshot.noteMd || null,
      folderPath: snapshot.folderPath,
    })

    const now = Date.now()
    const shouldSnapshot =
      storageConfig.versioning.enabled &&
      contentChanged &&
      (lastSnapshotAtRef.current === null ||
        now - lastSnapshotAtRef.current >= storageConfig.versioning.throttleMs)

    if (shouldSnapshot) {
      lastSnapshotAtRef.current = now
      await createVersionSnapshot(record)
    }

    lastContentRef.current = {
      title: snapshot.title,
      code: snapshot.code,
      noteMd: snapshot.noteMd,
    }
  }, [id, snapshot])

  const { saveStatus, setSaveStatus, markSaved, isSavingRef } = useAutosave(
    snapshot,
    snapshotsEqual,
    persistSnapshot,
    storageConfig.autosaveDebounceMs,
  )

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus === 'dirty' || saveStatus === 'saving') {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [saveStatus])

  const handleRestoreVersion = useCallback(
    async (versionId: string) => {
      const restored = await restoreVersion(id, versionId)
      setTitle(restored.title)
      setCode(restored.mermaidCode)
      setNoteMd(restored.noteMd ?? '')
      setFolderPath(restored.folderPath)
      markSaved({
        title: restored.title,
        code: restored.mermaidCode,
        noteMd: restored.noteMd ?? '',
        folderPath: restored.folderPath,
      })
    },
    [id, markSaved],
  )

  const applyAgentDiagramUpdate = useCallback(
    async (nextCode: string, commitMessage?: string) => {
      setCode(nextCode)

      if (isSavingRef.current) return

      isSavingRef.current = true
      setSaveStatus('saving')

      try {
        const record = await updateDiagram(id, {
          mermaidCode: nextCode,
        })

        if (storageConfig.versioning.enabled) {
          lastSnapshotAtRef.current = Date.now()
          await createVersionSnapshot(record, commitMessage)
        }

        markSaved({ ...snapshot, code: nextCode })
      } catch {
        setSaveStatus('error')
      } finally {
        isSavingRef.current = false
      }
    },
    [id, markSaved, setSaveStatus, snapshot, isSavingRef],
  )

  const applyAgentNoteUpdate = useCallback(
    async (nextNoteMd: string, commitMessage?: string) => {
      setNoteMd(nextNoteMd)

      if (isSavingRef.current) return

      isSavingRef.current = true
      setSaveStatus('saving')

      try {
        const record = await updateDiagram(id, {
          noteMd: nextNoteMd || null,
        })

        if (storageConfig.versioning.enabled) {
          lastSnapshotAtRef.current = Date.now()
          await createVersionSnapshot(record, commitMessage)
        }

        markSaved({ ...snapshot, noteMd: nextNoteMd })
      } catch {
        setSaveStatus('error')
      } finally {
        isSavingRef.current = false
      }
    },
    [id, markSaved, setSaveStatus, snapshot, isSavingRef],
  )

  const applyTemplate = useCallback(
    (template: Template) => {
      setCode(template.mermaidCode)
      const isDefaultTitle = title === 'Untitled' || title === 'FlowChart'
      if (isDefaultTitle) setTitle(template.name)
      if (!noteMd.trim()) setNoteMd(template.description)
    },
    [noteMd, title],
  )

  const subtitle = noteExcerpt(noteMd) ?? undefined

  return {
    diagramId: id,
    title,
    setTitle,
    code,
    setCode,
    noteMd,
    setNoteMd,
    folderPath,
    setFolderPath,
    saveStatus,
    versions: versions ?? [],
    subtitle,
    restoreVersion: handleRestoreVersion,
    applyAgentDiagramUpdate,
    applyAgentNoteUpdate,
    applyTemplate,
  }
}
