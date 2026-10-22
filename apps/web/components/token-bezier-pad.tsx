'use client'

import React, { useRef, useState } from 'react'
import { Chip, Input } from '../lib/zaoly-ui'
import {
  bezierPathD,
  clampBezier,
  DEFAULT_BEZIER,
  EASING_PRESETS,
  formatCubicBezier,
  matchingPresetId,
  parseCubicBezier,
  type CubicBezier,
} from '../lib/tokens/cubic-bezier'

const VIEW = 100
const PAD = 12
const INNER = VIEW - PAD * 2

type TokenBezierPadProps = {
  value: string
  onChange: (next: string) => void
  disabled?: boolean
  onEnter: (event: React.KeyboardEvent) => void
  t: (key: string) => string
  testId?: string
}

function unitToSvg(u: { x: number; y: number }): { x: number; y: number } {
  return {
    x: PAD + u.x * INNER,
    y: PAD + (1 - u.y) * INNER,
  }
}

function svgToUnit(sx: number, sy: number): { x: number; y: number } {
  return {
    x: (sx - PAD) / INNER,
    y: 1 - (sy - PAD) / INNER,
  }
}

/**
 * Interactive cubic-bezier pad for motion easing.
 * Spec: specs/domain/zaoly-token-studio.md
 */
export function TokenBezierPad({
  value,
  onChange,
  disabled = false,
  onEnter,
  t,
  testId = 'token-bezier-pad',
}: TokenBezierPadProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const dragRef = useRef<'p1' | 'p2' | null>(null)
  const [dragging, setDragging] = useState<'p1' | 'p2' | null>(null)

  const points = parseCubicBezier(value) ?? DEFAULT_BEZIER
  const activePreset = matchingPresetId(value)
  const p1 = unitToSvg({ x: points.x1, y: points.y1 })
  const p2 = unitToSvg({ x: points.x2, y: points.y2 })
  const start = unitToSvg({ x: 0, y: 0 })
  const end = unitToSvg({ x: 1, y: 1 })
  const curve = bezierPathD(points, INNER, PAD)

  function emit(next: CubicBezier) {
    onChange(formatCubicBezier(next))
  }

  function clientToSvg(clientX: number, clientY: number): { x: number; y: number } | null {
    const el = svgRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return null
    return {
      x: ((clientX - rect.left) / rect.width) * VIEW,
      y: ((clientY - rect.top) / rect.height) * VIEW,
    }
  }

  function applyHandle(which: 'p1' | 'p2', clientX: number, clientY: number) {
    const svg = clientToSvg(clientX, clientY)
    if (!svg) return
    const unit = svgToUnit(svg.x, svg.y)
    const next =
      which === 'p1'
        ? clampBezier({ ...points, x1: unit.x, y1: unit.y })
        : clampBezier({ ...points, x2: unit.x, y2: unit.y })
    emit(next)
  }

  function onPointerDown(which: 'p1' | 'p2', event: React.PointerEvent) {
    if (disabled) return
    event.preventDefault()
    event.stopPropagation()
    dragRef.current = which
    setDragging(which)
    ;(event.target as Element).setPointerCapture?.(event.pointerId)
    applyHandle(which, event.clientX, event.clientY)
  }

  function onPointerMove(event: React.PointerEvent) {
    const which = dragRef.current
    if (!which || disabled) return
    applyHandle(which, event.clientX, event.clientY)
  }

  function onPointerUp(event: React.PointerEvent) {
    if (!dragRef.current) return
    dragRef.current = null
    setDragging(null)
    try {
      ;(event.target as Element).releasePointerCapture?.(event.pointerId)
    } catch {
      /* already released */
    }
  }

  return (
    <div className="zaoly-token-studio__bezier" data-testid={testId}>
      <div className="zaoly-token-studio__bezier-presets" role="group" aria-label={t('tokens.easingPresets')}>
        {EASING_PRESETS.map((preset) => (
          <Chip
            key={preset.id}
            size="sm"
            selected={activePreset === preset.id}
            disabled={disabled}
            onClick={() => onChange(preset.css)}
          >
            {t(preset.labelKey)}
          </Chip>
        ))}
      </div>
      <svg
        ref={svgRef}
        className={
          dragging
            ? 'zaoly-token-studio__bezier-pad is-dragging'
            : 'zaoly-token-studio__bezier-pad'
        }
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        role="img"
        aria-label={t('tokens.easingPadAria')}
        data-testid="token-bezier-svg"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <rect
          className="zaoly-token-studio__bezier-frame"
          x={PAD}
          y={PAD}
          width={INNER}
          height={INNER}
        />
        <line
          className="zaoly-token-studio__bezier-diagonal"
          x1={start.x}
          y1={start.y}
          x2={end.x}
          y2={end.y}
        />
        <path className="zaoly-token-studio__bezier-curve" d={curve} fill="none" />
        <line className="zaoly-token-studio__bezier-arm" x1={start.x} y1={start.y} x2={p1.x} y2={p1.y} />
        <line className="zaoly-token-studio__bezier-arm" x1={end.x} y1={end.y} x2={p2.x} y2={p2.y} />
        <circle
          className={
            dragging === 'p1'
              ? 'zaoly-token-studio__bezier-handle is-active'
              : 'zaoly-token-studio__bezier-handle'
          }
          cx={p1.x}
          cy={p1.y}
          r={4.5}
          data-testid="token-bezier-p1"
          onPointerDown={(e) => onPointerDown('p1', e)}
        />
        <circle
          className={
            dragging === 'p2'
              ? 'zaoly-token-studio__bezier-handle is-active'
              : 'zaoly-token-studio__bezier-handle'
          }
          cx={p2.x}
          cy={p2.y}
          r={4.5}
          data-testid="token-bezier-p2"
          onPointerDown={(e) => onPointerDown('p2', e)}
        />
      </svg>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onEnter}
        disabled={disabled}
        aria-label={t('tokens.motionEasing')}
      />
    </div>
  )
}
