import { useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MoreVertical,
  Pencil,
  Play,
  Users,
} from 'lucide-react'
import type { DiagramVersionRecord } from '../../data/types'
import type { SaveStatus } from '../../hooks/useDiagramEditor'
import { MobileMenuButton } from '../MobileMenuButton'
import { ExportDropdown } from './ExportDropdown'
import { FolderSelect } from './FolderSelect'
import { VersionHistoryPanel } from './VersionHistoryPanel'

interface TopBarProps {
  title: string
  code: string
  saveStatus: SaveStatus
  mermaidRevision: number
  noteRevision: number
  folderPath: string
  folderPaths: string[]
  versions: DiagramVersionRecord[]
  onTitleChange: (title: string) => void
  onFolderChange: (folderPath: string) => void
  onRender: () => void
  onRestoreVersion: (snapshotVersion: number) => void
}

export function TopBar({
  title,
  code,
  saveStatus,
  mermaidRevision,
  noteRevision,
  folderPath,
  folderPaths,
  versions,
  onTitleChange,
  onFolderChange,
  onRender,
  onRestoreVersion,
}: TopBarProps) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [draftTitle, setDraftTitle] = useState(title)

  const commitTitle = () => {
    const trimmed = draftTitle.trim() || 'Untitled'
    onTitleChange(trimmed)
    setEditingTitle(false)
  }

  const saveLabel =
    saveStatus === 'saved'
      ? 'Saved'
      : saveStatus === 'saving'
        ? 'Saving…'
        : saveStatus === 'dirty'
          ? 'Unsaved'
          : 'Error'

  const SaveIcon =
    saveStatus === 'saving'
      ? Loader2
      : saveStatus === 'error'
        ? AlertCircle
        : CheckCircle2

  return (
    <div className="topbar">
      <div className="topbar-left">
        <MobileMenuButton />
        <div className="title-area">
          <div className="title-row">
            {editingTitle ? (
              <input
                className="title-input"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitTitle()
                  if (e.key === 'Escape') {
                    setDraftTitle(title)
                    setEditingTitle(false)
                  }
                }}
                autoFocus
              />
            ) : (
              <h1>{title}</h1>
            )}
            <button
              type="button"
              className="icon-btn"
              onClick={() => {
                setDraftTitle(title)
                setEditingTitle(true)
              }}
              aria-label="Edit title"
            >
              <Pencil size={14} className="icon-subtle" />
            </button>
            <FolderSelect
              value={folderPath}
              folderPaths={folderPaths}
              onChange={onFolderChange}
            />
            <div className={`saved-status saved-status--${saveStatus}`}>
              <SaveIcon
                size={14}
                className={
                  saveStatus === 'error'
                    ? 'icon-error'
                    : saveStatus === 'dirty'
                      ? 'icon-subtle'
                      : 'icon-primary'
                }
              />
              <span>{saveLabel}</span>
            </div>
            <div className="revision-badges">
              <span className="revision-badge">Diagram v{mermaidRevision}</span>
              {noteRevision > 0 && (
                <span className="revision-badge">Note v{noteRevision}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="topbar-right">
        <button type="button" className="btn btn-primary" onClick={onRender}>
          <Play size={14} fill="currentColor" /> Render
        </button>
        <VersionHistoryPanel versions={versions} onRestore={onRestoreVersion} />
        <button type="button" className="btn btn-secondary">
          <Users size={14} /> Share
        </button>
        <ExportDropdown code={code} filename={title} variant="topbar" />
        <button type="button" className="btn-icon-only">
          <MoreVertical size={16} />
        </button>
      </div>
    </div>
  )
}
