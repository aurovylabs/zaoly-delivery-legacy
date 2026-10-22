'use client'

import React, { useState, useMemo } from 'react'
import type { CompositionScene, SceneOp } from '@zaoly/contracts'
import {
  lintCompositionScene,
  autoFixLintIssue,
  autoFixAllLintIssues,
  type LintIssue,
} from '../lib/linter/scene-linter'
import type { InspectTokenOption } from '../lib/inspect/token-catalog'

interface EditorLinterPanelProps {
  scene: CompositionScene
  selectedNodeId?: string | null
  onSelectNode: (nodeId: string) => void
  onClose?: () => void
  onApplyOps?: (ops: SceneOp[]) => void
  tokenCatalog?: InspectTokenOption[]
  i18nActive?: boolean
  rtlActive?: boolean
  onToggleI18n?: (active: boolean) => void
  onToggleRtl?: (active: boolean) => void
}

export function EditorLinterPanel({
  scene,
  selectedNodeId,
  onSelectNode,
  onClose,
  onApplyOps,
  tokenCatalog,
  i18nActive = false,
  rtlActive = false,
  onToggleI18n,
  onToggleRtl,
}: EditorLinterPanelProps) {
  const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all')

  const issues = useMemo(() => {
    return lintCompositionScene(scene, tokenCatalog)
  }, [scene, tokenCatalog])

  const filteredIssues = useMemo(() => {
    if (filter === 'all') return issues
    return issues.filter((i) => i.severity === filter)
  }, [issues, filter])

  const counts = useMemo(() => {
    return {
      error: issues.filter((i) => i.severity === 'error').length,
      warning: issues.filter((i) => i.severity === 'warning').length,
      info: issues.filter((i) => i.severity === 'info').length,
      fixable: issues.filter((i) => i.fixable !== false).length,
    }
  }, [issues])

  const complianceScore = useMemo(() => {
    return Math.max(0, 100 - (counts.error * 15 + counts.warning * 5))
  }, [counts.error, counts.warning])

  const handleFixSingle = (e: React.MouseEvent, issue: LintIssue) => {
    e.stopPropagation()
    onSelectNode(issue.nodeId)
    if (onApplyOps) {
      const ops = autoFixLintIssue(issue, scene, tokenCatalog)
      if (ops.length > 0) {
        onApplyOps(ops)
      }
    }
  }

  const handleFixAll = () => {
    if (onApplyOps && issues.length > 0) {
      const ops = autoFixAllLintIssues(filteredIssues, scene, tokenCatalog)
      if (ops.length > 0) {
        onApplyOps(ops)
      }
    }
  }

  return (
    <aside
      className="creation-editor-linter-panel"
      data-testid="editor-linter-panel"
      style={{
        width: '320px',
        background: '#121215',
        borderLeft: '1px solid #27272a',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        color: '#f4f4f5',
        fontSize: '13px',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #27272a',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <span style={{ fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap' }}>
            A11y &amp; Token Linter
          </span>
          <span
            style={{
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '999px',
              background: issues.length > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
              color: issues.length > 0 ? '#ef4444' : '#22c55e',
              fontWeight: 600,
            }}
          >
            {issues.length}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {onApplyOps && counts.fixable > 0 && (
            <button
              type="button"
              onClick={handleFixAll}
              data-testid="linter-fix-all-btn"
              title="Auto-fix all fixable issues"
              style={{
                background: 'linear-gradient(135deg, #1f44ff 0%, #1636cc 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '5px',
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 2px 4px rgba(31, 68, 255, 0.25)',
                transition: 'transform 0.1s ease',
              }}
            >
              <span>⚡</span> Fix All ({filteredIssues.filter((i) => i.fixable !== false).length})
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#a1a1aa',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '4px',
              }}
              aria-label="Close linter"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Pre-Flight Compliance Score Banner */}
      <div
        style={{
          padding: '10px 16px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderBottom: '1px solid #27272a',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: '10px', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            WCAG 2.2 AA Compliance
          </div>
          <div
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: complianceScore >= 90 ? '#22c55e' : complianceScore >= 70 ? '#c6f24a' : '#ef4444',
            }}
          >
            {complianceScore}%
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '11px', color: '#71717a' }}>
          {counts.error === 0 && counts.warning === 0
            ? '100% Passing'
            : `${counts.error} errors, ${counts.warning} warnings`}
        </div>
      </div>

      {/* i18n & RTL Stress-Testing Bar */}
      <div
        style={{
          padding: '8px 16px',
          background: '#141417',
          borderBottom: '1px solid #27272a',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#a1a1aa' }}>
          🌐 i18n &amp; RTL Simulation
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => onToggleI18n?.(!i18nActive)}
            style={{
              flex: 1,
              padding: '4px 8px',
              fontSize: '11px',
              borderRadius: '4px',
              border: i18nActive ? '1px solid #1f44ff' : '1px solid #27272a',
              background: i18nActive ? 'rgba(31, 68, 255, 0.15)' : '#1c1c20',
              color: i18nActive ? '#1f44ff' : '#a1a1aa',
              cursor: 'pointer',
              fontWeight: i18nActive ? 600 : 400,
            }}
          >
            +35% Length
          </button>
          <button
            type="button"
            onClick={() => onToggleRtl?.(!rtlActive)}
            style={{
              flex: 1,
              padding: '4px 8px',
              fontSize: '11px',
              borderRadius: '4px',
              border: rtlActive ? '1px solid #1f44ff' : '1px solid #27272a',
              background: rtlActive ? 'rgba(31, 68, 255, 0.15)' : '#1c1c20',
              color: rtlActive ? '#1f44ff' : '#a1a1aa',
              cursor: 'pointer',
              fontWeight: rtlActive ? 600 : 400,
            }}
          >
            RTL Flow
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          padding: '8px 12px',
          borderBottom: '1px solid #27272a',
          background: '#18181b',
        }}
      >
        <button
          type="button"
          onClick={() => setFilter('all')}
          style={{
            background: filter === 'all' ? '#27272a' : 'transparent',
            color: filter === 'all' ? '#fff' : '#a1a1aa',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '11px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          All ({issues.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('error')}
          style={{
            background: filter === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
            color: filter === 'error' ? '#ef4444' : '#a1a1aa',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '11px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Errors ({counts.error})
        </button>
        <button
          type="button"
          onClick={() => setFilter('warning')}
          style={{
            background: filter === 'warning' ? 'rgba(234, 179, 8, 0.2)' : 'transparent',
            color: filter === 'warning' ? '#c6f24a' : '#a1a1aa',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '11px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Warnings ({counts.warning})
        </button>
        <button
          type="button"
          onClick={() => setFilter('info')}
          style={{
            background: filter === 'info' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
            color: filter === 'info' ? '#3b82f6' : '#a1a1aa',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '11px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Tokens ({counts.info})
        </button>
      </div>

      {/* Issues list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredIssues.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: '#71717a' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>✨</div>
            <div style={{ fontWeight: 500, color: '#e4e4e7', marginBottom: '4px' }}>No issues found</div>
            <div style={{ fontSize: '11px' }}>All elements meet WCAG contrast and design system token standards.</div>
          </div>
        ) : (
          filteredIssues.map((issue) => {
            const isSelected = selectedNodeId === issue.nodeId
            const badgeBg =
              issue.severity === 'error'
                ? '#ef4444'
                : issue.severity === 'warning'
                  ? '#c6f24a'
                  : '#3b82f6'

            return (
              <div
                key={issue.id}
                onClick={() => onSelectNode(issue.nodeId)}
                data-testid={`lint-issue-${issue.id}`}
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  background: isSelected ? 'rgba(31, 68, 255, 0.12)' : '#18181b',
                  border: isSelected ? '1px solid #1f44ff' : '1px solid #27272a',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: badgeBg,
                        display: 'inline-block',
                      }}
                    />
                    <span style={{ fontWeight: 600, fontSize: '12px', color: '#f4f4f5' }}>
                      {issue.nodeName}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: '#a1a1aa',
                        fontFamily: 'monospace',
                      }}
                    >
                      {issue.code}
                    </span>
                    {onApplyOps && issue.fixable !== false && (
                      <button
                        type="button"
                        onClick={(e) => handleFixSingle(e, issue)}
                        data-testid={`lint-fix-btn-${issue.id}`}
                        title="1-Click Auto-Fix"
                        style={{
                          background: 'rgba(31, 68, 255, 0.15)',
                          color: '#1f44ff',
                          border: '1px solid rgba(31, 68, 255, 0.3)',
                          borderRadius: '4px',
                          padding: '2px 6px',
                          fontSize: '10px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          transition: 'all 0.12s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#1f44ff'
                          e.currentTarget.style.color = '#ffffff'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(31, 68, 255, 0.15)'
                          e.currentTarget.style.color = '#1f44ff'
                        }}
                      >
                        ⚡ Fix
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#d4d4d8', lineHeight: 1.4 }}>
                  {issue.message}
                </div>
                {issue.fixHint && (
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#a1a1aa',
                      background: 'rgba(255, 255, 255, 0.04)',
                      padding: '4px 6px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>💡</span>
                    <span>{issue.fixHint}</span>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </aside>
  )
}
