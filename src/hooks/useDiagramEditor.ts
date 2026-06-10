import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { storageConfig } from '../config/storage'
import type { DiagramRecord, Template } from '../data/types'
import { useDbReady } from './useDbReady'
import { createDiagram, getDiagram, updateDiagram } from '../lib/db/diagramRepository'
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

export function useDiagramEditor({
  id,
  initialCode,
  initialTitle,
  initialNoteMd,
  initialFolderPath,
  templateNote,
}: UseDiagramEditorOptions) {
  const navigate = useNavigate()
  const { dbError } = useDbReady()

  const [diagramId, setDiagramId] = useState<string | undefined>(id)
  const [title, setTitle] = useState(initialTitle)
  const [code, setCode] = useState(initialCode)
  const [noteMd, setNoteMd] = useState(initialNoteMd ?? templateNote ?? '')
  const [folderPath, setFolderPath] = useState(initialFolderPath)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
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
  const skipAutosaveRef = useRef(false)

  const versions = useLiveQuery(
    () => (diagramId ? listVersions(diagramId) : []),
    [diagramId],
    [],
  )

  useEffect(() => {
    if (!id) return
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

    const contentChanged =
      title !== lastSavedRef.current.title ||
      code !== lastSavedRef.current.code ||
      (noteMd ?? '') !== (lastSavedRef.current.noteMd ?? '')
    const folderChanged = folderPath !== lastSavedRef.current.folderPath

    if (!contentChanged && !folderChanged) {
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
        if (storageConfig.versioning.enabled) {
          await createVersionSnapshot(record)
        }
        setSaveStatus('saved')
        return
      }

      record = await updateDiagram(diagramId, {
        title,
        mermaidCode: code,
        noteMd: noteMd || null,
        folderPath,
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

      lastSavedRef.current = { title, code, noteMd, folderPath }
      setSaveStatus('saved')
    } catch {
      setSaveStatus('error')
    } finally {
      isSavingRef.current = false
    }
  }, [code, diagramId, folderPath, navigate, noteMd, title])

  useEffect(() => {
    if (!loaded) return

    if (skipAutosaveRef.current) {
      skipAutosaveRef.current = false
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }
      if (saveStatus !== 'saving') setSaveStatus('dirty')
      return
    }

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
    async (versionId: string) => {
      if (!diagramId) return
      const restored = await restoreVersion(diagramId, versionId)
      setTitle(restored.title)
      setCode(restored.mermaidCode)
      setNoteMd(restored.noteMd ?? '')
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

  const applyAgentDiagramUpdate = useCallback(
    async (nextCode: string, commitMessage?: string) => {
      setCode(nextCode)

      if (isSavingRef.current) return

      isSavingRef.current = true
      setSaveStatus('saving')

      try {
        let record: DiagramRecord

        if (!diagramId) {
          record = await createDiagram({
            title,
            mermaidCode: nextCode,
            noteMd: noteMd || undefined,
            folderPath,
          })
          setDiagramId(record.id)
          navigate(`/editor/${record.id}`, { replace: true })
        } else {
          record = await updateDiagram(diagramId, {
            mermaidCode: nextCode,
          })
        }

        if (storageConfig.versioning.enabled) {
          lastSnapshotAtRef.current = Date.now()
          await createVersionSnapshot(record, commitMessage)
        }

        lastSavedRef.current = {
          ...lastSavedRef.current,
          code: nextCode,
        }
        setSaveStatus('saved')
      } catch {
        setSaveStatus('error')
      } finally {
        isSavingRef.current = false
      }
    },
    [diagramId, folderPath, navigate, noteMd, title],
  )

  const applyAgentNoteUpdate = useCallback(
    async (nextNoteMd: string, commitMessage?: string) => {
      setNoteMd(nextNoteMd)

      if (isSavingRef.current) return

      isSavingRef.current = true
      setSaveStatus('saving')

      try {
        let record: DiagramRecord

        if (!diagramId) {
          record = await createDiagram({
            title,
            mermaidCode: code,
            noteMd: nextNoteMd || undefined,
            folderPath,
          })
          setDiagramId(record.id)
          navigate(`/editor/${record.id}`, { replace: true })
        } else {
          record = await updateDiagram(diagramId, {
            noteMd: nextNoteMd || null,
          })
        }

        if (storageConfig.versioning.enabled) {
          lastSnapshotAtRef.current = Date.now()
          await createVersionSnapshot(record, commitMessage)
        }

        lastSavedRef.current = {
          ...lastSavedRef.current,
          noteMd: nextNoteMd,
        }
        setSaveStatus('saved')
      } catch {
        setSaveStatus('error')
      } finally {
        isSavingRef.current = false
      }
    },
    [code, diagramId, folderPath, navigate, title],
  )

  const applyTemplate = useCallback(
    (template: Template) => {
      skipAutosaveRef.current = true
      setCode(template.mermaidCode)
      const isDefaultTitle = title === 'Untitled' || title === 'FlowChart'
      if (isDefaultTitle) setTitle(template.name)
      if (!noteMd.trim()) setNoteMd(template.description)
    },
    [noteMd, title],
  )

  const subtitle = noteExcerpt(noteMd) ?? undefined

  return {
    diagramId,
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
    dbError,
    loaded,
    restoreVersion: handleRestoreVersion,
    applyAgentDiagramUpdate,
    applyAgentNoteUpdate,
    applyTemplate,
  }
}
