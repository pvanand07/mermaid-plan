import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { storageConfig } from '../config/storage'
import type { DiagramRecord, VersionField } from '../data/types'
import { useDiagramStore } from '../context/DiagramStoreContext'
import { getDiagram } from '../lib/db/diagramRepository'
import { createVersionSnapshot, listVersions, restoreVersion } from '../lib/db/versionRepository'
import { noteExcerpt } from '../lib/formatEditedAgo'

export type SaveStatus = 'saved' | 'saving' | 'dirty' | 'error'

interface UseDiagramEditorOptions {
  id: string | undefined
  initialCode: string
  initialTitle: string
  initialNoteMd?: string
  initialFolderPath: string
  templateNote?: string
}

function computeChangedFields(
  prev: { title: string; code: string; noteMd?: string },
  next: { title: string; code: string; noteMd?: string },
): VersionField[] {
  const fields: VersionField[] = []
  if (prev.code !== next.code) fields.push('mermaidCode')
  if ((prev.noteMd ?? '') !== (next.noteMd ?? '')) fields.push('noteMd')
  if (prev.title !== next.title) fields.push('title')
  return fields
}

export function useDiagramEditor({
  id,
  initialCode,
  initialTitle,
  initialNoteMd,
  initialFolderPath,
  templateNote,
}: UseDiagramEditorOptions) {
  const navigate = useNavigate()
  const { createDiagram, updateDiagram, dbError } = useDiagramStore()

  const [diagramId, setDiagramId] = useState<string | undefined>(id)
  const [title, setTitle] = useState(initialTitle)
  const [code, setCode] = useState(initialCode)
  const [noteMd, setNoteMd] = useState(initialNoteMd ?? templateNote ?? '')
  const [folderPath, setFolderPath] = useState(initialFolderPath)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [mermaidRevision, setMermaidRevision] = useState(1)
  const [noteRevision, setNoteRevision] = useState(0)
  const [snapshotVersion, setSnapshotVersion] = useState(1)
  const [loaded, setLoaded] = useState(!id)

  const lastSavedRef = useRef({
    title: initialTitle,
    code: initialCode,
    noteMd: initialNoteMd ?? templateNote ?? '',
    folderPath: initialFolderPath,
  })
  const lastSnapshotAtRef = useRef<number | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSavingRef = useRef(false)

  const versions = useLiveQuery(
    () => (diagramId ? listVersions(diagramId) : []),
    [diagramId],
    [],
  )

  useEffect(() => {
    if (!id) {
      setLoaded(true)
      return
    }
    let cancelled = false
    getDiagram(id).then((record) => {
      if (cancelled) return
      if (!record) {
        setLoaded(true)
        return
      }
      setDiagramId(record.id)
      setTitle(record.title)
      setCode(record.mermaidCode)
      setNoteMd(record.noteMd ?? '')
      setFolderPath(record.folderPath)
      setMermaidRevision(record.mermaidRevision)
      setNoteRevision(record.noteRevision)
      setSnapshotVersion(record.snapshotVersion)
      lastSavedRef.current = {
        title: record.title,
        code: record.mermaidCode,
        noteMd: record.noteMd ?? '',
        folderPath: record.folderPath,
      }
      setLoaded(true)
      setSaveStatus('saved')
    })
    return () => {
      cancelled = true
    }
  }, [id])

  const persist = useCallback(async () => {
    if (isSavingRef.current) return
    const current = { title, code, noteMd }
    const changedFields = computeChangedFields(lastSavedRef.current, current)
    const folderChanged = folderPath !== lastSavedRef.current.folderPath
    if (changedFields.length === 0 && !folderChanged) {
      setSaveStatus('saved')
      return
    }

    isSavingRef.current = true
    setSaveStatus('saving')

    try {
      let record: DiagramRecord

      if (!diagramId) {
        record = await createDiagram({
          title,
          mermaidCode: code,
          noteMd: noteMd || undefined,
          folderPath,
        })
        setDiagramId(record.id)
        navigate(`/editor/${record.id}`, { replace: true })
        lastSnapshotAtRef.current = Date.now()
        lastSavedRef.current = { title, code, noteMd, folderPath }
        setMermaidRevision(record.mermaidRevision)
        setNoteRevision(record.noteRevision)
        setSnapshotVersion(record.snapshotVersion)
        if (changedFields.length > 0) {
          await createVersionSnapshot(record, changedFields)
        }
        setSaveStatus('saved')
        return
      }

      const prev = await getDiagram(diagramId)
      if (!prev) throw new Error('Diagram not found')

      let nextMermaidRevision = prev.mermaidRevision
      let nextNoteRevision = prev.noteRevision
      if (changedFields.includes('mermaidCode')) nextMermaidRevision++
      if (changedFields.includes('noteMd')) nextNoteRevision++

      let nextSnapshotVersion = prev.snapshotVersion
      const now = Date.now()
      const shouldSnapshot =
        storageConfig.versioning.enabled &&
        changedFields.some((f) => f === 'mermaidCode' || f === 'noteMd' || f === 'title') &&
        (lastSnapshotAtRef.current === null ||
          now - lastSnapshotAtRef.current >= storageConfig.versioning.throttleMs)

      if (shouldSnapshot) {
        nextSnapshotVersion = prev.snapshotVersion + 1
        lastSnapshotAtRef.current = now
      }

      record = await updateDiagram(diagramId, {
        title,
        mermaidCode: code,
        noteMd: noteMd || null,
        folderPath,
        mermaidRevision: nextMermaidRevision,
        noteRevision: nextNoteRevision,
        snapshotVersion: nextSnapshotVersion,
      })

      if (shouldSnapshot) {
        await createVersionSnapshot(record, changedFields)
      }

      setMermaidRevision(record.mermaidRevision)
      setNoteRevision(record.noteRevision)
      setSnapshotVersion(record.snapshotVersion)
      lastSavedRef.current = { title, code, noteMd, folderPath }
      setSaveStatus('saved')
    } catch {
      setSaveStatus('error')
    } finally {
      isSavingRef.current = false
    }
  }, [
    code,
    createDiagram,
    diagramId,
    folderPath,
    navigate,
    noteMd,
    title,
    updateDiagram,
  ])

  useEffect(() => {
    if (!loaded) return
    const dirty =
      title !== lastSavedRef.current.title ||
      code !== lastSavedRef.current.code ||
      noteMd !== lastSavedRef.current.noteMd ||
      folderPath !== lastSavedRef.current.folderPath
    if (dirty && saveStatus !== 'saving') setSaveStatus('dirty')

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      void persist()
    }, storageConfig.autosaveDebounceMs)

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [title, code, noteMd, folderPath, loaded, persist, saveStatus])

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
    async (version: number) => {
      if (!diagramId) return
      const restored = await restoreVersion(diagramId, version)
      setTitle(restored.title)
      setCode(restored.mermaidCode)
      setNoteMd(restored.noteMd ?? '')
      setMermaidRevision(restored.mermaidRevision)
      setNoteRevision(restored.noteRevision)
      setSnapshotVersion(restored.snapshotVersion)
      setFolderPath(restored.folderPath)
      lastSavedRef.current = {
        title: restored.title,
        code: restored.mermaidCode,
        noteMd: restored.noteMd ?? '',
        folderPath: restored.folderPath,
      }
      setSaveStatus('saved')
    },
    [diagramId],
  )

  const subtitle = noteExcerpt(noteMd) ?? undefined

  return {
    title,
    setTitle,
    code,
    setCode,
    noteMd,
    setNoteMd,
    folderPath,
    setFolderPath,
    saveStatus,
    mermaidRevision,
    noteRevision,
    snapshotVersion,
    versions: versions ?? [],
    subtitle,
    dbError,
    loaded,
    restoreVersion: handleRestoreVersion,
  }
}
