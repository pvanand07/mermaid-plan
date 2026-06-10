import { useState } from 'react'
import { History, X } from 'lucide-react'
import type { DiagramVersionRecord } from '../../data/types'
import { formatEditedAgo } from '../../lib/formatEditedAgo'
import { summarizeVersionDiff } from '../../lib/diff/versionDiff'

const MAX_DIFF_LINES = 10

interface VersionHistoryPanelProps {
  versions: DiagramVersionRecord[]
  onRestore: (versionId: string) => void
}

export function VersionHistoryPanel({ versions, onRestore }: VersionHistoryPanelProps) {
  const [open, setOpen] = useState(false)

  const handleRestore = (versionId: string, label: string) => {
    if (window.confirm(`Restore snapshot from ${label}?`)) {
      onRestore(versionId)
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
            <div className="version-history-list">
              {versions.length === 0 ? (
                <p className="version-history-empty">No earlier versions yet.</p>
              ) : (
                versions.map((version, index) => {
                  const label = formatEditedAgo(version.createdAt)
                  const previous = versions[index + 1]
                  const diff = summarizeVersionDiff(version, previous)
                  const previewLines = diff.lines.slice(0, MAX_DIFF_LINES)
                  const hiddenCount = diff.lines.length - previewLines.length

                  return (
                    <div key={version.id} className="version-history-item">
                      <div className="version-history-item-header">
                        <span className="version-history-time">{label}</span>
                        <div className="version-history-stats">
                          {diff.isInitial ? (
                            <span className="version-diff-stat version-diff-stat--add">
                              +{diff.stats.added}
                            </span>
                          ) : diff.stats.added === 0 && diff.stats.removed === 0 && !diff.titleChanged ? (
                            <span className="version-diff-stat version-diff-stat--neutral">no changes</span>
                          ) : (
                            <>
                              {diff.stats.added > 0 && (
                                <span className="version-diff-stat version-diff-stat--add">
                                  +{diff.stats.added}
                                </span>
                              )}
                              {diff.stats.removed > 0 && (
                                <span className="version-diff-stat version-diff-stat--remove">
                                  −{diff.stats.removed}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {diff.titleChanged && (
                        <p className="version-history-title-change">Title updated</p>
                      )}

                      {previewLines.length > 0 && (
                        <pre className="version-diff-preview" aria-label="Changed lines">
                          {previewLines.map((line, lineIndex) => (
                            <code
                              key={`${line.type}-${lineIndex}`}
                              className={`version-diff-line version-diff-line--${line.type}`}
                            >
                              {line.type === 'add' ? '+' : '−'} {line.line || ' '}
                            </code>
                          ))}
                          {hiddenCount > 0 && (
                            <span className="version-diff-more">
                              … {hiddenCount} more line{hiddenCount === 1 ? '' : 's'}
                            </span>
                          )}
                        </pre>
                      )}

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleRestore(version.id, label)}
                      >
                        Restore
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
