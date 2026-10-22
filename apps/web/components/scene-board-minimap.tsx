'use client'

import { useMemo, useRef, useState, type PointerEvent } from 'react'
import type { CompositionScene } from '@zaoly/contracts'
import {
  buildBoardMinimapFrames,
  boardMinimapCameraWorldRect,
  boardMinimapFrameStyle,
  boardMinimapPanDeltaFromWorldDelta,
  boardMinimapViewportStyle,
  boardMinimapWorldDeltaFromPointerDelta,
  hitTestBoardMinimapFrame,
  hitTestBoardMinimapViewport,
  layoutBoardMinimap,
} from '../lib/scene/scene-board-minimap'
import { useUserPrefs } from '../lib/user-prefs'

type SceneBoardMinimapProps = {
  scene: CompositionScene
  activePageId: string
  defaultArtboardWidth: number
  defaultArtboardHeight: number
  zoom: number
  panX: number
  panY: number
  viewportWidth: number
  viewportHeight: number
  onActivatePage: (pageId: string) => void
  onPanDelta?: (dPanX: number, dPanY: number) => void
  onFitAll?: () => void
}

export function SceneBoardMinimap({
  scene,
  activePageId,
  defaultArtboardWidth,
  defaultArtboardHeight,
  zoom,
  panX,
  panY,
  viewportWidth,
  viewportHeight,
  onActivatePage,
  onPanDelta,
  onFitAll,
}: SceneBoardMinimapProps) {
  const { t } = useUserPrefs()
  const [hidden, setHidden] = useState(false)
  const dragRef = useRef<{ lastX: number; lastY: number } | null>(null)

  const frames = useMemo(
    () =>
      buildBoardMinimapFrames(
        scene,
        activePageId,
        defaultArtboardWidth,
        defaultArtboardHeight,
      ),
    [scene, activePageId, defaultArtboardWidth, defaultArtboardHeight],
  )
  const camera = useMemo(
    () =>
      boardMinimapCameraWorldRect({
        zoom,
        panX,
        panY,
        viewportWidth,
        viewportHeight,
      }),
    [zoom, panX, panY, viewportWidth, viewportHeight],
  )
  const layout = useMemo(
    () => layoutBoardMinimap(frames, 168, 112, camera),
    [frames, camera],
  )
  const viewportStyle = useMemo(
    () =>
      boardMinimapViewportStyle({
        layout,
        zoom,
        panX,
        panY,
        viewportWidth,
        viewportHeight,
      }),
    [layout, zoom, panX, panY, viewportWidth, viewportHeight],
  )

  if (frames.length < 2) return null
  if (hidden) {
    return (
      <button
        type="button"
        className="creation-scene-board-minimap creation-scene-board-minimap--collapsed"
        data-testid="scene-board-minimap-show"
        aria-label={t('editor.boardMinimapShow')}
        onClick={() => setHidden(false)}
      >
        {t('editor.boardMinimapRadar')}
      </button>
    )
  }

  function localPoint(e: PointerEvent<HTMLElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return
    const { x, y } = localPoint(e)
    if (
      onPanDelta &&
      hitTestBoardMinimapViewport(
        layout,
        zoom,
        panX,
        panY,
        viewportWidth,
        viewportHeight,
        x,
        y,
      )
    ) {
      dragRef.current = { lastX: e.clientX, lastY: e.clientY }
      e.currentTarget.setPointerCapture(e.pointerId)
      e.preventDefault()
      return
    }
    const pageId = hitTestBoardMinimapFrame(frames, layout, x, y)
    if (pageId) onActivatePage(pageId)
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!dragRef.current || !onPanDelta) return
    const dx = e.clientX - dragRef.current.lastX
    const dy = e.clientY - dragRef.current.lastY
    dragRef.current = { lastX: e.clientX, lastY: e.clientY }
    const world = boardMinimapWorldDeltaFromPointerDelta(dx, dy, layout)
    const pan = boardMinimapPanDeltaFromWorldDelta(world.worldDx, world.worldDy, zoom)
    onPanDelta(pan.dPanX, pan.dPanY)
  }

  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return
    dragRef.current = null
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  return (
    <div
      className="creation-scene-board-minimap"
      data-testid="scene-board-minimap"
      aria-label={t('editor.boardMinimap')}
      style={{ width: layout.width, height: layout.height + 22 }}
    >
      <div className="creation-scene-board-minimap__chrome" data-testid="scene-board-minimap-chrome">
        <span className="creation-scene-board-minimap__title">{t('editor.boardMinimapRadar')}</span>
        <span className="creation-scene-board-minimap__meta">{frames.length}P</span>
        <span className="creation-scene-board-minimap__spacer" />
        {onFitAll ? (
          <button
            type="button"
            className="creation-scene-board-minimap__btn"
            data-testid="scene-board-minimap-fit"
            aria-label={t('editor.fitAllFrames')}
            title={t('editor.fitAllFrames')}
            onClick={onFitAll}
          >
            {t('editor.boardMinimapFit')}
          </button>
        ) : null}
        <button
          type="button"
          className="creation-scene-board-minimap__btn"
          data-testid="scene-board-minimap-hide"
          aria-label={t('editor.boardMinimapHide')}
          title={t('editor.boardMinimapHide')}
          onClick={() => setHidden(true)}
        >
          ×
        </button>
      </div>
      <div
        className="creation-scene-board-minimap__stage"
        style={{ width: layout.width, height: layout.height }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {frames.map((frame) => {
          const style = boardMinimapFrameStyle(frame, layout)
          return (
            <div
              key={frame.pageId}
              className={
                frame.active
                  ? 'creation-scene-board-minimap__frame creation-scene-board-minimap__frame--active'
                  : 'creation-scene-board-minimap__frame'
              }
              title={frame.name}
              style={style}
            />
          )
        })}
        {viewportStyle ? (
          <div
            className="creation-scene-board-minimap__viewport"
            style={viewportStyle}
            data-testid="scene-board-minimap-viewport"
          />
        ) : null}
      </div>
    </div>
  )
}
