'use client'

import { useEffect, useRef } from 'react'
import type { FieldSize } from './Field'
import { Field } from './Field'
import { Input } from './Input'
import {
  bezierTupleFromSvgPercent,
  cubicBezierSvgPath,
  defaultMaterialBezier,
  formatCubicBezier,
  parseCubicBezier,
  svgPercentFromBezierTuple,
  type CubicBezierTuple,
} from '../lib/easing-curve'

export type EasingCurveEditorLabels = {
  x1: string
  y1: string
  x2: string
  y2: string
}

export type EasingCurveEditorProps = {
  value: string
  onChange: (next: string) => void
  labels?: EasingCurveEditorLabels
  enableCustomLabel?: string
  size?: FieldSize
  className?: string
  controlClassName?: string
  'data-testid'?: string
}

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

function clampX(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.min(1, Math.max(0, n))
}

function patchTuple(current: CubicBezierTuple, index: 0 | 1 | 2 | 3, raw: string): CubicBezierTuple {
  const n = Number(raw)
  const next: CubicBezierTuple = [current[0], current[1], current[2], current[3]]
  if (index === 0 || index === 2) next[index] = clampX(n)
  else next[index] = Number.isFinite(n) ? n : current[index]
  return next
}

const DEFAULT_LABELS: EasingCurveEditorLabels = {
  x1: 'x1',
  y1: 'y1',
  x2: 'x2',
  y2: 'y2',
}

function BezierChart({
  tuple,
  onChange,
}: {
  tuple: CubicBezierTuple
  onChange: (next: CubicBezierTuple) => void
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const dragHandle = useRef<0 | 1 | null>(null)
  const tupleRef = useRef(tuple)
  tupleRef.current = tuple
  const { cp1, cp2 } = svgPercentFromBezierTuple(tuple)

  useEffect(() => {
    function pointFromClient(clientX: number, clientY: number) {
      const svg = svgRef.current
      if (!svg) return null
      const rect = svg.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return null
      const sx = ((clientX - rect.left) / rect.width) * 100
      const sy = ((clientY - rect.top) / rect.height) * 100
      return bezierTupleFromSvgPercent(sx, sy)
    }

    function onMove(e: PointerEvent) {
      const handle = dragHandle.current
      if (handle == null) return
      const pt = pointFromClient(e.clientX, e.clientY)
      if (!pt) return
      const current = tupleRef.current
      const next = [...current] as CubicBezierTuple
      if (handle === 0) {
        next[0] = pt.x
        next[1] = pt.y
      } else {
        next[2] = pt.x
        next[3] = pt.y
      }
      onChange(next)
    }

    function onUp() {
      dragHandle.current = null
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [onChange])

  return (
    <svg
      ref={svgRef}
      className="ds-easing-curve-editor__chart"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <line x1="0" y1="100" x2="100" y2="0" className="ds-easing-curve-editor__diagonal" />
      <path d={cubicBezierSvgPath(tuple)} className="ds-easing-curve-editor__curve" />
      <circle
        cx={cp1.cx}
        cy={cp1.cy}
        r="6"
        className="ds-easing-curve-editor__handle ds-easing-curve-editor__handle--interactive"
        onPointerDown={(e) => {
          e.preventDefault()
          dragHandle.current = 0
          ;(e.target as Element).setPointerCapture?.(e.pointerId)
        }}
      />
      <circle
        cx={cp2.cx}
        cy={cp2.cy}
        r="6"
        className="ds-easing-curve-editor__handle ds-easing-curve-editor__handle--interactive"
        onPointerDown={(e) => {
          e.preventDefault()
          dragHandle.current = 1
          ;(e.target as Element).setPointerCapture?.(e.pointerId)
        }}
      />
    </svg>
  )
}

/** Interactive cubic-bezier editor — chart + drag handles + numeric fields. */
export function EasingCurveEditor({
  value,
  onChange,
  labels = DEFAULT_LABELS,
  enableCustomLabel = 'Use custom cubic-bezier',
  size = 'md',
  className,
  controlClassName,
  'data-testid': testId,
}: EasingCurveEditorProps) {
  const parsed = parseCubicBezier(value)
  const tuple = parsed ?? defaultMaterialBezier()
  const tid = (suffix: string) => (testId ? `${testId}-${suffix}` : undefined)

  function applyTuple(next: CubicBezierTuple) {
    onChange(formatCubicBezier(next))
  }

  if (!parsed) {
    return (
      <div className={cx('ds-easing-curve-editor', className)} data-testid={testId}>
        <button
          type="button"
          className="ds-easing-curve-editor__switch"
          onClick={() => applyTuple(defaultMaterialBezier())}
          data-testid={tid('enable')}
        >
          {enableCustomLabel}
        </button>
      </div>
    )
  }

  const keys = ['x1', 'y1', 'x2', 'y2'] as const

  return (
    <div className={cx('ds-easing-curve-editor', className)} data-testid={testId}>
      <BezierChart tuple={tuple} onChange={applyTuple} />
      <div className="ds-easing-curve-editor__grid">
        {keys.map((key, index) => {
          const handle = index as 0 | 1 | 2 | 3
          return (
            <Field key={key} label={labels[key]} size={size}>
              <Input
                size={size}
                block
                type="number"
                step={0.01}
                className={controlClassName}
                value={String(tuple[handle])}
                onChange={(e) => applyTuple(patchTuple(tuple, handle, e.target.value))}
                aria-label={labels[key]}
                data-testid={tid(key)}
              />
            </Field>
          )
        })}
      </div>
    </div>
  )
}

export {
  parseCubicBezier,
  formatCubicBezier,
  defaultMaterialBezier,
  type CubicBezierTuple,
} from '../lib/easing-curve'
