'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { IconMaximize as Maximize2 } from '../lib/zaoly-ui'
import type { InspectFieldDef } from '../lib/inspect/field-catalog'
import {
  constraintsSummaryBadge,
  readSizeExpanded,
  shouldAutoExpandSizeBox,
  writeSizeExpanded,
  type SizeBoxSource,
} from '../lib/inspect/size-box-groups'
import { SizeModeGlyph, sizeModeGlyphId } from './inspect-mode-glyphs'

type InspectSizeBoxGroupProps = {
  fields: InspectFieldDef[]
  source: SizeBoxSource
  renderField: (field: InspectFieldDef) => ReactNode
  groupLabel: string
  expandLabel: string
  collapseLabel: string
  hugLabel?: string
  fillLabel?: string
  fixedLabel?: string
  onSetDimension?: (dimension: 'width' | 'height', mode: 'hug' | 'fill' | 'fixed') => void
}

function fieldByName(fields: InspectFieldDef[], name: string): InspectFieldDef | undefined {
  return fields.find((field) => field.name === name)
}

export function InspectSizeBoxGroup({
  fields,
  source,
  renderField,
  groupLabel,
  expandLabel,
  collapseLabel,
  hugLabel = 'Hug',
  fillLabel = 'Fill',
  fixedLabel = 'Fixed',
  onSetDimension,
}: InspectSizeBoxGroupProps) {
  const MODE_LABEL: Record<'hug' | 'fill' | 'fixed', string> = {
    hug: hugLabel,
    fill: fillLabel,
    fixed: fixedLabel,
  }
  const summary = useMemo(() => constraintsSummaryBadge(source), [source])
  const [expanded, setExpanded] = useState(() => readSizeExpanded())

  useEffect(() => {
    if (shouldAutoExpandSizeBox(source)) setExpanded(true)
  }, [source])

  if (!fields.length) return null

  function toggleExpanded() {
    const next = !expanded
    setExpanded(next)
    writeSizeExpanded(next)
  }

  const widthField = fieldByName(fields, 'width')
  const heightField = fieldByName(fields, 'height')
  const minWidthField = fieldByName(fields, 'minWidth')
  const maxWidthField = fieldByName(fields, 'maxWidth')
  const minHeightField = fieldByName(fields, 'minHeight')
  const maxHeightField = fieldByName(fields, 'maxHeight')

  const currentWidth = String(source.props?.width ?? '')
  const currentHeight = String(source.props?.height ?? '')

  const widthMode =
    !currentWidth || currentWidth === 'fit-content' || currentWidth === 'auto'
      ? 'hug'
      : currentWidth === '100%' || currentWidth === '1fr'
        ? 'fill'
        : 'fixed'

  const heightMode =
    !currentHeight || currentHeight === 'fit-content' || currentHeight === 'auto'
      ? 'hug'
      : currentHeight === '100%' || currentHeight === '1fr'
        ? 'fill'
        : 'fixed'

  const renderPills = () => (
    <div className="creation-inspect-size-modes">
      {([
        ['width', 'W', widthMode],
        ['height', 'H', heightMode],
      ] as const).map(([dimension, label, activeMode]) => (
        <div key={dimension} className="creation-inspect-size-modes__row">
          <span className="creation-inspect-size-modes__axis">{label}</span>
          <div className="creation-inspect-size-modes__chips" role="group" aria-label={`${label} sizing`}>
            {(['hug', 'fill', 'fixed'] as const).map((mode) => {
              const isActive = activeMode === mode
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onSetDimension?.(dimension, mode)}
                  data-testid={`inspect-dimension-${dimension}-${mode}`}
                  className={`creation-inspect-size-mode-btn${isActive ? ' is-active' : ''}`}
                  aria-pressed={isActive}
                  title={`${label}: ${MODE_LABEL[mode]}`}
                >
                  <SizeModeGlyph id={sizeModeGlyphId(mode)} axis={dimension} />
                  <span className="creation-inspect-size-mode-btn__label">{MODE_LABEL[mode]}</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )

  const whPair =
    widthField && heightField ? (
      <div className="creation-inspect-pair">
        {renderField(widthField)}
        {renderField(heightField)}
      </div>
    ) : null

  return (
    <div
      className="creation-inspect-size-box"
      data-testid="inspect-size-box-group"
      data-size-expanded={expanded ? 'true' : 'false'}
    >
      <div className="creation-inspect-size-box__header">
        <span className="creation-inspect-size-box__label">{groupLabel}</span>
        <span
          className="creation-inspect-size-box__summary"
          data-testid="inspect-constraints-summary"
          title="Empty size = Hug contents; bound size token = Fixed"
        >
          {summary}
        </span>
        <button
          type="button"
          className="creation-inspect-size-box__expand"
          aria-expanded={expanded}
          aria-label={expanded ? collapseLabel : expandLabel}
          data-testid="inspect-size-box-toggle"
          onClick={toggleExpanded}
        >
          <Maximize2 size={14} aria-hidden="true" />
        </button>
      </div>

      {!expanded ? (
        <div className="creation-inspect-size-box__compact">
          {renderPills()}
          {whPair}
        </div>
      ) : (
        <div className="creation-inspect-size-box__expanded">
          {renderPills()}
          {whPair}
          {minWidthField && maxWidthField ? (
            <div className="creation-inspect-pair">
              {renderField(minWidthField)}
              {renderField(maxWidthField)}
            </div>
          ) : null}
          {minHeightField && maxHeightField ? (
            <div className="creation-inspect-pair">
              {renderField(minHeightField)}
              {renderField(maxHeightField)}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
