'use client'

import React, { useEffect, useState } from 'react'
import type { SceneDiffResult, SceneVersionSummary } from '@zaoly/contracts'

interface EditorHistoryDrawerProps {
  isOpen: boolean
  onClose: () => void
  sceneId: string
  onRestoreVersion: (versionId: string) => Promise<void>
  onCreateMilestone: () => void
  /** Keep drawer clear of the docked inspect rail (px from the editor body right edge). */
  insetRight?: number
}

export function EditorHistoryDrawer({
  isOpen,
  onClose,
  sceneId,
  onRestoreVersion,
  onCreateMilestone,
  insetRight = 0,
}: EditorHistoryDrawerProps) {
  const [versions, setVersions] = useState<SceneVersionSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Version diff comparison state (P117)
  const [diffingVersionId, setDiffingVersionId] = useState<string | null>(null)
  const [activeDiff, setActiveDiff] = useState<SceneDiffResult | null>(null)
  const [diffLoading, setDiffLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    let active = true

    async function fetchVersions() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/scenes/${sceneId}/versions`)
        if (!res.ok) throw new Error(`HTTP error ${res.status}`)
        const data = await res.json()
        if (active && Array.isArray(data.versions)) {
          setVersions(data.versions)
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load versions')
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchVersions()
    return () => {
      active = false
    }
  }, [isOpen, sceneId])

  async function handleToggleDiff(versionId: string) {
    if (diffingVersionId === versionId) {
      setDiffingVersionId(null)
      setActiveDiff(null)
      return
    }

    setDiffingVersionId(versionId)
    setActiveDiff(null)
    setDiffLoading(true)

    try {
      const res = await fetch(`/api/scenes/${sceneId}/versions/${versionId}/diff`)
      if (!res.ok) throw new Error(`HTTP error ${res.status}`)
      const data = await res.json()
      if (data.ok && data.diff) {
        setActiveDiff(data.diff)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to calculate diff')
      setDiffingVersionId(null)
    } finally {
      setDiffLoading(false)
    }
  }

  if (!isOpen) return null

  async function handleRestore(version: SceneVersionSummary) {
    const confirmed = window.confirm(
      `Restore version "${version.name}" (v${version.versionNumber})?\n\nAn automatic safety backup of your current state will be saved before reverting.`,
    )
    if (!confirmed) return

    setRestoringId(version.id)
    try {
      await onRestoreVersion(version.id)
      onClose()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to restore version')
    } finally {
      setRestoringId(null)
    }
  }

  return (
    <aside
      className="creation-history-drawer"
      data-testid="editor-history-drawer"
      style={{
        position: 'absolute',
        top: 0,
        right: Math.max(0, insetRight),
        bottom: 0,
        width: '340px',
        backgroundColor: '#18181b',
        borderLeft: '1px solid #27272a',
        boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.5)',
        zIndex: 45,
        display: 'flex',
        flexDirection: 'column',
        color: '#f4f4f5',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          borderBottom: '1px solid #27272a',
        }}
      >
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>Version History</h2>
          <span style={{ fontSize: '11px', color: '#a1a1aa' }}>Revisions & Milestones</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={onCreateMilestone}
            title="Save named milestone"
            style={{
              backgroundColor: '#1f44ff',
              border: 'none',
              borderRadius: '4px',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 600,
              padding: '4px 8px',
              cursor: 'pointer',
            }}
          >
            + Snapshot
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Close drawer"
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#a1a1aa',
              fontSize: '16px',
              cursor: 'pointer',
              padding: '0 4px',
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '24px', color: '#a1a1aa', fontSize: '12px' }}>
            Loading revisions...
          </div>
        )}

        {error && (
          <div style={{ color: '#ef4444', fontSize: '12px', padding: '12px 0' }}>
            {error}
          </div>
        )}

        {!loading && versions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: '#71717a', fontSize: '12px' }}>
            No checkpoints saved yet.<br />
            Press <code style={{ color: '#f4f4f5' }}>⌘⇧S</code> to save a milestone.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {versions.map((ver) => (
            <div
              key={ver.id}
              style={{
                backgroundColor: '#27272a',
                border: '1px solid #3f3f46',
                borderRadius: '6px',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#f4f4f5' }}>
                  {ver.name}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    backgroundColor: ver.isAutoSave ? '#3f3f46' : 'rgba(31, 68, 255, 0.2)',
                    color: ver.isAutoSave ? '#a1a1aa' : '#1f44ff',
                    fontWeight: 600,
                  }}
                >
                  {ver.isAutoSave ? 'Auto-Save' : 'Milestone'}
                </span>
              </div>

              {ver.description && (
                <p style={{ fontSize: '11px', color: '#a1a1aa', margin: 0 }}>
                  {ver.description}
                </p>
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '4px',
                  fontSize: '10px',
                  color: '#71717a',
                }}
              >
                <span>By {ver.author.name} · {new Date(ver.createdAt).toLocaleDateString()}</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => handleToggleDiff(ver.id)}
                    style={{
                      backgroundColor: diffingVersionId === ver.id ? '#3f3f46' : 'transparent',
                      border: '1px solid #52525b',
                      color: diffingVersionId === ver.id ? '#ffffff' : '#d4d4d8',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 500,
                      padding: '2px 8px',
                      cursor: 'pointer',
                    }}
                  >
                    {diffingVersionId === ver.id ? 'Close Diff' : 'Compare'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRestore(ver)}
                    disabled={restoringId === ver.id}
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px solid #52525b',
                      color: '#e4e4e7',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 500,
                      padding: '2px 8px',
                      cursor: 'pointer',
                    }}
                  >
                    {restoringId === ver.id ? 'Restoring...' : 'Restore'}
                  </button>
                </div>
              </div>

              {diffingVersionId === ver.id && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '8px',
                    borderRadius: '4px',
                    backgroundColor: '#18181b',
                    border: '1px solid #3f3f46',
                    fontSize: '11px',
                  }}
                >
                  {diffLoading && <div style={{ color: '#a1a1aa' }}>Calculating diff...</div>}
                  {activeDiff && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: '#a1a1aa' }}>Changes:</span>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            padding: '1px 5px',
                            borderRadius: '3px',
                            backgroundColor: 'rgba(16, 185, 129, 0.2)',
                            color: '#34d399',
                          }}
                        >
                          +{activeDiff.totalAdded}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            padding: '1px 5px',
                            borderRadius: '3px',
                            backgroundColor: 'rgba(244, 63, 94, 0.2)',
                            color: '#fb7185',
                          }}
                        >
                          -{activeDiff.totalRemoved}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            padding: '1px 5px',
                            borderRadius: '3px',
                            backgroundColor: 'rgba(245, 158, 11, 0.2)',
                            color: '#c6f24a',
                          }}
                        >
                          ~{activeDiff.totalModified}
                        </span>
                      </div>

                      {activeDiff.totalAdded === 0 && activeDiff.totalRemoved === 0 && activeDiff.totalModified === 0 ? (
                        <div style={{ color: '#71717a', fontSize: '10px' }}>Identical to current scene.</div>
                      ) : (
                        <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {activeDiff.pages.map((page) =>
                            page.nodeDiffs.map((diff) => (
                              <div
                                key={diff.nodeId}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '2px 4px',
                                  borderRadius: '3px',
                                  backgroundColor: '#27272a',
                                  fontSize: '10px',
                                }}
                              >
                                <span style={{ color: '#e4e4e7' }}>
                                  {diff.name || diff.type}
                                </span>
                                <span
                                  style={{
                                    fontSize: '9px',
                                    fontWeight: 600,
                                    color:
                                      diff.kind === 'added'
                                        ? '#34d399'
                                        : diff.kind === 'removed'
                                        ? '#fb7185'
                                        : '#c6f24a',
                                  }}
                                >
                                  {diff.kind.toUpperCase()}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
