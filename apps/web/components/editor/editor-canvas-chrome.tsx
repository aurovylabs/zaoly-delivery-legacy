'use client'

import { CanvasViewport, SelectionHandles } from '@zaoly/ui'
import type { CompositionScene, PrintPresetId, SceneNode, SceneOp } from '@zaoly/contracts'
import type { EditorBreakpoint } from '../../lib/scene/breakpoints'
import type { Bounds } from '../../lib/scene/selection'
import type { PaletteDropEdge } from '../../lib/scene/ops'
import { findSceneNode } from '../../lib/scene/ops'
import type { BrandTokenDragPayload } from '../../lib/inspect/token-drop'
import { SceneNodeView } from '../scene-node-view'
import { SceneBoardMinimap } from '../scene-board-minimap'
import { useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type RefObject } from 'react'
import type { ResizeHandle } from '../../lib/scene/resize'
import { useEditorCanvasCallbacks } from './use-editor-canvas-callbacks'
import { EditorSelectionSync } from './editor-selection-sync'
import { BreakpointCompareGhostSync } from './breakpoint-compare-ghost-sync'
import { useEditorSelectionHandleChrome } from './use-editor-selection-handle-chrome'
import { CanvasFloatingHud } from '../canvas-floating-hud'
import { HudPromoteProvider } from '../hud-promote-context'
import { useInteractiveState } from '../../lib/inspect/interactive-state-context'
import { mapOpsToInteractiveState } from '../../lib/inspect/map-ops-to-interactive-state'
import { cascadeNodeForState } from '../../lib/scene/state-cascade'
import type { SceneStateId } from '@zaoly/contracts'
import { CanvasDistanceGuides } from '../canvas-distance-guides'
import { CanvasBoxModelOverlay } from '../canvas-box-model-overlay'
import { CanvasCommentPins } from '../canvas-comment-pins'
import { CanvasDropIndicator, type CanvasDropIndicatorProps } from '../canvas-drop-indicator'
import { CanvasMultiplayerCursors } from '../canvas-multiplayer-cursors'
import { EditorMasterEditBar } from '../editor-master-edit-bar'
import { PrimaryBreakpointProvider } from '../../lib/scene/primary-breakpoint-context'
import { resolvePrimaryBreakpoint } from '../../lib/scene/primary-breakpoint'

