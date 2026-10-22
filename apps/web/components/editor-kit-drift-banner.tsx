'use client'

/**
 * Kit drift notice — eng seed newer than scene Masters.
 * Spec: site-kit-kit-pull.md
 */
import { Button, Text } from '@zaoly/ui'
import type { MasterKitDrift } from '../lib/site-kit/kit-drift'

export function EditorKitDriftBanner({
  rows,
  busy,
  onPull,
  onReset,
  onDismiss,
}: {
  rows: MasterKitDrift[]
  busy?: boolean
  onPull: () => void
  onReset: () => void
  onDismiss: () => void
}) {
  if (rows.length === 0) return null
  const kitNewer = rows.filter((r) => r.kind === 'kit-newer').length
  const neverPulled = rows.filter((r) => r.kind === 'never-pulled').length

  return (
    <div className="creation-editor-kit-drift" data-testid="editor-kit-drift-banner">
      <div className="creation-editor-kit-drift__copy">
        <Text role="meta" as="p" className="creation-editor-kit-drift__title">
          Kit drift — {rows.length} Master{rows.length === 1 ? '' : 's'}
          {kitNewer ? ` · ${kitNewer} newer in Kit` : ''}
          {neverPulled ? ` · ${neverPulled} never pulled` : ''}
        </Text>
        <ul className="creation-editor-kit-drift__list">
          {rows.slice(0, 4).map((row) => (
            <li key={row.masterId} data-testid="editor-kit-drift-row" data-kind={row.kind}>
              <strong>{row.masterName}</strong>
              <span className="creation-editor-kit-drift__muted">
                {' '}
                · {row.kind === 'never-pulled' ? 'no kitRevision' : 'kit newer'} ·{' '}
                {row.componentId}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="creation-editor-kit-drift__actions">
        <Button
          type="button"
          size="sm"
          variant="subtle"
          disabled={busy}
          data-testid="editor-kit-drift-pull"
          onClick={onPull}
        >
          Pull schema
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={busy}
          data-testid="editor-kit-drift-reset"
          onClick={onReset}
        >
          Reset…
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          data-testid="editor-kit-drift-dismiss"
          onClick={onDismiss}
        >
          Dismiss
        </Button>
      </div>
    </div>
  )
}
