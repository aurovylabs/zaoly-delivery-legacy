'use client'

import { useEffect, useRef } from 'react'
import type { FieldSize } from './Field'
import { Field } from './Field'
import { Input } from './Input'
import {
  clampColumns,
  DEFAULT_COLUMN_PRESETS,
  formatDigitalLengthFromStagePx,
  formatPrintLengthFromStagePx,
  gridPreviewPctForChannel,
  GRID_EDITOR_REFERENCE_MM,
  GRID_EDITOR_REFERENCE_PX,
  patchGridMetrics,
  stagePxFromPct,
  preferredDigitalUnit,
  type GridEditorChannel,
  type GridEditorMetrics,
} from '../lib/grid-editor'

export type GridEditorLabels = {
  columns: string
  gutter: string
  margin: string
  maxWidth: string
}

export type GridEditorProps = {
  value: GridEditorMetrics
  onChange: (next: GridEditorMetrics) => void
  channel?: GridEditorChannel
  labels?: GridEditorLabels
  columnPresets?: readonly number[]
  size?: FieldSize
  className?: string
  controlClassName?: string
  referenceWidthPx?: number
  referencePrintMm?: number
  'data-testid'?: string
}

type DragKind = 'margin' | 'gutter' | 'maxWidth'

const DEFAULT_LABELS: GridEditorLabels = {
  columns: 'Columns',
  gutter: 'Gutter',
  margin: 'Margin',
  maxWidth: 'Max width',
}

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function GridEditor({
  value,
  onChange,
  channel = 'digital',
  labels = DEFAULT_LABELS,
  columnPresets = DEFAULT_COLUMN_PRESETS,
  size = 'md',
  className,
  controlClassName,
  referenceWidthPx = GRID_EDITOR_REFERENCE_PX,
  referencePrintMm = GRID_EDITOR_REFERENCE_MM,
  'data-testid': testId,
}: GridEditorProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragKind | null>(null)
  const dragStartX = useRef(0)
  const dragStartPct = useRef(0)
  const valueRef = useRef(value)
  valueRef.current = value

  const columns = clampColumns(value.columns) ?? 0
  const displayColumns = columns > 0 ? columns : 12
  const pageWidthPct =
    gridPreviewPctForChannel(value.maxWidth, channel, referenceWidthPx, referencePrintMm) ||
    '100%'
  const marginPct =
    gridPreviewPctForChannel(value.margin, channel, referenceWidthPx, referencePrintMm) || '0%'
  const gutterPct =
    gridPreviewPctForChannel(value.gutter, channel, referenceWidthPx, referencePrintMm) ||
    undefined

  const tid = (suffix: string) => (testId ? `${testId}-${suffix}` : undefined)
  const digitalUnit = preferredDigitalUnit(value.gutter || value.margin || value.maxWidth)

  function apply(patch: Partial<GridEditorMetrics>) {
    onChange(patchGridMetrics(valueRef.current, patch))
  }

  function formatLengthFromStagePx(px: number, stageWidth: number): string {
    if (channel === 'print') {
      return formatPrintLengthFromStagePx(px, stageWidth, referencePrintMm)
    }
    return formatDigitalLengthFromStagePx(px, digitalUnit)
  }

  useEffect(() => {
    function stageWidth(): number {
      const rect = stageRef.current?.getBoundingClientRect()
      return rect?.width ?? referenceWidthPx
    }

    function onMove(e: PointerEvent) {
      const kind = dragRef.current
      if (!kind) return
      const width = stageWidth()
      if (width <= 0) return
      const deltaPx = e.clientX - dragStartX.current

      if (kind === 'margin') {
        const startMarginPx = stagePxFromPct(dragStartPct.current, width)
        const nextMarginPx = Math.max(0, startMarginPx + deltaPx)
        apply({ margin: formatLengthFromStagePx(nextMarginPx, width) })
        return
      }

      if (kind === 'gutter') {
        const startGutterPx = stagePxFromPct(dragStartPct.current, width)
        const nextGutterPx = Math.max(0, startGutterPx + deltaPx)
        apply({ gutter: formatLengthFromStagePx(nextGutterPx, width) })
        return
      }

      if (kind === 'maxWidth') {
        const startPagePx = stagePxFromPct(dragStartPct.current, width)
        const nextPagePx = Math.max(width * 0.25, Math.min(width, startPagePx + deltaPx))
        apply({ maxWidth: formatLengthFromStagePx(nextPagePx, width) })
      }
    }

    function onUp() {
      dragRef.current = null
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [channel, digitalUnit, referencePrintMm, referenceWidthPx])

  function startDrag(kind: DragKind, clientX: number, startPct: number, target: Element, pointerId: number) {
    dragRef.current = kind
    dragStartX.current = clientX
    dragStartPct.current = startPct
    target.setPointerCapture?.(pointerId)
  }

  const marginPctNum = parseFloat(marginPct) || 0
  const pageWidthPctNum = parseFloat(pageWidthPct) || 100
  const gutterPctNum = parseFloat(gutterPct || '0') || 0

  return (
    <div className={cx('ds-grid-editor', className)} data-testid={testId}>
      <div className="ds-grid-editor__toolbar">
        <div className="ds-grid-editor__presets" role="group" aria-label={labels.columns}>
          {columnPresets.map((preset) => (
            <button
              key={preset}
              type="button"
              className={cx(
                'ds-grid-editor__preset',
                columns === preset && 'ds-grid-editor__preset--active',
              )}
              onClick={() => apply({ columns: preset })}
              data-testid={tid(`preset-${preset}`)}
            >
              {preset}
            </button>
          ))}
        </div>
        <div className="ds-grid-editor__stepper">
          <button
            type="button"
            className="ds-grid-editor__step"
            aria-label="Fewer columns"
            disabled={displayColumns <= 1}
            onClick={() => apply({ columns: Math.max(1, displayColumns - 1) })}
            data-testid={tid('columns-dec')}
          >
            −
          </button>
          <span className="ds-grid-editor__step-value" data-testid={tid('columns-value')}>
            {columns || '—'}
          </span>
          <button
            type="button"
            className="ds-grid-editor__step"
            aria-label="More columns"
            disabled={displayColumns >= 24}
            onClick={() => apply({ columns: Math.min(24, displayColumns + 1) })}
            data-testid={tid('columns-inc')}
          >
            +
          </button>
        </div>
      </div>

      <div ref={stageRef} className="ds-grid-editor__stage" data-testid={tid('stage')}>
        <div
          className="ds-grid-editor__page"
          style={{ width: pageWidthPct, padding: marginPct }}
        >
          <div
            className="ds-grid-editor__columns"
            style={{ gap: gutterPct || undefined }}
            aria-hidden
          >
            {Array.from({ length: displayColumns }, (_, i) => (
              <div key={i} className="ds-grid-editor__col">
                {displayColumns <= 8 ? <span className="ds-grid-editor__col-fill" /> : null}
              </div>
            ))}
          </div>
          {displayColumns > 1 ? (
            <button
              type="button"
              className="ds-grid-editor__handle ds-grid-editor__handle--gutter"
              style={{ left: `calc(${marginPctNum}% + (100% - ${marginPctNum * 2}%) / ${displayColumns * 2})` }}
              aria-label={labels.gutter}
              data-testid={tid('handle-gutter')}
              onPointerDown={(e) => {
                e.preventDefault()
                startDrag('gutter', e.clientX, gutterPctNum, e.currentTarget, e.pointerId)
              }}
            />
          ) : null}
          <button
            type="button"
            className="ds-grid-editor__handle ds-grid-editor__handle--margin"
            style={{ left: marginPct }}
            aria-label={labels.margin}
            data-testid={tid('handle-margin')}
            onPointerDown={(e) => {
              e.preventDefault()
              startDrag('margin', e.clientX, marginPctNum, e.currentTarget, e.pointerId)
            }}
          />
          <button
            type="button"
            className="ds-grid-editor__handle ds-grid-editor__handle--max-width"
            style={{ left: `calc(${pageWidthPctNum}% - 4px)` }}
            aria-label={labels.maxWidth}
            data-testid={tid('handle-max-width')}
            onPointerDown={(e) => {
              e.preventDefault()
              startDrag('maxWidth', e.clientX, pageWidthPctNum, e.currentTarget, e.pointerId)
            }}
          />
        </div>
      </div>

      <div className="ds-grid-editor__fields">
        <Field label={labels.columns} size={size}>
          <Input
            size={size}
            block
            type="number"
            min={1}
            max={24}
            className={controlClassName}
            value={columns ? String(columns) : ''}
            onChange={(e) => {
              const raw = e.target.value.trim()
              if (!raw) {
                apply({ columns: undefined })
                return
              }
              apply({ columns: Number(raw) })
            }}
            data-testid={tid('columns-input')}
          />
        </Field>
        <Field label={labels.gutter} size={size}>
          <Input
            size={size}
            block
            className={controlClassName}
            value={value.gutter ?? ''}
            onChange={(e) => apply({ gutter: e.target.value || undefined })}
            placeholder={channel === 'print' ? '5mm' : '1.5rem'}
            data-testid={tid('gutter')}
          />
        </Field>
        <Field label={labels.margin} size={size}>
          <Input
            size={size}
            block
            className={controlClassName}
            value={value.margin ?? ''}
            onChange={(e) => apply({ margin: e.target.value || undefined })}
            placeholder={channel === 'print' ? '15mm' : '1rem'}
            data-testid={tid('margin')}
          />
        </Field>
        <Field label={labels.maxWidth} size={size}>
          <Input
            size={size}
            block
            className={controlClassName}
            value={value.maxWidth ?? ''}
            onChange={(e) => apply({ maxWidth: e.target.value || undefined })}
            placeholder={channel === 'print' ? '210mm' : '1200px'}
            data-testid={tid('max-width')}
          />
        </Field>
      </div>
    </div>
  )
}

export {
  patchGridMetrics,
  clampColumns,
  type GridEditorMetrics,
  type GridEditorChannel,
} from '../lib/grid-editor'
