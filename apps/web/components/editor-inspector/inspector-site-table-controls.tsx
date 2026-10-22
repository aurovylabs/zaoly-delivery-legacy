'use client'

import { Button, IconTableAddColumn, IconTableAddRow } from '@zaoly/ui'
import type { SceneOp } from '@zaoly/contracts'

type InspectorSiteTableControlsProps = {
  nodeId: string
  locked?: boolean
  runOp: (op: SceneOp) => void
}

/** Structure controls for SiteTable (specs/domain/site-table.md). */
export function InspectorSiteTableControls({
  nodeId,
  locked,
  runOp,
}: InspectorSiteTableControlsProps) {
  if (locked) return null
  return (
    <div className="creation-inspect-site-table" data-testid="inspect-site-table-controls">
      <div className="creation-inspect-size-box__header" style={{ marginBottom: '0.35rem' }}>
        <span className="creation-inspect-size-box__label">Table</span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.35rem',
        }}
      >
        <Button
          type="button"
          size="sm"
          variant="subtle"
          data-testid="inspect-site-table-add-row"
          onClick={() => runOp({ op: 'table_add_row', nodeId })}
        >
          <IconTableAddRow size={14} aria-hidden />
          Add row
        </Button>
        <Button
          type="button"
          size="sm"
          variant="subtle"
          data-testid="inspect-site-table-add-column"
          onClick={() => runOp({ op: 'table_add_column', nodeId })}
        >
          <IconTableAddColumn size={14} aria-hidden />
          Add column
        </Button>
        <Button
          type="button"
          size="sm"
          variant="subtle"
          data-testid="inspect-site-table-remove-row"
          onClick={() => runOp({ op: 'table_remove_row', nodeId })}
        >
          Remove last row
        </Button>
        <Button
          type="button"
          size="sm"
          variant="subtle"
          data-testid="inspect-site-table-remove-column"
          onClick={() => runOp({ op: 'table_remove_column', nodeId })}
        >
          Remove last column
        </Button>
      </div>
    </div>
  )
}
