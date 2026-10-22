'use client'

import { useEffect, useRef } from 'react'
import type { FieldSize } from './Field'
import { Field } from './Field'
import { Input } from './Input'
import {
  breakpointDevicePct,
  breakpointPresetsForChannel,
  formatMinWidthFromStagePx,
  minWidthPxFromPct,
  preferredDigitalUnit,
  GRID_EDITOR_REFERENCE_MM,
  GRID_EDITOR_REFERENCE_PX,
  type BreakpointEditorChannel,
  type BreakpointPreset,
} from '../lib/breakpoint-editor'

export type BreakpointEditorLabels = {
  minWidth: string
}

export type BreakpointEditorProps = {
  value: string
  onChange: (next: string) => void
  channel?: BreakpointEditorChannel
  labels?: BreakpointEditorLabels
  presets?: BreakpointPreset[]
  size?: FieldSize
  className?: string
  controlClassName?: string
  referenceWidthPx?: number
  referencePrintMm?: number
  'data-testid'?: string
}

const DEFAULT_LABELS: BreakpointEditorLabels = {
  minWidth: 'Min width',
}

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function BreakpointEditor({
  value,
  onChange,
  channel = 'digital',
  labels = DEFAULT_LABELS,
  presets,
  size = 'md',
  className,
  controlClassName,
  referenceWidthPx = GRID_EDITOR_REFERENCE_PX,
  referencePrintMm = GRID_EDITOR_REFERENCE_MM,
  'data-testid': testId,
}: BreakpointEditorProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef(false)
  const dragStartX = useRef(0)
  const dragStartPct = useRef(0)
  const valueRef = useRef(value)
  valueRef.current = value

  const presetList = presets ?? breakpointPresetsForChannel(channel)
  const devicePct = breakpointDevicePct(value, channel, referenceWidthPx, referencePrintMm)
  const devicePctNum = parseFloat(devicePct) || 40
  const digitalUnit = preferredDigitalUnit(value)
  const tid = (suffix: string) => (testId ? `${testId}-${suffix}` : undefined)

  useEffect(() => {
    function stageWidth(): number {
      return stageRef.current?.getBoundingClientRect().width ?? referenceWidthPx
    }

    function onMove(e: PointerEvent) {
      if (!dragRef.current) return
      const width = stageWidth()
      if (width <= 0) return
      const deltaPx = e.clientX - dragStartX.current
      const startPx = minWidthPxFromPct(dragStartPct.current, width)
      const minDevicePx = width * 0.15
      const maxDevicePx = width * 0.95
      const nextPx = Math.min(maxDevicePx, Math.max(minDevicePx, startPx + deltaPx))
      onChange(
        formatMinWidthFromStagePx(nextPx, width, channel, digitalUnit, referencePrintMm),
      )
    }

    function onUp() {
      dragRef.current = false
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [channel, digitalUnit, onChange, referencePrintMm, referenceWidthPx])

  if (channel === 'print') {
    return (
      <div className={cx('ds-breakpoint-editor', className)} data-testid={testId}>
        <div className="ds-breakpoint-editor__presets" role="group" aria-label={labels.minWidth}>
          {presetList.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={cx(
                'ds-breakpoint-editor__preset',
                value === preset.value && 'ds-breakpoint-editor__preset--active',
              )}
              onClick={() => onChange(preset.value)}
              data-testid={tid(`preset-${preset.id}`)}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="ds-breakpoint-editor__stage ds-breakpoint-editor__stage--print">
          <div className="ds-breakpoint-editor__print-sheet">
            <span className="ds-breakpoint-editor__print-label">
              {value || '—'}
            </span>
          </div>
        </div>
        <Field label={labels.minWidth} size={size}>
          <Input
            size={size}
            block
            className={controlClassName}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          placeholder="148mm"
          data-testid={tid('min-width-input')}
          />
        </Field>
      </div>
    )
  }

  return (
    <div className={cx('ds-breakpoint-editor', className)} data-testid={testId}>
      <div className="ds-breakpoint-editor__presets" role="group" aria-label={labels.minWidth}>
        {presetList.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={cx(
              'ds-breakpoint-editor__preset',
              value === preset.value && 'ds-breakpoint-editor__preset--active',
            )}
            onClick={() => onChange(preset.value)}
            data-testid={tid(`preset-${preset.id}`)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div ref={stageRef} className="ds-breakpoint-editor__stage" data-testid={tid('stage')}>
        <div className="ds-breakpoint-editor__track" aria-hidden>
          <div
            className="ds-breakpoint-editor__device"
            style={{ width: devicePct }}
          >
            <div className="ds-breakpoint-editor__device-bar" />
            <div className="ds-breakpoint-editor__device-body">
              <span className="ds-breakpoint-editor__block ds-breakpoint-editor__block--hero" />
              <span className="ds-breakpoint-editor__cols">
                <span className="ds-breakpoint-editor__block" />
                <span className="ds-breakpoint-editor__block" />
              </span>
            </div>
          </div>
          <button
            type="button"
            className="ds-breakpoint-editor__handle"
            style={{ left: devicePct }}
            aria-label={labels.minWidth}
            data-testid={tid('handle')}
            onPointerDown={(e) => {
              e.preventDefault()
              dragRef.current = true
              dragStartX.current = e.clientX
              dragStartPct.current = devicePctNum
              e.currentTarget.setPointerCapture?.(e.pointerId)
            }}
          />
        </div>
        <p className="ds-breakpoint-editor__caption">
          ≥ {value || '—'}
        </p>
      </div>

      <Field label={labels.minWidth} size={size}>
        <Input
          size={size}
          block
          className={controlClassName}
          value={value}
          onChange={(e) => onChange(e.target.value)}
            placeholder="768px"
            data-testid={tid('min-width-input')}
        />
      </Field>
    </div>
  )
}

export type { BreakpointEditorChannel, BreakpointPreset } from '../lib/breakpoint-editor'
