import { useCallback, useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { storageConfig } from '../config/storage'
import type { Template } from '../data/types'
import { useDbReady } from './useDbReady'
import { getDiagram, updateDiagram } from '../lib/db/diagramRepository'
import { createVersionSnapshot, listVersions, restoreVersion } from '../lib/db/versionRepository'
import { noteExcerpt } from '../lib/formatEditedAgo'

export type SaveStatus = 'saved' | 'saving' | 'dirty' | 'error'

interface UseDiagramEditorOptions {
  id: string
}

export function useDiagramEditor({ id }: UseDiagramEditorOptions) {
  const { dbError } = useDbReady()

  const [title, setTitle] = useState('Untitled')
  const [code, setCode] = useState('')
  const [noteMd, setNoteMd] = useState('')
  const [folderPath, setFolderPath] = useState('')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [loaded, setLoaded] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const lastSavedRef = useRef({
    title: 'Untitled',
    code: '',
    noteMd: '',
    folderPath: '',
  })
  const lastSnapshotAtRef = useRef<number | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSavingRef = useRef(false)

  const versions = useLiveQuery(() => listVersions(id), [id], [])

  useEffect(() => {
    let cancelled = false
    setLoaded(false)
    setNotFound(false)

    getDiagram(id).then((record) => {
      if (cancelled) return
      if (!record) {
        setNotFound(true)
        setLoaded(true)
        return
      }

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
    if (isSavingRef.current || notFound) return

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
      const record = await updateDiagram(id, {
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
  }, [code, folderPath, id, notFound, noteMd, title])

  useEffect(() => {
    if (!loaded || notFound) return

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
  }, [title, code, noteMd, folderPath, loaded, notFound, persist, saveStatus])

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
      lastSavedRef.current = {
        title: restored.title,
        code: restored.mermaidCode,
        noteMd: restored.noteMd ?? '',
        folderPath: restored.folderPath,
      }
      setSaveStatus('saved')
    },
    [id],
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
    [id],
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
    [id],
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
    dbError,
    loaded,
    notFound,
    restoreVersion: handleRestoreVersion,
    applyAgentDiagramUpdate,
    applyAgentNoteUpdate,
    applyTemplate,
  }
}