export type EditorCanvasChromeProps = {
  viewportRef: RefObject<HTMLDivElement | null>
  sceneRef: RefObject<CompositionScene>
  editingMasterIdRef: RefObject<string | null>
  editingVariantIdRef: RefObject<string | null>
  layerDragIdRef: RefObject<string | null>
  panMode: boolean
  sceneBoardMode: boolean
  /** Wide board surface (scene pages or breakpoint compare) — layout CSS only. */
  boardSurfaceMode?: boolean
  /** Breakpoint compare mode — ghost selection on inactive tiles. */
  breakpointCompareMode?: boolean
  zoom: number
  panX: number
  panY: number
  artboardWidth: number
  viewportArtboardHeight: number
  artboardFill: string | undefined
  viewRoot: SceneNode
  selectedIds: string[]
  selectionBounds: Bounds | null
  primaryLocked: boolean
  marquee: Bounds | null
  scene: CompositionScene
  activePageId: string
  activeBreakpoint: EditorBreakpoint
  activePrintPreset?: PrintPresetId
  sceneDefaultArtboardWidth: number
  canvasShellSize: { width: number; height: number }
  frameDraggingPageId: string | null
  editingMasterId: string | null
  /** Master-Edit exit chrome — required when `editingMasterId` is set. */
  masterEditExit?: {
    masterName: string
    variantName?: string | null
    editingLabel: string
    exitLabel: string
    onExit: () => void
    variants?: { id: string; name: string }[]
    activeVariantId?: string | null
    onSelectVariant?: (variantId: string) => void
    /** Variants | Breakpoints | Matrix — bar SSOT. */
    boardDimension?: 'variants' | 'breakpoints' | 'matrix'
    onBoardDimensionChange?: (next: 'variants' | 'breakpoints' | 'matrix') => void
    dimensionVariantsLabel?: string
    dimensionBreakpointsLabel?: string
    dimensionMatrixLabel?: string
    breakpointsStructureTip?: string
  } | null
  onSelect: (
    id: string,
    mods?: { shiftKey?: boolean; metaKey?: boolean; ctrlKey?: boolean },
  ) => void
  onPaletteDrop: (type: string, targetId: string, edge: PaletteDropEdge) => void
  onTokenDrop: (payload: BrandTokenDragPayload, targetId: string) => void
  onCrossPageLayerDrop: (
    draggedId: string,
    toPageId: string,
    targetId?: string,
    position?: import('../../lib/scene/ops').LayerDropPosition,
  ) => void
  onCanvasPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void
  onCanvasPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => void
  endPan: (e: ReactPointerEvent<HTMLDivElement>) => void
  onCanvasContextMenu: (e: React.MouseEvent) => void
  onHandlePointerDown: (handle: ResizeHandle, event: ReactPointerEvent<HTMLSpanElement>) => void
  beginFrameDrag?: (pageId: string, event: ReactPointerEvent<HTMLElement>) => void
  activateBoardPage?: (pageId: string) => void
  runOp: (op: SceneOp) => void
  runOps?: (ops: SceneOp[]) => void
  workingRoot: (scene: CompositionScene) => SceneNode
  isNodeOrAncestorLocked: (root: SceneNode, id: string) => boolean
  findPageIdForNode: (scene: CompositionScene, nodeId: string) => string | undefined
  selectedNode: SceneNode | null
  /** Prefer expanded inspect subjects from workspace — do not re-find only on persisted tree. */
  selectedNodes?: SceneNode[]
  softLockHint?: string | null
  onHudAddPrimitive?: (type: string) => void
  onHudWrapStack?: () => void
  onHudWrapGrid?: () => void
  onHudUnwrap?: () => void
  onHudGroupSelection?: () => void
  onHudDuplicate?: () => void
  onHudDelete?: () => void
  onHudMoveLayer?: (delta: -1 | 1) => void
  onHudDetachMaster?: () => void
  onHudCreateMaster?: () => void
  onHudAlignSelected?: (alignment: import('../multi-align-toolbar').SpatialAlignment) => void
  onHudDistributeSelected?: (axis: import('../multi-align-toolbar').SpatialDistribution) => void
  onHudHostAction?: (action: import('../../lib/inspect/hud-quick-slots').HudHostActionId) => void
  brandPack?: import('../../lib/inspect/token-catalog').BrandTokenPackResponse | null
  onTokenSaved?: (token: import('../../lib/inspect/token-catalog').ZaolyPackLeaf) => void
  commentPinMode?: boolean
  onToggleCommentPinMode?: () => void
  onAddSpatialComment?: (comment: { pinX: number; pinY: number; body: string; author?: string }) => void
  onReplyComment?: (commentId: string, reply: { body: string; author?: string }) => void
  onToggleCommentResolve?: (commentId: string, resolved: boolean) => void
  onDeleteComment?: (commentId: string) => void
  presenceUsers?: import('@zaoly/contracts').ScenePresenceUser[]
  localUserId?: string
  onPresencePointerMove?: (clientX: number, clientY: number) => void
  onLocalViewportGesture?: () => void
  onMinimapPanDelta?: (dPanX: number, dPanY: number) => void
  onMinimapFitAll?: () => void
}

