import type { DiagramVersionRecord } from '../../data/types'
import { formatEditedAgo } from '../../lib/formatEditedAgo'

interface VersionHistoryItemProps {
  version: DiagramVersionRecord
  onRestore: () => void
}

export function VersionHistoryItem({ version, onRestore }: VersionHistoryItemProps) {
  return (
    <div className="version-history-item">
      <div className="version-history-item-header">
        <span className="version-history-snapshot">v{version.snapshotVersion}</span>
        <span className="version-history-time">{formatEditedAgo(version.createdAt)}</span>
      </div>
      <div className="version-history-revisions">
        Diagram v{version.mermaidRevision}
        {version.noteRevision > 0 && <> · Note v{version.noteRevision}</>}
      </div>
      <div className="version-history-chips">
        {version.changedFields.map((field) => (
          <span key={field} className="version-chip">
            {field === 'mermaidCode' ? 'Diagram' : field === 'noteMd' ? 'Note' : 'Title'}
          </span>
        ))}
      </div>
      <button type="button" className="btn btn-secondary btn-sm" onClick={onRestore}>
        Restore
      </button>
    </div>
  )
}
