'use client'

import React, { useEffect, useState } from 'react'
import type { Bounds } from '../lib/scene/selection'

export type CanvasDistanceGuidesProps = {
  viewportRef: React.RefObject<HTMLDivElement | null>
  selectedId: string | null
  selectedBounds: Bounds | null
  zoom: number
}

type GuideLine = {
  id: string
  x: number
  y: number
  length: number
  isVertical: boolean
  distancePx: number
}

export function CanvasDistanceGuides({
  viewportRef,
  selectedId,
  selectedBounds,
  zoom,
}: CanvasDistanceGuidesProps) {
  const [altDown, setAltDown] = useState(false)
  const [hoveredBounds, setHoveredBounds] = useState<Bounds | null>(null)

  // Track Alt / Option key down & up
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Alt') setAltDown(true)
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.key === 'Alt') {
        setAltDown(false)
        setHoveredBounds(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  // Track mouse movement when Alt is pressed
  useEffect(() => {
    if (!altDown || !selectedId || !selectedBounds) {
      setHoveredBounds(null)
      return
    }

    const viewport = viewportRef.current
    if (!viewport) return

    function onPointerMove(e: PointerEvent) {
      const target = document.elementFromPoint(e.clientX, e.clientY)
      if (!target || !(target instanceof HTMLElement)) return

      const nodeEl = target.closest<HTMLElement>('[data-node-id]')
      const hoveredId = nodeEl?.getAttribute('data-node-id')

      if (!viewport || !nodeEl || !hoveredId || hoveredId === selectedId) {
        setHoveredBounds(null)
        return
      }

      const vr = viewport.getBoundingClientRect()
      const hr = nodeEl.getBoundingClientRect()
      setHoveredBounds({
        left: hr.left - vr.left,
        top: hr.top - vr.top,
        width: hr.width,
        height: hr.height,
      })
    }

    function onPointerLeave() {
      setHoveredBounds(null)
    }

    viewport.addEventListener('pointermove', onPointerMove)
    viewport.addEventListener('pointerleave', onPointerLeave)
    return () => {
      viewport.removeEventListener('pointermove', onPointerMove)
      viewport.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [altDown, selectedId, selectedBounds, viewportRef])

  if (!altDown || !selectedBounds || !hoveredBounds) return null

  const S = {
    left: selectedBounds.left,
    top: selectedBounds.top,
    right: selectedBounds.left + selectedBounds.width,
    bottom: selectedBounds.top + selectedBounds.height,
    width: selectedBounds.width,
    height: selectedBounds.height,
  }

  const H = {
    left: hoveredBounds.left,
    top: hoveredBounds.top,
    right: hoveredBounds.left + hoveredBounds.width,
    bottom: hoveredBounds.top + hoveredBounds.height,
    width: hoveredBounds.width,
    height: hoveredBounds.height,
  }

  const lines: GuideLine[] = []

  // 1. Horizontal distance
  if (H.left >= S.right) {
    // Hovered is to the right
    const len = H.left - S.right
    const cy = Math.max(Math.min(S.top + S.height / 2, H.bottom), H.top)
    lines.push({
      id: 'h-right',
      x: S.right,
      y: cy,
      length: len,
      isVertical: false,
      distancePx: Math.max(1, Math.round(len / zoom)),
    })
  } else if (S.left >= H.right) {
    // Hovered is to the left
    const len = S.left - H.right
    const cy = Math.max(Math.min(S.top + S.height / 2, H.bottom), H.top)
    lines.push({
      id: 'h-left',
      x: H.right,
      y: cy,
      length: len,
      isVertical: false,
      distancePx: Math.max(1, Math.round(len / zoom)),
    })
  }

  // 2. Vertical distance
  if (H.top >= S.bottom) {
    // Hovered is below
    const len = H.top - S.bottom
    const cx = Math.max(Math.min(S.left + S.width / 2, H.right), H.left)
    lines.push({
      id: 'v-bottom',
      x: cx,
      y: S.bottom,
      length: len,
      isVertical: true,
      distancePx: Math.max(1, Math.round(len / zoom)),
    })
  } else if (S.top >= H.bottom) {
    // Hovered is above
    const len = S.top - H.bottom
    const cx = Math.max(Math.min(S.left + S.width / 2, H.right), H.left)
    lines.push({
      id: 'v-top',
      x: cx,
      y: H.bottom,
      length: len,
      isVertical: true,
      distancePx: Math.max(1, Math.round(len / zoom)),
    })
  }

  // 3. Nested / Inside distance fallback (if overlapping)
  if (lines.length === 0) {
    // Inner Top
    const dTop = Math.abs(S.top - H.top)
    if (dTop > 1) {
      lines.push({
        id: 'inner-top',
        x: Math.max(S.left, H.left) + 10,
        y: Math.min(S.top, H.top),
        length: dTop,
        isVertical: true,
        distancePx: Math.max(1, Math.round(dTop / zoom)),
      })
    }
    // Inner Left
    const dLeft = Math.abs(S.left - H.left)
    if (dLeft > 1) {
      lines.push({
        id: 'inner-left',
        x: Math.min(S.left, H.left),
        y: Math.max(S.top, H.top) + 10,
        length: dLeft,
        isVertical: false,
        distancePx: Math.max(1, Math.round(dLeft / zoom)),
      })
    }
  }

  return (
    <div className="creation-distance-guides" data-testid="canvas-distance-guides" aria-hidden>
      {/* Target element highlight rect */}
      <div
        className="creation-distance-rect"
        style={{
          left: hoveredBounds.left,
          top: hoveredBounds.top,
          width: hoveredBounds.width,
          height: hoveredBounds.height,
        }}
      />

      {/* Measurement lines and distance pills */}
      {lines.map((line) => {
        const midX = line.isVertical ? line.x : line.x + line.length / 2
        const midY = line.isVertical ? line.y + line.length / 2 : line.y

        return (
          <React.Fragment key={line.id}>
            <div
              className={`creation-distance-line ${
                line.isVertical ? 'creation-distance-line--v' : 'creation-distance-line--h'
              }`}
              style={{
                left: line.x,
                top: line.y,
                ...(line.isVertical ? { height: line.length } : { width: line.length }),
              }}
            />
            <div
              className="creation-distance-pill"
              style={{
                left: midX,
                top: midY,
              }}
            >
              {line.distancePx}px
            </div>
          </React.Fragment>
        )
      })}
    </div>
  )
}