export function EditorCanvasChrome({
  viewportRef,
  sceneRef,
  editingMasterIdRef,
  editingVariantIdRef,
  layerDragIdRef,
  panMode,
  sceneBoardMode,
  boardSurfaceMode: boardSurfaceModeProp,
  breakpointCompareMode = false,
  zoom,
  panX,
  panY,
  artboardWidth,
  viewportArtboardHeight,
  artboardFill,
  viewRoot,
  selectedIds,
  selectionBounds,
  primaryLocked,
  marquee,
  scene,
  activePageId,
  activeBreakpoint,
  activePrintPreset,
  sceneDefaultArtboardWidth,
  canvasShellSize,
  frameDraggingPageId,
  editingMasterId,
  masterEditExit = null,
  onSelect,
  onPaletteDrop,
  onTokenDrop,
  onCrossPageLayerDrop,
  onCanvasPointerDown,
  onCanvasPointerMove,
  endPan,
  onCanvasContextMenu,
  onHandlePointerDown,
  beginFrameDrag,
  activateBoardPage,
  runOp,
  runOps,
  workingRoot,
  isNodeOrAncestorLocked,
  findPageIdForNode,
  selectedNode,
  selectedNodes: selectedNodesProp,
  softLockHint,
  onHudAddPrimitive,
  onHudWrapStack,
  onHudWrapGrid,
  onHudUnwrap,
  onHudGroupSelection,
  onHudDuplicate,
  onHudDelete,
  onHudMoveLayer,
  onHudDetachMaster,
  onHudCreateMaster,
  onHudAlignSelected,
  onHudDistributeSelected,
  onHudHostAction,
  brandPack = null,
  onTokenSaved,
  commentPinMode,
  onToggleCommentPinMode,
  onAddSpatialComment,
  onReplyComment,
  onToggleCommentResolve,
  onDeleteComment,
  presenceUsers = [],
  localUserId,
  onPresencePointerMove,
  onLocalViewportGesture,
  onMinimapPanDelta,
  onMinimapFitAll,
}: EditorCanvasChromeProps) {
  const boardSurfaceMode = boardSurfaceModeProp ?? sceneBoardMode
  const { activeState } = useInteractiveState()
  const canvasCallbacks = useEditorCanvasCallbacks({
    sceneRef,
    editingMasterIdRef,
    editingVariantIdRef,
    layerDragIdRef,
    workingRoot,
    isNodeOrAncestorLocked,
    findPageIdForNode,
    runOp,
    onPaletteDrop,
    onTokenDrop,
    onCrossPageLayerDrop,
  })
  const selectionHandleChrome = useEditorSelectionHandleChrome()
  const printChannel = activeBreakpoint === 'print'
  const [dropIndicator, setDropIndicator] = useState<CanvasDropIndicatorProps | null>(null)

  const hudSelectedBase =
    selectedNode ??
    (selectedIds[0] ? findSceneNode(scene, selectedIds[0], workingRoot(scene)) : null)
  const hudSelectedNode =
    hudSelectedBase && activeState !== 'default'
      ? (() => {
          const cascaded = cascadeNodeForState(hudSelectedBase, activeState as SceneStateId)
          return {
            ...hudSelectedBase,
            props: cascaded.props,
            tokenBindings: cascaded.tokenBindings,
            style: cascaded.style as SceneNode['style'],
          }
        })()
      : hudSelectedBase

  return (
    <div className="creation-editor-canvas-column">
      {editingMasterId && masterEditExit ? (
        <EditorMasterEditBar
          masterName={masterEditExit.masterName}
          variantName={masterEditExit.variantName}
          editingLabel={masterEditExit.editingLabel}
          exitLabel={masterEditExit.exitLabel}
          onExit={masterEditExit.onExit}
          variants={masterEditExit.variants}
          activeVariantId={masterEditExit.activeVariantId}
          onSelectVariant={masterEditExit.onSelectVariant}
          boardDimension={masterEditExit.boardDimension}
          onBoardDimensionChange={masterEditExit.onBoardDimensionChange}
          dimensionVariantsLabel={masterEditExit.dimensionVariantsLabel}
          dimensionBreakpointsLabel={masterEditExit.dimensionBreakpointsLabel}
          dimensionMatrixLabel={masterEditExit.dimensionMatrixLabel}
          breakpointsStructureTip={masterEditExit.breakpointsStructureTip}
        />
      ) : null}
      <div
        ref={viewportRef}
        onDragLeave={(e) => {
          if (e.clientX <= 0 || e.clientY <= 0) setDropIndicator(null)
        }}
        onDrop={() => setDropIndicator(null)}
        className={
          [
            'creation-editor-canvas-shell',
            panMode ? 'creation-editor-canvas-shell--pan' : '',
            boardSurfaceMode ? 'creation-editor-canvas-shell--board' : '',
            printChannel ? 'creation-editor-canvas-shell--print-channel' : '',
          ]
            .filter(Boolean)
            .join(' ')
        }
        data-print-channel={printChannel ? 'true' : undefined}
        data-print-preset={printChannel ? activePrintPreset : undefined}
        style={selectionHandleChrome as CSSProperties}
      >
        <CanvasViewport
          className={
            boardSurfaceMode
              ? 'creation-editor-canvas creation-editor-canvas--board'
              : 'creation-editor-canvas'
          }
          zoom={zoom}
          panX={panX}
          panY={panY}
          artboardWidth={artboardWidth}
          artboardHeight={viewportArtboardHeight}
          data-testid="creation-editor-canvas"
          data-artboard-width={artboardWidth}
          data-artboard-height={viewportArtboardHeight}
          onPointerDown={(e) => {
            onLocalViewportGesture?.()
            onCanvasPointerDown(e)
          }}
          onPointerMove={(e) => {
            onPresencePointerMove?.(e.clientX, e.clientY)
            onCanvasPointerMove(e)
          }}
          onPointerUp={endPan}
          onPointerCancel={endPan}
          onContextMenu={onCanvasContextMenu}
          overlays={
            <>
              <CanvasMultiplayerCursors
                users={presenceUsers}
                localUserId={localUserId}
                activePageId={activePageId}
                zoom={zoom}
                panX={panX}
                panY={panY}
              />
              <CanvasBoxModelOverlay
                selectedNode={selectedNode}
                selectedIds={selectedIds}
                selectionBounds={selectionBounds}
                zoom={zoom}
                brandPack={brandPack}
                viewportRef={viewportRef}
              />
              <SelectionHandles
                interactive={!primaryLocked && selectedIds.length === 1}
                visible={Boolean(selectionBounds)}
                left={selectionBounds?.left ?? 0}
                top={selectionBounds?.top ?? 0}
                width={selectionBounds?.width ?? 0}
                height={selectionBounds?.height ?? 0}
                onHandlePointerDown={onHandlePointerDown}
              />
              {marquee ? (
                <div
                  className="creation-editor-marquee"
                  data-testid="editor-marquee"
                  style={{
                    left: marquee.left,
                    top: marquee.top,
                    width: marquee.width,
                    height: marquee.height,
                  }}
                />
              ) : null}
            </>
          }
        >
          <div
            className={
              [
                boardSurfaceMode
                  ? 'creation-editor-canvas__pad creation-editor-canvas__pad--board'
                  : 'creation-editor-canvas__pad',
                printChannel ? 'creation-editor-canvas__pad--print-channel' : '',
              ]
                .filter(Boolean)
                .join(' ')
            }
            data-testid="creation-editor-artboard-pad"
            style={{
              padding: '1.25rem',
              ...(!boardSurfaceMode && artboardFill ? { backgroundColor: artboardFill } : null),
            }}
          >
            <EditorSelectionSync selectedIds={selectedIds} />
            <BreakpointCompareGhostSync
              enabled={breakpointCompareMode}
              selectedIds={selectedIds}
              activeBreakpoint={activeBreakpoint}
              matrixVariantId={
                masterEditExit?.boardDimension === 'matrix'
                  ? masterEditExit.activeVariantId ?? null
                  : null
              }
            />
            <div
              className="creation-editor-canvas__board-host"
              style={{
                position: 'relative',
                width: '100%',
                height: boardSurfaceMode ? '100%' : undefined,
              }}
            >
              <PrimaryBreakpointProvider primary={resolvePrimaryBreakpoint(scene)}>
                <SceneNodeView
                  node={viewRoot}
                  onSelect={onSelect}
                  onPaletteDrop={onPaletteDrop}
                  onTokenDrop={onTokenDrop}
                  evaluateTokenDrop={canvasCallbacks.evaluateTokenDrop}
                  onLayerPanelDrop={canvasCallbacks.onLayerPanelDrop}
                  onLayerPanelDropToPage={canvasCallbacks.onLayerPanelDropToPage}
                  enableCanvasNodeDrag={!editingMasterId && !panMode}
                  onBoardFramePointerDown={sceneBoardMode ? beginFrameDrag : undefined}
                  onBoardFrameActivate={sceneBoardMode ? activateBoardPage : undefined}
                  boardFrameDragBlocked={panMode}
                  boardFrameDraggingPageId={frameDraggingPageId}
                  evaluatePaletteDrop={canvasCallbacks.evaluatePaletteDrop}
                  evaluateLayerDrop={canvasCallbacks.evaluateLayerDrop}
                  evaluateLayerDropToPage={canvasCallbacks.evaluateLayerDropToPage}
                  onLayerDragStart={canvasCallbacks.onLayerDragStart}
                  onLayerDragEnd={canvasCallbacks.onLayerDragEnd}
                  onSetProp={canvasCallbacks.onSetProp}
                  activeBreakpoint={activeBreakpoint}
                  onDropIndicatorChange={setDropIndicator}
                />
              </PrimaryBreakpointProvider>
              {/* Inside artboard transform so client-share + designer pins stick under pan/zoom. */}
              <CanvasCommentPins
                comments={scene.comments}
                zoom={zoom}
                pinMode={commentPinMode ?? false}
                onTogglePinMode={onToggleCommentPinMode ?? (() => undefined)}
                onAddComment={onAddSpatialComment ?? (() => undefined)}
                onReplyComment={onReplyComment ?? (() => undefined)}
                onToggleResolve={onToggleCommentResolve ?? (() => undefined)}
                onDeleteComment={onDeleteComment ?? (() => undefined)}
              />
            </div>
          </div>
        </CanvasViewport>
        {sceneBoardMode ? (
          <SceneBoardMinimap
            scene={scene}
            activePageId={activePageId}
            defaultArtboardWidth={sceneDefaultArtboardWidth}
            defaultArtboardHeight={viewportArtboardHeight}
            zoom={zoom}
            panX={panX}
            panY={panY}
            viewportWidth={canvasShellSize.width}
            viewportHeight={canvasShellSize.height}
            onActivatePage={activateBoardPage ?? (() => undefined)}
            onPanDelta={onMinimapPanDelta}
            onFitAll={onMinimapFitAll}
          />
        ) : null}
        <CanvasDropIndicator
          visible={Boolean(dropIndicator?.visible)}
          edge={dropIndicator?.edge ?? null}
          direction={dropIndicator?.direction}
          rect={dropIndicator?.rect ?? null}
          label={dropIndicator?.label}
        />
        <CanvasDistanceGuides
          viewportRef={viewportRef}
          selectedId={selectedIds[0] ?? null}
          selectedBounds={selectionBounds}
          zoom={zoom}
        />
      </div>
      <HudPromoteProvider
        brandPack={brandPack}
        selectedNode={hudSelectedNode}
        onOps={(ops) => {
          const mapped = mapOpsToInteractiveState(ops, activeState as SceneStateId)
          if (!mapped.length) return
          if (runOps) runOps(mapped)
          else mapped.forEach((op) => runOp(op))
        }}
        onTokenSaved={onTokenSaved}
      >
        <CanvasFloatingHud
          selectedNode={hudSelectedNode}
          selectedIds={selectedIds}
          selectedNodes={
            selectedNodesProp ??
            selectedIds
              .map((id) => findSceneNode(scene, id, workingRoot(scene)))
              .filter((n): n is SceneNode => Boolean(n))
          }
          workingRootId={workingRoot(scene).id}
          softLocked={Boolean(softLockHint)}
          pseudoState={activeState}
          isMasterInstance={Boolean(
            selectedNode &&
              (selectedNode.type === 'Instance' || selectedNode.instanceOf),
          )}
          onAddPrimitive={onHudAddPrimitive ?? (() => undefined)}
          onWrapStack={onHudWrapStack ?? (() => undefined)}
          onWrapGrid={onHudWrapGrid ?? (() => undefined)}
          onUnwrap={onHudUnwrap}
          onGroupSelection={onHudGroupSelection}
          onDuplicate={onHudDuplicate ?? (() => undefined)}
          onDelete={onHudDelete ?? (() => undefined)}
          onMoveLayer={onHudMoveLayer ?? (() => undefined)}
          onDetachMaster={onHudDetachMaster}
          onCreateMaster={onHudCreateMaster}
          selectedCount={selectedIds.length}
          onAlignSelected={onHudAlignSelected}
          onDistributeSelected={onHudDistributeSelected}
          onHudOps={(ops) => {
            const mapped = mapOpsToInteractiveState(ops, activeState as SceneStateId)
            if (!mapped.length) return
            if (runOps) runOps(mapped)
            else mapped.forEach((op) => runOp(op))
          }}
          onHudHostAction={onHudHostAction}
        />
      </HudPromoteProvider>
    </div>
  )
}
