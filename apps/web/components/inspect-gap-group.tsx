'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { InspectFieldDef } from '../lib/inspect/field-catalog'
import {
  gapGroupMode,
  readGapExpanded,
  shouldAutoExpandGapGroup,
  writeGapExpanded,
} from '../lib/inspect/gap-groups'
import { GapAxisGlyph } from './inspect-mode-glyphs'

type InspectGapGroupProps = {
  fields: InspectFieldDef[]
  source: { props?: Record<string, unknown>; tokenBindings?: Record<string, string> }
  renderField: (field: InspectFieldDef) => ReactNode
  groupLabel: string
  expandLabel: string
  collapseLabel: string
  mixedLabel: string
}

function fieldByName(fields: InspectFieldDef[], name: string): InspectFieldDef | undefined {
  return fields.find((field) => field.name === name)
}

export function InspectGapGroup({
  fields,
  source,
  renderField,
  groupLabel,
  expandLabel,
  collapseLabel,
  mixedLabel,
}: InspectGapGroupProps) {
  const mode = useMemo(() => gapGroupMode(source), [source])
  const [expanded, setExpanded] = useState(() => readGapExpanded())

  useEffect(() => {
    if (shouldAutoExpandGapGroup(mode)) setExpanded(true)
  }, [mode])

  if (!fields.length) return null

  function toggleExpanded() {
    const next = !expanded
    setExpanded(next)
    writeGapExpanded(next)
  }

  const uniformField = fieldByName(fields, 'gap')
  const rowField = fieldByName(fields, 'rowGap')
  const columnField = fieldByName(fields, 'columnGap')

  return (
    <div
      className="creation-inspect-gap"
      data-testid="inspect-gap-group"
      data-gap-mode={mode}
      data-gap-expanded={expanded ? 'true' : 'false'}
    >
      <div className="creation-inspect-gap__header">
        <span className="creation-inspect-gap__label">{groupLabel}</span>
        <button
          type="button"
          className={`creation-inspect-gap__expand${expanded ? ' is-active' : ''}`}
          aria-expanded={expanded}
          aria-label={expanded ? collapseLabel : expandLabel}
          data-testid="inspect-gap-toggle"
          onClick={toggleExpanded}
        >
          <GapAxisGlyph id="both" />
        </button>
      </div>

      {!expanded ? (
        <div className="creation-inspect-gap__compact">
          {uniformField ? renderField(uniformField) : null}
          {mode === 'mixed' ? (
            <p className="creation-inspect-gap__mixed" data-testid="inspect-gap-mixed">
              {mixedLabel}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="creation-inspect-gap__expanded">
          {uniformField ? renderField(uniformField) : null}
          {rowField && columnField ? (
            <div className="creation-inspect-pair">
              <div className="creation-inspect-gap__axis" data-gap-axis="row">
                <span className="creation-inspect-gap__axis-glyph" aria-hidden="true">
                  <GapAxisGlyph id="row" />
                </span>
                {renderField(rowField)}
              </div>
              <div className="creation-inspect-gap__axis" data-gap-axis="column">
                <span className="creation-inspect-gap__axis-glyph" aria-hidden="true">
                  <GapAxisGlyph id="column" />
                </span>
                {renderField(columnField)}
              </div>
            </div>
          ) : (
            <>
              {rowField ? renderField(rowField) : null}
              {columnField ? renderField(columnField) : null}
            </>
          )}
          {mode === 'mixed' ? (
            <p className="creation-inspect-gap__mixed" data-testid="inspect-gap-mixed">
              {mixedLabel}
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}
