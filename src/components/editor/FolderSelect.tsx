import { Folder } from 'lucide-react'
import { normalizeFolderPath } from '../../lib/folders/pathUtils'

interface FolderSelectProps {
  value: string
  folderPaths: string[]
  onChange: (folderPath: string) => void
}

function formatFolderLabel(path: string): string {
  const normalized = normalizeFolderPath(path)
  if (!normalized) return 'Root'
  return normalized.split('/').join(' / ')
}

export function FolderSelect({ value, folderPaths, onChange }: FolderSelectProps) {
  const normalizedValue = normalizeFolderPath(value)
  const options = new Set<string>(['', ...folderPaths.map(normalizeFolderPath)])
  if (normalizedValue) options.add(normalizedValue)

  const sorted = [...options].sort((a, b) => {
    if (!a) return -1
    if (!b) return 1
    return a.localeCompare(b)
  })

  return (
    <label className="folder-select">
      <Folder size={14} className="icon-subtle folder-select-icon" aria-hidden />
      <select
        className="folder-select-input"
        value={normalizedValue}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Folder"
      >
        {sorted.map((path) => (
          <option key={path || 'root'} value={path}>
            {formatFolderLabel(path)}
          </option>
        ))}
      </select>
    </label>
  )
}
