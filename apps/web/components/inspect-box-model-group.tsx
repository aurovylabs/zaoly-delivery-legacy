'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { IconBox as BoxSelect, IconCard as Square } from '../lib/zaoly-ui'
import type { InspectFieldDef } from '../lib/inspect/field-catalog'
import {
  boxModelGroupMode,
  readBoxExpanded,
  shouldAutoExpandBoxGroup,
  type BoxModelKind,
  writeBoxExpanded,
} from '../lib/inspect/box-model-groups'

type InspectBoxModelGroupProps = {
  kind: BoxModelKind
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

export function InspectBoxModelGroup({
  kind,
  fields,
  source,
  renderField,
  groupLabel,
  expandLabel,
  collapseLabel,
  mixedLabel,
}: InspectBoxModelGroupProps) {
  const mode = useMemo(() => boxModelGroupMode(source, kind), [source, kind])
  const [expanded, setExpanded] = useState(() => readBoxExpanded()[kind] === true)

  useEffect(() => {
    if (shouldAutoExpandBoxGroup(mode)) setExpanded(true)
  }, [mode, kind])

  if (!fields.length) return null

  function toggleExpanded() {
    const next = !expanded
    setExpanded(next)
    writeBoxExpanded(kind, next)
  }

  const uniformKey = kind === 'radius' ? 'radius' : kind
  const blockKey = kind === 'padding' ? 'paddingBlock' : kind === 'margin' ? 'marginBlock' : null
  const inlineKey =
    kind === 'padding' ? 'paddingInline' : kind === 'margin' ? 'marginInline' : null

  const uniformField = fieldByName(fields, uniformKey)
  const blockField = blockKey ? fieldByName(fields, blockKey) : undefined
  const inlineField = inlineKey ? fieldByName(fields, inlineKey) : undefined

  const sidePairs: Array<[InspectFieldDef, InspectFieldDef]> =
    kind === 'padding'
      ? [
          [fieldByName(fields, 'paddingTop'), fieldByName(fields, 'paddingBottom')],
          [fieldByName(fields, 'paddingLeft'), fieldByName(fields, 'paddingRight')],
        ].filter((pair): pair is [InspectFieldDef, InspectFieldDef] =>
          Boolean(pair[0] && pair[1]),
        )
      : kind === 'margin'
        ? [
            [fieldByName(fields, 'marginTop'), fieldByName(fields, 'marginBottom')],
            [fieldByName(fields, 'marginLeft'), fieldByName(fields, 'marginRight')],
          ].filter((pair): pair is [InspectFieldDef, InspectFieldDef] =>
            Boolean(pair[0] && pair[1]),
          )
        : [
            [fieldByName(fields, 'radiusTopLeft'), fieldByName(fields, 'radiusTopRight')],
            [fieldByName(fields, 'radiusBottomLeft'), fieldByName(fields, 'radiusBottomRight')],
          ].filter((pair): pair is [InspectFieldDef, InspectFieldDef] =>
            Boolean(pair[0] && pair[1]),
          )

  const showUniformCompact = kind !== 'radius' && mode === 'uniform' && uniformField
  const ExpandIcon = kind === 'radius' ? Square : BoxSelect

  return (
    <div
      className="creation-inspect-box-model"
      data-testid={`inspect-box-model-${kind}`}
      data-box-mode={mode}
      data-box-expanded={expanded ? 'true' : 'false'}
    >
      <div className="creation-inspect-box-model__header">
        <span className="creation-inspect-box-model__label">{groupLabel}</span>
        <button
          type="button"
          className="creation-inspect-box-model__expand"
          aria-expanded={expanded}
          aria-label={expanded ? collapseLabel : expandLabel}
          data-testid={`inspect-box-model-${kind}-toggle`}
          onClick={toggleExpanded}
        >
          <ExpandIcon size={14} aria-hidden="true" />
        </button>
      </div>

      {!expanded ? (
        <div className="creation-inspect-box-model__compact">
          {showUniformCompact ? (
            renderField(uniformField)
          ) : kind === 'radius' && uniformField ? (
            renderField(uniformField)
          ) : blockField && inlineField ? (
            <div className="creation-inspect-pair">
              {renderField(blockField)}
              {renderField(inlineField)}
            </div>
          ) : uniformField ? (
            renderField(uniformField)
          ) : null}
          {mode === 'mixed' ? (
            <p className="creation-inspect-box-model__mixed" data-testid={`inspect-box-model-${kind}-mixed`}>
              {mixedLabel}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="creation-inspect-box-model__expanded">
          {kind === 'radius' && uniformField ? renderField(uniformField) : null}
          {sidePairs.map(([left, right]) => (
            <div key={left.name} className="creation-inspect-pair">
              {renderField(left)}
              {renderField(right)}
            </div>
          ))}
          {mode === 'mixed' ? (
            <p className="creation-inspect-box-model__mixed" data-testid={`inspect-box-model-${kind}-mixed`}>
              {mixedLabel}
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}
