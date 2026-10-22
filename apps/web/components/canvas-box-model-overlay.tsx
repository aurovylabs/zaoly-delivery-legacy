'use client'

import { useLayoutEffect, useState, type RefObject } from 'react'
import type { SceneNode } from '@zaoly/contracts'
import {
  buildBoxModelBands,
  hasPositiveSides,
  measureOverlaySpacing,
  resolveNodeSpacingSides,
  scaleSides,
} from '../lib/editor/box-model-overlay-sides'
import type { BrandTokenPackResponse } from '../lib/inspect/token-catalog'
import { mergeLivePackIntoCatalog } from '../lib/inspect/token-catalog'
import type { Bounds } from '../lib/scene/selection'

export type CanvasBoxModelOverlayProps = {
  selectedNode: SceneNode | null
  selectedIds: string[]
  selectionBounds: Bounds | null
  zoom: number
  brandPack?: BrandTokenPackResponse | null
  /** Editor shell / viewport used for `measureNodeBounds` — query computed box model here. */
  viewportRef?: RefObject<HTMLElement | null>
}

export function CanvasBoxModelOverlay({
  selectedNode,
  selectedIds,
  selectionBounds,
  zoom,
  brandPack = null,
  viewportRef,
}: CanvasBoxModelOverlayProps) {
  const nodeId = selectedIds.length === 1 ? selectedIds[0] : null
  const [domSides, setDomSides] = useState<ReturnType<typeof measureOverlaySpacing>>(null)

  useLayoutEffect(() => {
    if (!nodeId || !selectionBounds) {
      setDomSides(null)
      return
    }
    const viewport = viewportRef?.current
    if (!viewport) {
      setDomSides(null)
      return
    }
    setDomSides(measureOverlaySpacing(viewport, nodeId, selectionBounds, zoom))
  }, [nodeId, selectionBounds, zoom, selectedNode, viewportRef])

  if (!selectedNode || !selectionBounds || !nodeId) return null

  const catalog = Array.isArray(brandPack?.tokens)
    ? mergeLivePackIntoCatalog(brandPack.tokens)
    : undefined

  const painted = resolveNodeSpacingSides(selectedNode, catalog)
  const paintedPadding = scaleSides(painted.padding, zoom)
  const paintedMargin = scaleSides(painted.margin, zoom)
  // Live zeros must not wipe the paint-pipeline fallback (Site Kit paintOnSelf hosts).
  const padding =
    domSides && hasPositiveSides(domSides.padding) ? domSides.padding : paintedPadding
  const margin =
    domSides && hasPositiveSides(domSides.margin) ? domSides.margin : paintedMargin
  if (!hasPositiveSides(padding) && !hasPositiveSides(margin)) return null

  // Prefer live paint border box so media host inflation cannot shift bands.
  const bandBounds = domSides?.borderBox ?? selectionBounds
  const bands = buildBoxModelBands(bandBounds, padding, margin)
  if (!bands.length) return null

  return (
    <div
      className="creation-box-model-overlay"
      data-testid="canvas-box-model-overlay"
      aria-hidden
    >
      {bands.map((band) => (
        <div
          key={band.id}
          className={`creation-box-model-band creation-box-model-band--${band.kind}`}
          data-testid={`canvas-box-model-band-${band.id}`}
          data-kind={band.kind}
          data-side={band.side}
          style={{
            left: band.left,
            top: band.top,
            width: band.width,
            height: band.height,
          }}
        />
      ))}
    </div>
  )
}
