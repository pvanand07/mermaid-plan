import { type FormEvent, useEffect, useId, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { buildFolderPath } from '../lib/db/folderRepository'
import { normalizeFolderPath } from '../lib/folders/pathUtils'
import { validateFolderName } from '../lib/folders/validateFolderName'
import { cn } from '../lib/cn'

interface CreateFolderDialogProps {
  open: boolean
  parentPath: string
  siblingNames: string[]
  onClose: () => void
  onCreate: (folderPath: string) => Promise<void>
}

export function CreateFolderDialog({
  open,
  parentPath,
  siblingNames,
  onClose,
  onCreate,
}: CreateFolderDialogProps) {
  const titleId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const normalizedParent = normalizeFolderPath(parentPath)
  const trimmedName = name.trim()

  useEffect(() => {
    if (!open) return
    setName('')
    setError(null)
    setSubmitting(false)
    const frame = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const validationError = validateFolderName(name, siblingNames)
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await onCreate(buildFolderPath(normalizedParent, name))
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create folder')
      setSubmitting(false)
    }
  }

  return (
    <div className="create-folder-overlay" onClick={onClose}>
      <div
        className="create-folder-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="create-folder-header">
          <h2 id={titleId}>New folder</h2>
          <button
            type="button"
            className="btn-icon-only"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form className="create-folder-form" onSubmit={(event) => void handleSubmit(event)}>
          <input
            ref={inputRef}
            type="text"
            className={cn('create-folder-input', error && 'create-folder-input--error')}
            placeholder="Folder name"
            value={name}
            disabled={submitting}
            onChange={(event) => {
              setName(event.target.value)
              if (error) setError(null)
            }}
            autoComplete="off"
            spellCheck={false}
            aria-label="Folder name"
          />

          {error && (
            <p className="create-folder-error" role="alert">
              {error}
            </p>
          )}

          <div className="create-folder-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting || !trimmedName}>
              {submitting ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
