export function validateFolderName(name: string, siblingNames: string[]): string | null {
  const trimmed = name.trim()
  if (!trimmed) return 'Folder name is required'
  if (trimmed.includes('/')) return 'Folder name cannot contain slashes'
  if (trimmed === '.' || trimmed === '..') return 'Invalid folder name'

  const lower = trimmed.toLowerCase()
  if (siblingNames.some((sibling) => sibling.toLowerCase() === lower)) {
    return 'A folder with this name already exists'
  }

  return null
}
