import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'

export type SaveStatus = 'saved' | 'saving' | 'dirty' | 'error'

export function useAutosave<TValue>(
  value: TValue,
  isEqual: (a: TValue, b: TValue) => boolean,
  save: () => Promise<void>,
  delayMs: number,
): {
  saveStatus: SaveStatus
  dirty: boolean
  setSaveStatus: (status: SaveStatus) => void
  markSaved: (next: TValue) => void
  isSavingRef: MutableRefObject<boolean>
} {
  const [savedSnapshot, setSavedSnapshot] = useState(value)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSavingRef = useRef(false)
  const saveRef = useRef(save)

  useEffect(() => {
    saveRef.current = save
  }, [save])

  const dirty = useMemo(
    () => !isEqual(value, savedSnapshot),
    [value, savedSnapshot, isEqual],
  )

  const markSaved = useCallback((next: TValue) => {
    setSavedSnapshot(next)
    setSaveStatus('saved')
  }, [])

  const runSave = useCallback(async () => {
    if (isSavingRef.current) return

    if (!dirty) {
      setSaveStatus('saved')
      return
    }

    isSavingRef.current = true
    setSaveStatus('saving')

    try {
      await saveRef.current()
      setSavedSnapshot(value)
      setSaveStatus('saved')
    } catch {
      setSaveStatus('error')
    } finally {
      isSavingRef.current = false
    }
  }, [dirty, value])

  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      void runSave()
    }, delayMs)

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [value, dirty, delayMs, runSave])

  const displayStatus: SaveStatus =
    dirty && saveStatus !== 'saving' && saveStatus !== 'error' ? 'dirty' : saveStatus

  return { saveStatus: displayStatus, dirty, setSaveStatus, markSaved, isSavingRef }
}
