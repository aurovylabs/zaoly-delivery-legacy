'use client'

import React, { useState } from 'react'
import type { CompositionScene, SceneMaster } from '@zaoly/contracts'
import { IconChevronDown as ChevronDown, IconChevronRight as ChevronRight, IconExternalLink as ExternalLink, IconEdit as Pencil, IconTrash as Trash2 } from '../lib/zaoly-ui'
import { Button } from '../lib/zaoly-ui'
import { analyzeMasterImpact } from '../lib/scene/master-impact'

const iconProps = { size: 14, strokeWidth: 1.75, 'aria-hidden': true as const }

/** Left-rail Masters list — `specs/domain/composition-masters.md` & `specs/domain/composition-masters-analytics.md`. */
export function EditorMastersPanel({
  masters,
  scene,
  editingMasterId,
  onOpen,
  onExitEdit,
  onDelete,
  onJumpToInstance,
  title,
  emptyLabel,
  openLabel,
  deleteLabel,
  exitEditLabel,
  editingLabel,
  formatVariantCount,
}: {
  masters: SceneMaster[]
  scene?: CompositionScene
  editingMasterId: string | null
  onOpen: (masterId: string) => void
  onExitEdit: () => void
  onDelete: (masterId: string) => void
  onJumpToInstance?: (pageId: string, nodeId: string) => void
  title: string
  emptyLabel: string
  openLabel: string
  deleteLabel: string
  exitEditLabel: string
  editingLabel: string
  formatVariantCount: (count: number) => string
}) {
  const [expandedImpactMasterId, setExpandedImpactMasterId] = useState<string | null>(null)

  return (
    <div
      className="creation-editor-masters"
      role="region"
      aria-label={title}
      data-testid="creation-editor-masters"
    >
      <p className="creation-editor-masters__title">{title}</p>
      {editingMasterId ? (
        <div className="creation-editor-masters__banner" data-testid="creation-master-edit-banner">
          <span>{editingLabel}</span>
          <Button type="button" size="sm" variant="ghost" onClick={onExitEdit}>
            {exitEditLabel}
          </Button>
        </div>
      ) : null}
      {!masters.length ? (
        <p className="creation-editor-masters__empty">{emptyLabel}</p>
      ) : (
        <ul className="creation-editor-masters__list">
          {masters.map((m) => {
            const variantCount = m.variants?.length ?? 0
            const metaParts = [
              m.sourceKey,
              variantCount > 1 ? formatVariantCount(variantCount) : null,
            ].filter(Boolean)
            const rowTitle = metaParts.length ? metaParts.join(' · ') : undefined
            const isEditing = editingMasterId === m.id

            const impact = scene ? analyzeMasterImpact(scene, m.id) : null
            const isExpanded = expandedImpactMasterId === m.id

            return (
              <li
                key={m.id}
                className={
                  isEditing
                    ? 'creation-editor-masters__item creation-editor-masters__item--editing'
                    : 'creation-editor-masters__item'
                }
                data-master-id={m.id}
                title={rowTitle}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  {impact && impact.totalInstances > 0 ? (
                    <button
                      type="button"
                      onClick={() => setExpandedImpactMasterId(isExpanded ? null : m.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        marginRight: '4px',
                        cursor: 'pointer',
                        color: '#71717a',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="Toggle instance telemetry"
                    >
                      {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </button>
                  ) : null}
                  <span className="creation-editor-masters__name" style={{ flex: 1 }}>{m.name}</span>
                  {m.sourceKey ? (
                    <span className="creation-editor-masters__source">{m.sourceKey}</span>
                  ) : null}
                  {impact ? (
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        backgroundColor: '#27272a',
                        color: '#a1a1aa',
                        marginRight: '6px',
                        cursor: impact.totalInstances > 0 ? 'pointer' : 'default',
                      }}
                      onClick={() => {
                        if (impact.totalInstances > 0) {
                          setExpandedImpactMasterId(isExpanded ? null : m.id)
                        }
                      }}
                      title={`${impact.totalInstances} total instances across ${impact.pageCount} page(s)`}
                    >
                      {impact.totalInstances} {impact.totalInstances === 1 ? 'inst' : 'insts'}
                    </span>
                  ) : null}
                  {variantCount > 1 ? (
                    <span
                      className="creation-editor-masters__badge"
                      aria-label={formatVariantCount(variantCount)}
                    >
                      {variantCount}
                    </span>
                  ) : null}
                  <div className="creation-editor-masters__actions">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      icon={<Pencil {...iconProps} />}
                      aria-label={openLabel}
                      title={openLabel}
                      data-testid={`master-open-${m.id}`}
                      onClick={() => onOpen(m.id)}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      icon={<Trash2 {...iconProps} />}
                      aria-label={deleteLabel}
                      title={deleteLabel}
                      data-testid={`master-delete-${m.id}`}
                      onClick={() => onDelete(m.id)}
                    />
                  </div>
                </div>

                {/* P118: Instance Analytics Breakdown */}
                {isExpanded && impact && impact.instances.length > 0 && (
                  <div
                    style={{
                      marginTop: '6px',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      backgroundColor: '#18181b',
                      border: '1px solid #27272a',
                      fontSize: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ color: '#71717a', fontWeight: 600 }}>
                      Instances ({impact.totalInstances})
                    </div>
                    {impact.instances.map((inst) => (
                      <div
                        key={inst.instanceNodeId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '2px 4px',
                          borderRadius: '3px',
                          backgroundColor: '#27272a',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden' }}>
                          <span style={{ color: '#e4e4e7', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {inst.pageName}
                          </span>
                          {inst.hasOverrides && (
                            <span
                              style={{
                                fontSize: '8px',
                                padding: '1px 3px',
                                borderRadius: '2px',
                                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                                color: '#c6f24a',
                              }}
                              title={`Overrides: ${inst.overrideKeys.join(', ')}`}
                            >
                              overridden
                            </span>
                          )}
                        </div>
                        {onJumpToInstance ? (
                          <button
                            type="button"
                            onClick={() => onJumpToInstance(inst.pageId, inst.instanceNodeId)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#1f44ff',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px',
                              fontSize: '9px',
                              fontWeight: 600,
                              padding: '1px 3px',
                            }}
                            title="Jump to instance on canvas"
                          >
                            Jump <ExternalLink size={9} />
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
