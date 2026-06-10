import { useState } from 'react'
import { History, X } from 'lucide-react'
import type { DiagramVersionRecord, VersionField } from '../../data/types'
import { VersionHistoryItem } from './VersionHistoryItem'

interface VersionHistoryPanelProps {
  versions: DiagramVersionRecord[]
  onRestore: (snapshotVersion: number) => void
}

type Filter = 'all' | VersionField

export function VersionHistoryPanel({ versions, onRestore }: VersionHistoryPanelProps) {
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')

  const filtered =
    filter === 'all'
      ? versions
      : versions.filter((v) => v.changedFields.includes(filter))

  const handleRestore = (snapshotVersion: number) => {
    if (window.confirm(`Restore to version ${snapshotVersion}?`)) {
      onRestore(snapshotVersion)
      setOpen(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => setOpen(true)}
        title="Version history"
      >
        <History size={14} /> History
      </button>
      {open && (
        <div className="version-history-overlay" onClick={() => setOpen(false)}>
          <div
            className="version-history-panel"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Version history"
          >
            <div className="version-history-panel-header">
              <h2>Version history</h2>
              <button type="button" className="btn-icon-only" onClick={() => setOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="version-history-filters">
              {(['all', 'mermaidCode', 'noteMd'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`version-filter-btn${filter === f ? ' active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'All' : f === 'mermaidCode' ? 'Diagram' : 'Note'}
                </button>
              ))}
            </div>
            <div className="version-history-list">
              {filtered.length === 0 ? (
                <p className="version-history-empty">No earlier versions yet.</p>
              ) : (
                filtered.map((v) => (
                  <VersionHistoryItem
                    key={v.id}
                    version={v}
                    onRestore={() => handleRestore(v.snapshotVersion)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
