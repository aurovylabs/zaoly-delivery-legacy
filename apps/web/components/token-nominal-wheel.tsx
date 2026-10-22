'use client'

import React, { useRef, useState } from 'react'
import {
  formatNominal,
  ladderIndexFromNumber,
  minEndlessIndex,
  numberFromLadderIndex,
  parseCssNumber,
  type NominalLadder,
} from '../lib/tokens/nominal-sliders'

const STEP_PX = 36
const VISIBLE_RADIUS = 4

type TokenNominalWheelProps = {
  label: string
  value: string
  ladder: NominalLadder
  disabled?: boolean
  onChange: (next: string) => void
  testId?: string
}

/**
 * Endless horizontal scale wheel: fixed center notch; drag moves the scale.
 * Continues past catalog ends via edge-gap steps (no wrap-to-zero).
 * Spec: specs/domain/zaoly-token-studio.md
 */
export function TokenNominalWheel({
  label,
  value,
  ladder,
  disabled = false,
  onChange,
  testId,
}: TokenNominalWheelProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const lastEmitted = useRef<number | null>(null)
  const grabRef = useRef<{ originX: number; originIndex: number } | null>(null)
  const [grabbing, setGrabbing] = useState(false)
  const [floatIndex, setFloatIndex] = useState<number | null>(null)

  const parsed = parseCssNumber(value)
  const numeric = parsed?.value ?? ladder.values[0]!
  const index = ladderIndexFromNumber(numeric, ladder)
  const len = ladder.values.length
  const minIndex = minEndlessIndex(ladder)
  const displayIndex = floatIndex ?? index
  const centerIndex = Math.max(minIndex, Math.round(displayIndex))
  const fraction = displayIndex - Math.round(displayIndex)

  function clampFloat(next: number): number {
    return Math.max(minIndex, next)
  }

  function emitIndex(nextIndex: number, opts?: { dedupe?: boolean }) {
    const clamped = Math.max(minIndex, Math.round(nextIndex))
    if (opts?.dedupe !== false && lastEmitted.current === clamped) return
    lastEmitted.current = clamped
    onChange(formatNominal(numberFromLadderIndex(clamped, ladder), ladder.unit))
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (disabled) return
    event.preventDefault()
    trackRef.current?.setPointerCapture?.(event.pointerId)
    lastEmitted.current = index
    grabRef.current = { originX: event.clientX, originIndex: index }
    setGrabbing(true)
    setFloatIndex(index)
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const grab = grabRef.current
    if (!grab || disabled) return
    // Drag scale to the right → lower values under the fixed notch
    const nextFloat = clampFloat(grab.originIndex - (event.clientX - grab.originX) / STEP_PX)
    setFloatIndex(nextFloat)
    emitIndex(Math.round(nextFloat))
  }

  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
    const grab = grabRef.current
    if (!grab) return
    const nextFloat = clampFloat(grab.originIndex - (event.clientX - grab.originX) / STEP_PX)
    emitIndex(Math.round(nextFloat))
    grabRef.current = null
    setGrabbing(false)
    setFloatIndex(null)
    lastEmitted.current = null
    try {
      trackRef.current?.releasePointerCapture?.(event.pointerId)
    } catch {
      /* already released */
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (disabled) return
    lastEmitted.current = null
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault()
      emitIndex(index - 1, { dedupe: false })
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault()
      emitIndex(index + 1, { dedupe: false })
    } else if (event.key === 'Home') {
      event.preventDefault()
      emitIndex(0, { dedupe: false })
    } else if (event.key === 'End') {
      event.preventDefault()
      emitIndex(len - 1, { dedupe: false })
    }
  }

  function onWheel(event: React.WheelEvent<HTMLDivElement>) {
    if (disabled) return
    event.preventDefault()
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
    if (delta === 0) return
    lastEmitted.current = null
    emitIndex(index + (delta > 0 ? 1 : -1), { dedupe: false })
  }

  const ticks = []
  for (let offset = -VISIBLE_RADIUS; offset <= VISIBLE_RADIUS; offset += 1) {
    const tickIndex = centerIndex + offset
    if (tickIndex < minIndex) continue
    const tickValue = numberFromLadderIndex(tickIndex, ladder)
    ticks.push({
      key: `${tickIndex}`,
      offset,
      label: formatNominal(tickValue, ladder.unit),
      active: offset === 0,
    })
  }

  return (
    <div
      ref={trackRef}
      className={grabbing ? 'zaoly-token-studio__wheel is-dragging' : 'zaoly-token-studio__wheel'}
      data-testid={testId}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-valuemin={ladder.values[0]}
      aria-valuenow={numberFromLadderIndex(centerIndex, ladder)}
      aria-valuetext={value}
      aria-disabled={disabled || undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
      onWheel={onWheel}
    >
      <div className="zaoly-token-studio__wheel-notch" aria-hidden />
      <div
        className="zaoly-token-studio__wheel-scale"
        style={{
          transform: `translateX(calc(-50% + ${-fraction * STEP_PX}px))`,
          ['--wheel-step' as string]: `${STEP_PX}px`,
        }}
        aria-hidden
      >
        {ticks.map((tick) => (
          <span
            key={tick.key}
            className={
              tick.active
                ? 'zaoly-token-studio__wheel-tick is-active'
                : 'zaoly-token-studio__wheel-tick'
            }
            style={{ ['--tick-offset' as string]: String(tick.offset) }}
          >
            <i className="zaoly-token-studio__wheel-mark" />
            <span className="zaoly-token-studio__wheel-label">{tick.label}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
