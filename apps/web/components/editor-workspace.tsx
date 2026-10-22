'use client'

import { createPortal } from 'react-dom'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CompositionScene } from '@zaoly/contracts'
import { Button, ComponentPalette, ContextMenu, Hint, Input, Text } from '@zaoly/ui'
import { measureNodeBounds } from './editor/editor-boot'
import {
  planSpatialAlignOps,
  planSpatialDistributeOps,
  type SpatialAlignment,
  type SpatialDistribution,
  type NodeSpatialBox,
} from '../lib/scene/spatial-align'
import { resolveMasterVariant } from '../lib/scene/master-variants'
import {
  addCommentReply,
  addSceneComment,
  commentsForNode,
  removeSceneComment,
  setCommentResolved,
  withPrunedComments,
} from '../lib/scene-comments'
import { postProjectedShareThreadMirror } from '../lib/client-page-share/post-projected-thread-mirror'
import { TokenCatalogProvider } from '../lib/inspect/token-catalog-context'
import { CollectionDataProvider } from '../lib/collection-data/collection-data-context'
import { InteractiveStateProvider } from '../lib/inspect/interactive-state-context'
import { useTopbarTrailHost } from './topbar-trail-host'
import { EditorTokenStudio } from './editor-token-studio'
import { EditorCommentsPanel } from './editor-comments-panel'
import { EditorHtmlPreviewDialog } from './editor-html-preview-dialog'
import { EditorCodeExportDialog } from './editor-code-export-dialog'
import { EditorClientShareDialog } from './editor-client-share-dialog'
import { EditorSceneShareDialog } from './editor-scene-share-dialog'
import { EditorStorybookDialog } from './editor/editor-storybook-dialog'
import { EditorAssetLibraryDialog, type AssetLibraryTargetMode } from './editor-asset-library-dialog'
import { VIDEON_MEDIA_REF_PROP } from '../lib/videon/videon-media-ref'
import { TopbarPresenceStack } from './topbar-presence-stack'
import { PresenceActivityRibbon } from './presence-activity-ribbon'
import { buildPresenceActivityChips } from '../lib/editor/presence-activity'
import { softLockSelectionPreview } from '../lib/editor/presence-soft-lock-preview'
import { useEditorPresence } from '../lib/editor/use-editor-presence'
import { EditorHistoryDrawer } from './editor-history-drawer'
import { EditorSaveCheckpointDialog } from './editor-save-checkpoint-dialog'
import { EditorKitDriftBanner } from './editor-kit-drift-banner'
import { EditorLinterPanel } from './editor-linter-panel'
import { ChartStudioPanel } from './chart-studio/chart-studio-panel'
import { useChartStudioOpen } from './chart-studio/use-chart-studio-open'
import { simulateNodeTreeI18n } from '../lib/scene/i18n-simulator'
import { EditorInspector } from './editor-inspector'
import { EditorPageFrameInspector } from './editor-page-frame-inspector'
import { EditorLayers } from './editor-layers'
import { EditorMastersPanel } from './editor-masters'
import { EditorMasterEditBar } from './editor-master-edit-bar'
import { EditorPagesList } from './editor-pages-list'
import { EditorAddPageDialog } from './editor-add-page-dialog'
import { useEditorSceneState } from './editor/use-editor-scene-state'
import { useKitDrift } from './editor/use-kit-drift'
import {
  EditorPanelDockLayout,
  EditorPanelRail,
  useEditorPanelChrome,
} from './editor/editor-panel-chrome'
import { EditorFallbackToolbar, EditorTopbarChrome } from './editor/editor-toolbar'
import { EditorCanvasChrome } from './editor/editor-canvas-chrome'
import { paths } from '../lib/paths'
import {
  buildOnboardingSampleScene,
  countActivePageChildren,
  dispatchCompositionChanged,
  dispatchOnboardingAction,
} from '../lib/editor/onboarding'
import { OnboardingHost } from './editor/onboarding/OnboardingHost'
import {
  claimEditorInsertOnce,
  stripEditorHintFromLocation,
  stripEditorInsertTypeFromLocation,
} from '../lib/editor-insert-once'

export function EditorWorkspace({
  initialScene,
  initialInsertType = null,
  initialHint = null,
}: {
  initialScene: CompositionScene
  /** One-shot palette hydrate from Kit Playground (`paths.editorInsertTypeQueryParam`). */
  initialInsertType?: string | null
  /** Optional UX tip (`paths.editorHintSavePattern`). */
  initialHint?: string | null
}) {
  const topbarTrailHost = useTopbarTrailHost()
  const [assetLibraryOpen, setAssetLibraryOpen] = useState(false)
  const [assetLibraryMode, setAssetLibraryMode] = useState<AssetLibraryTargetMode>('any')
  const [storybookDialogOpen, setStorybookDialogOpen] = useState(false)
  const [clientShareOpen, setClientShareOpen] = useState(false)
  const [sceneShareOpen, setSceneShareOpen] = useState(false)
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false)
  const [saveCheckpointOpen, setSaveCheckpointOpen] = useState(false)
  const [savePatternHintOpen, setSavePatternHintOpen] = useState(false)
  const [addPageOpen, setAddPageOpen] = useState(false)
  const {
    t,
    siteKitStorybook,
    history,
    scene,
    selectedIds,
    selectedId,
    activeBreakpoint,
    activePrintPreset,
    zoom,
    panMode,
    marquee,
    contextMenu,
    closeContextMenu,
    leftTab,
    setLeftTab,
    editingMasterId,
    editingVariantId,
    masterAxisFilters,
    setMasterAxisFilters,
    savedUpdatedAt,
    dirty,
    saveState,
    pdfBusy,
    exportBusy,
    publishBusy,
    publishStatus,
    setPublishStatus,
    pullResetConfirmOpen,
    setPullResetConfirmOpen,
    commentsOpen,
    setCommentsOpen,
    commentPinMode,
    setCommentPinMode,
    htmlPreviewOpen,
    setHtmlPreviewOpen,
    codeExportOpen,
    setCodeExportOpen,
    linterOpen,
    setLinterOpen,
    error,
    setError,
    remoteUpdateAvailable,
    staleConflict,
    dismissStaleConflict,
    paletteQuery,
    setPaletteQuery,
    tokenCatalog,
    brandPack,
    scenePages,
    activePageId,
    activePageImportHtml,
    sceneBoardMode,
    breakpointCompareMode,
    onBreakpointCompareToggle,
    setBreakpointCompareEnabled,
    masterMatrixMode,
    setMasterMatrixMode,
    scenePrimaryBreakpoint,
    pageRoot,
    viewRoot,
    artboardFill,
    selected,
    selectedPersisted,
    selectedNodes,
    artboardWidth,
    viewportArtboardHeight,
    inspectRoot,
    layersRoot,
    primaryLocked,
    pageFrameSelection,
    sceneDefaultArtboardWidth,
    canvasShellSize,
    viewportRef,
    sceneRef,
    editingMasterIdRef,
    editingVariantIdRef,
    layerDragIdRef,
    selectionBounds,
    paletteGroups,
    editingMaster,
    editingVariant,
    publishableMasterCount,
    pullableMasterCount,
    contextMenuItems,
    clearPendingSaveOps,
    pushPresent,
    enqueuePendingOp,
    undo,
    redo,
    runOp,
    runOps,
    selectNode,
    removeSelectedNodes,
    duplicateSelectedNodes,
    wrapSelected,
    unwrapSelected,
    openEditorContextMenu,
    onCanvasContextMenu,
    moveLayer,
    onReorderDrop,
    onCrossPageLayerDrop,
    enterMasterEdit,
    exitMasterEdit,
    activateMasterVariant,
    toggleHidden,
    toggleLocked,
    onBreakpointChange,
    onPrintPresetChange,
    onAdd,
    onPaletteDrop,
    onTokenDrop,
    onSave,
    applySceneSnapshot,
    reloadSceneFromServer,
    onDownloadPdf,
    onSurfaceExport,
    onPublishToStorybook,
    onPullFromSiteKit,
    runSiteKitPull,
    onSavePageAsPattern,
    fitAllFramesRef,
    activateBoardPage,
    beginFrameDrag,
    onCanvasPointerDown,
    onCanvasPointerMove,
    endPan,
    onHandlePointerDown,
    stepCanvasZoom,
    zoomCanvasAtViewportCenter,
    commitViewportImmediate,
    viewportGestureRef,
    onTokenSaved,
    workingRoot,
    toastSaveFeedbackRef,
    listMasterVariants,
    findMaster,
    applySceneOp,
    findSceneNode,
    isNodeOrAncestorLocked,
    findPageIdForNode,
    isRealPlatformProjectId,
    panX,
    panY,
    setPanX,
    setPanY,
    frameDraggingPageId,
  } = useEditorSceneState(initialScene)

  const { visibleActionable: kitDriftRows, dismissDrift } = useKitDrift(scene)
  const chartStudio = useChartStudioOpen(selected?.type, selectedId)

  useEffect(() => {
    const type = initialInsertType?.trim()
    if (!type) return
    if (!claimEditorInsertOnce(initialScene.id, type)) return
    onAdd(type)
    stripEditorInsertTypeFromLocation()
  }, [initialInsertType, initialScene.id, onAdd])

  useEffect(() => {
    if (initialHint !== paths.editorHintSavePattern) return
    let dismissed = false
    try {
      dismissed = sessionStorage.getItem(paths.editorHintSavePatternStorageKey) === '1'
    } catch {
      dismissed = false
    }
    if (!dismissed) setSavePatternHintOpen(true)
    stripEditorHintFromLocation()
  }, [initialHint])

  const presence = useEditorPresence({
    sceneId: scene.id,
    pageId: activePageId,
    selectedIds,
    viewport: { zoom, panX, panY },
    viewportRef,
  })
  viewportGestureRef.current = presence.noteLocalViewportGesture

  useEffect(() => {
    const root = document.querySelector('[data-testid="creation-editor-workspace"]')
    if (!(root instanceof HTMLElement)) return
    /** Block browser page pinch-zoom so trackpad zoom stays on the canvas (Figma-like). */
    function onWheel(e: WheelEvent) {
      if (!(e.ctrlKey || e.metaKey)) return
      e.preventDefault()
    }
    root.addEventListener('wheel', onWheel, { passive: false })
    return () => root.removeEventListener('wheel', onWheel)
  }, [])

  useEffect(() => {
    if (!presence.followingUserId) return
    const peer = presence.users.find((u) => u.userId === presence.followingUserId)
    if (!peer) return
    if (peer.viewport) {
      commitViewportImmediate({
        zoom: peer.viewport.zoom,
        panX: peer.viewport.panX,
        panY: peer.viewport.panY,
      })
      return
    }
    if (peer.cursor) {
      const el = viewportRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const nextZoom = zoom
      commitViewportImmediate({
        zoom: nextZoom,
        panX: rect.width / 2 - peer.cursor.x * nextZoom,
        panY: rect.height / 2 - peer.cursor.y * nextZoom,
      })
    }
  }, [presence.followingUserId, presence.users, commitViewportImmediate, zoom, viewportRef])

  const presenceActivityChips = useMemo(
    () => buildPresenceActivityChips(presence.users, presence.localUserId),
    [presence.users, presence.localUserId],
  )
  const softLockPreview = useMemo(
    () => softLockSelectionPreview(selectedIds),
    [selectedIds, presence.users],
  )

  const {
    panelChrome,
    bodyRef,
    onRailUndock,
    onRailToggleMinimize,
    onRailMove,
    onRailSnapDock,
    onRailResizeDocked,
    onRailResizeFloat,
  } = useEditorPanelChrome()

  const [i18nSimActive, setI18nSimActive] = useState(false)
  const [rtlSimActive, setRtlSimActive] = useState(false)

  const simulatedViewRoot = useMemo(() => {
    if (!i18nSimActive && !rtlSimActive) return viewRoot
    return simulateNodeTreeI18n(viewRoot, {
      pseudoLocalization: i18nSimActive,
      direction: rtlSimActive ? 'rtl' : 'ltr',
    })
  }, [viewRoot, i18nSimActive, rtlSimActive])

  const handleOpenAssetLibrary = useCallback((mode: AssetLibraryTargetMode = 'any') => {
    setAssetLibraryMode(mode)
    setAssetLibraryOpen(true)
  }, [])

  const handleApplyAsset = useCallback(
    (
      url: string,
      applyMode: 'background' | 'image',
      meta?: { videonMediaRef?: string },
    ) => {
      const targetId = selectedId || pageRoot?.id
      if (!targetId) return
      if (applyMode === 'background') {
        runOp({ op: 'set_prop', nodeId: targetId, key: 'backgroundImage', value: url })
        const targetNode = selectedId ? selected : pageRoot
        if (!targetNode?.props?.backgroundSize) {
          runOp({ op: 'set_prop', nodeId: targetId, key: 'backgroundSize', value: 'cover' })
        }
      } else {
        runOp({ op: 'set_prop', nodeId: targetId, key: 'src', value: url })
      }
      if (meta?.videonMediaRef) {
        runOp({
          op: 'set_prop',
          nodeId: targetId,
          key: VIDEON_MEDIA_REF_PROP,
          value: meta.videonMediaRef,
        })
      }
    },
    [selectedId, selected, pageRoot, runOp],
  )

  const [shareInviteBusy, setShareInviteBusy] = useState(false)

  const onShareInvite = useCallback(() => {
    setSceneShareOpen(true)
  }, [])

  const toolbarProps = {
    t,
    history,
    saveState,
    dirty,
    onUndo: () => {
      undo()
      clearPendingSaveOps()
    },
    onRedo: () => {
      redo()
      clearPendingSaveOps()
    },
    onSave: () => {
      toastSaveFeedbackRef.current = true
      void onSave()
    },
    pdfBusy,
    exportBusy,
    onDownloadPdf: () => void onDownloadPdf(),
    onSurfaceExport: (format: 'png' | 'pdf', scope?: 'active' | 'all') =>
      void onSurfaceExport(format, scope),
    onHtmlPreviewOpen: () => {
      setHtmlPreviewOpen(true)
      dispatchOnboardingAction('preview')
    },
    onCodeExportOpen: () => setCodeExportOpen(true),
    onSavePageAsPattern: (opts?: { allPages?: boolean; pageId?: string }) =>
      void onSavePageAsPattern(opts),
    onAssetLibraryOpen: () => handleOpenAssetLibrary('any'),
    linterOpen,
    onLinterToggle: () => setLinterOpen((open) => !open),
    commentsOpen,
    onCommentsToggle: () => setCommentsOpen((v) => !v),
    publishBusy,
    pullableMasterCount,
    publishableMasterCount,
    onPullFromSiteKit,
    onPublishToStorybook: () => void onPublishToStorybook(),
    onShareInvite: () => void onShareInvite(),
    shareInviteBusy,
    onOpenClientShare: () => setClientShareOpen(true),
    onOpenStorybookCenter: () => setStorybookDialogOpen(true),
    siteKitStorybook,
    platformProjectId: scene.platformProjectId ?? null,
    activeBreakpoint,
    breakpointCompareMode,
    // Master-Edit: Compare lives in the bar as Variants|Breakpoints (hide toolbar icon).
    onBreakpointCompareToggle: editingMasterId ? undefined : onBreakpointCompareToggle,
    activePrintPreset,
    onPrintPresetChange,
    zoom,
    onZoomIn: () => stepCanvasZoom('in'),
    onZoomOut: () => stepCanvasZoom('out'),
    onZoomReset: () => zoomCanvasAtViewportCenter(1),
    onFitCanvas: () => fitAllFramesRef.current(),
    collectionBound: isRealPlatformProjectId(scene.platformProjectId),
  }

  const handleAlignSelected = useCallback(
    (alignment: SpatialAlignment) => {
      if (selectedNodes.length < 2) return
      const viewport = viewportRef.current
      if (!viewport) return
      const boxes: NodeSpatialBox[] = []
      for (const node of selectedNodes) {
        const bounds = measureNodeBounds(viewport, node.id)
        if (bounds) {
          boxes.push({ node, box: bounds })
        }
      }
      if (boxes.length < 2) return
      const ops = planSpatialAlignOps(
        boxes,
        alignment,
        activeBreakpoint,
        zoom,
        scenePrimaryBreakpoint,
      )
      if (ops.length > 0) {
        runOps(ops)
      }
    },
    [selectedNodes, viewportRef, activeBreakpoint, zoom, runOps, scenePrimaryBreakpoint],
  )

  const handleDistributeSelected = useCallback(
    (axis: SpatialDistribution) => {
      if (selectedNodes.length < 3) return
      const viewport = viewportRef.current
      if (!viewport) return
      const boxes: NodeSpatialBox[] = []
      for (const node of selectedNodes) {
        const bounds = measureNodeBounds(viewport, node.id)
        if (bounds) {
          boxes.push({ node, box: bounds })
        }
      }
      if (boxes.length < 3) return
      const ops = planSpatialDistributeOps(
        boxes,
        axis,
        activeBreakpoint,
        zoom,
        scenePrimaryBreakpoint,
      )
      if (ops.length > 0) {
        runOps(ops)
      }
    },
    [selectedNodes, viewportRef, activeBreakpoint, zoom, runOps, scenePrimaryBreakpoint],
  )

  const leftRailChildren = (
    <>
      <div
        className="creation-editor-left-tabs"
        role="tablist"
        aria-label={t('editor.leftTabs')}
        data-testid="editor-left-tabs"
      >
        <button
          type="button"
          role="tab"
          aria-selected={leftTab === 'components'}
          className={
            leftTab === 'components'
              ? 'creation-editor-left-tabs__tab creation-editor-left-tabs__tab--active'
              : 'creation-editor-left-tabs__tab'
          }
          data-testid="editor-left-tab-components"
          data-onboarding-anchor="openComponents"
          onClick={() => {
            setLeftTab('components')
            dispatchOnboardingAction('openComponents')
          }}
        >
          {t('editor.leftTabComponents')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={leftTab === 'layers'}
          className={
            leftTab === 'layers'
              ? 'creation-editor-left-tabs__tab creation-editor-left-tabs__tab--active'
              : 'creation-editor-left-tabs__tab'
          }
          data-testid="editor-left-tab-layers"
          onClick={() => setLeftTab('layers')}
        >
          {t('editor.leftTabLayers')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={leftTab === 'tokens'}
          className={
            leftTab === 'tokens'
              ? 'creation-editor-left-tabs__tab creation-editor-left-tabs__tab--active'
              : 'creation-editor-left-tabs__tab'
          }
          data-testid="editor-left-tab-tokens"
          data-onboarding-anchor="openTokens"
          onClick={() => {
            setLeftTab('tokens')
            dispatchOnboardingAction('openTokens')
          }}
        >
          {t('editor.leftTabTokens')}
        </button>
      </div>
      {leftTab === 'components' ? (
        <div
          className="creation-editor-components"
          role="tabpanel"
          aria-label={t('editor.componentsAria')}
          data-testid="creation-editor-components"
        >
          <section
            className="creation-editor-components__section creation-editor-components__section--insert"
            aria-label={t('editor.componentsInsert')}
            data-testid="creation-editor-components-insert"
          >
            <p className="creation-editor-components__heading">{t('editor.componentsInsert')}</p>
            <div
              className="creation-editor-palette"
              aria-label={t('editor.paletteAria')}
              data-testid="creation-editor-palette"
            >
              <Input
                block
                size="sm"
                className="search-input"
                value={paletteQuery}
                onChange={(event) => setPaletteQuery(event.target.value)}
                aria-label={t('editor.paletteSearch')}
                placeholder={t('editor.paletteSearch')}
              />
              <div className="creation-editor-palette-groups">
                {paletteGroups.map((group) => (
                  <ComponentPalette
                    key={group.id}
                    items={group.items}
                    onAdd={onAdd}
                    title={t(`editor.paletteGroup.${group.id}`)}
                    aria-label={t(`editor.paletteGroup.${group.id}`)}
                  />
                ))}
              </div>
            </div>
          </section>
          <section
            className="creation-editor-components__section creation-editor-components__section--scene"
            aria-label={t('editor.componentsInScene')}
            data-testid="creation-editor-components-scene"
          >
            <EditorMastersPanel
              masters={scene.masters ?? []}
              scene={scene}
              editingMasterId={editingMasterId}
              onOpen={(masterId) => enterMasterEdit(masterId)}
              onExitEdit={() => exitMasterEdit()}
              onDelete={(masterId) => {
                if (editingMasterId === masterId) exitMasterEdit()
                runOp({ op: 'delete_master', masterId })
              }}
              onJumpToInstance={(pageId, nodeId) => {
                runOp({ op: 'set_active_page', pageId })
                selectNode(nodeId)
              }}
              title={t('editor.componentsInScene')}
              emptyLabel={t('editor.mastersEmpty')}
              openLabel={t('editor.mastersOpen')}
              deleteLabel={t('editor.mastersDelete')}
              exitEditLabel={t('editor.mastersExitEdit')}
              editingLabel={t('editor.mastersEditing')}
              formatVariantCount={(count) => t('editor.mastersVariantCount', { count })}
            />
          </section>
        </div>
      ) : leftTab === 'layers' ? (
        <>
          {editingMasterId && editingMaster ? (
            <EditorMasterEditBar
              masterName={editingMaster.name}
              variantName={editingVariant?.name ?? null}
              editingLabel={t('editor.mastersEditing')}
              exitLabel={t('editor.mastersExitEdit')}
              onExit={() => exitMasterEdit()}
              placement="rail"
              boardDimension={
                masterMatrixMode
                  ? 'matrix'
                  : breakpointCompareMode
                    ? 'breakpoints'
                    : 'variants'
              }
              onBoardDimensionChange={(next) => {
                if (next === 'matrix') {
                  setMasterMatrixMode(true)
                  setBreakpointCompareEnabled(false)
                } else if (next === 'breakpoints') {
                  setMasterMatrixMode(false)
                  setBreakpointCompareEnabled(true)
                } else {
                  setMasterMatrixMode(false)
                  setBreakpointCompareEnabled(false)
                }
              }}
              dimensionVariantsLabel={t('editor.masterBoardDimensionVariants')}
              dimensionBreakpointsLabel={t('editor.masterBoardDimensionBreakpoints')}
              dimensionMatrixLabel={t('editor.masterBoardDimensionMatrix')}
              breakpointsStructureTip={t('editor.secondaryStructureLocked')}
            />
          ) : null}
          {!editingMasterId ? (
            <EditorPagesList
              pages={scenePages}
              activePageId={activePageId}
              coverPageId={scene.coverPageId}
              onSelect={(pageId) => {
                const page = scenePages.find((p) => p.id === pageId)
                runOp({ op: 'set_active_page', pageId })
                if (page?.breakpoint) onBreakpointChange(page.breakpoint)
              }}
              onAdd={() => setAddPageOpen(true)}
              onRename={(pageId, name) => runOp({ op: 'rename_page', pageId, name })}
              onDuplicate={(pageId) => runOp({ op: 'duplicate_page', pageId })}
              onDelete={(pageId) => runOp({ op: 'delete_page', pageId })}
              onSetCover={(pageId) => runOp({ op: 'set_cover_page', pageId })}
              onSaveAsPattern={(pageId) => void onSavePageAsPattern({ pageId })}
              onSaveAllAsPatterns={() => void onSavePageAsPattern({ allPages: true })}
              patternActionsEnabled={isRealPlatformProjectId(scene.platformProjectId)}
              patternActionsBusy={publishBusy}
              onLayerDropToPage={(nodeId, pageId) => onCrossPageLayerDrop(nodeId, pageId)}
              labels={{
                ariaLabel: t('editor.pageTabs'),
                addPage: t('editor.pageAdd'),
                rename: t('editor.pageRename'),
                duplicate: t('editor.pageDuplicate'),
                delete: t('editor.pageDelete'),
                renamePrompt: t('editor.pageRenamePrompt'),
                moreActions: t('editor.pageMoreActions'),
                setAsCover: t('editor.pageSetAsCover'),
                coverBadge: t('editor.pageCoverBadge'),
                saveAsPattern: t('editor.savePageAsPattern'),
                saveAllAsPatterns: t('editor.saveAllPagesAsPatterns'),
              }}
            />
          ) : null}
          <EditorLayers
            root={layersRoot}
            selectedId={selectedId}
            selectedIds={selectedIds}
            activeBreakpoint={activeBreakpoint}
            primaryBreakpoint={scenePrimaryBreakpoint}
            onSelect={(id, mods) => selectNode(id, mods)}
            title={
              editingMaster
                ? t('editor.mastersLayersTitle', { name: editingMaster.name })
                : t('editor.layers')
            }
            emptyLabel={t('editor.layersEmpty')}
            masterEdit={Boolean(editingMasterId)}
            onMoveUp={(id) => moveLayer(id, -1)}
            onMoveDown={(id) => moveLayer(id, 1)}
            onReorderDrop={onReorderDrop}
            onToggleHidden={toggleHidden}
            onToggleLocked={toggleLocked}
            onItemContextMenu={(id, event) => {
              openEditorContextMenu(event.clientX, event.clientY, id)
            }}
            onLayerDragStart={(id) => {
              layerDragIdRef.current = id
            }}
            onLayerDragEnd={() => {
              layerDragIdRef.current = null
            }}
          />
        </>
      ) : (
        <EditorTokenStudio pack={brandPack} catalog={tokenCatalog} onTokenSaved={onTokenSaved} />
      )}
    </>
  )

  const rightRailChildren =
    pageFrameSelection && selectedId ? (
      <EditorPageFrameInspector
        scene={scene}
        selectedFrameNodeId={selectedId}
        sceneDefaultArtboardWidth={sceneDefaultArtboardWidth}
        onOp={runOp}
        onOps={runOps}
        packLeaves={brandPack?.tokens}
        onBreakpointSync={onBreakpointChange}
        canManagePresets={brandPack?.canWrite === true}
      />
    ) : (
      <EditorInspector
        selected={selected}
        selectedPersisted={selectedPersisted}
        selectedNodes={selectedNodes}
        selectedCount={selectedIds.length}
        sceneRoot={inspectRoot}
        isRoot={selected?.id === inspectRoot.id}
        locked={primaryLocked}
        activeBreakpoint={activeBreakpoint}
        primaryBreakpoint={
          scene.primaryBreakpoint === 'tablet' ||
          scene.primaryBreakpoint === 'mobile' ||
          scene.primaryBreakpoint === 'desktop'
            ? scene.primaryBreakpoint
            : 'desktop'
        }
        onBreakpointChange={onBreakpointChange}
        onOp={runOp}
        onOps={runOps}
        onRemove={removeSelectedNodes}
        onOpenAssetLibrary={handleOpenAssetLibrary}
        chartStudioOpen={chartStudio.open}
        onOpenChartStudio={chartStudio.reopen}
        masters={(scene.masters ?? []).map((m) => ({
          id: m.id,
          name: m.name,
          variants: listMasterVariants(m).map((v) => ({
            id: v.id,
            name: v.name,
            ...(v.combination ? { combination: v.combination } : {}),
          })),
          defaultVariantId: m.defaultVariantId ?? listMasterVariants(m)[0]?.id,
          ...(m.axes?.length
            ? { axes: m.axes.map((a) => ({ id: a.id, name: a.name, values: [...a.values] })) }
            : {}),
        }))}
        sceneMasters={scene.masters}
        onCreateMaster={
          editingMasterId
            ? undefined
            : () => {
                if (!selectedId || selectedId === pageRoot.id) return
                runOp({ op: 'create_master', nodeId: selectedId })
              }
        }
        onDetachInstance={
          editingMasterId
            ? undefined
            : () => {
                if (!selectedId) return
                runOp({ op: 'detach_instance', nodeId: selectedId })
              }
        }
        onEditMaster={(masterId) => enterMasterEdit(masterId)}
        onSetInstanceVariant={
          editingMasterId
            ? undefined
            : (variantId) => {
                if (!selectedId) return
                runOp({ op: 'set_instance_variant', nodeId: selectedId, variantId })
              }
        }
        onSetInstanceVariantAxes={
          editingMasterId
            ? undefined
            : (axes) => {
                if (!selectedId) return
                runOp({ op: 'set_instance_variant_axes', nodeId: selectedId, axes })
              }
        }
        brandPack={brandPack}
        onTokenSaved={onTokenSaved}
        onSiteKitStatus={(message) => {
          setError(null)
          setPublishStatus(message)
        }}
        onCompositionSaved={({ masterId, exportName }) => {
          runOp({ op: 'bind_master_composition', masterId, exportName })
        }}
        platformProjectId={scene.platformProjectId}
        masterEdit={
          editingMaster && editingVariant
            ? {
                masterId: editingMaster.id,
                masterName: editingMaster.name,
                activeVariantId: editingVariant.id,
                variants: listMasterVariants(editingMaster).map((v) => ({
                  id: v.id,
                  name: v.name,
                  ...(v.combination ? { combination: v.combination } : {}),
                })),
                ...(editingMaster.axes?.length
                  ? {
                      axes: editingMaster.axes.map((a) => ({
                        id: a.id,
                        name: a.name,
                        values: [...a.values],
                      })),
                      axisFilters: masterAxisFilters,
                    }
                  : {}),
                onSelectVariant: (variantId) => activateMasterVariant(variantId),
                onAddVariant: (name) => {
                  const fromVariantId = editingVariantId ?? undefined
                  const op = {
                    op: 'add_master_variant' as const,
                    masterId: editingMaster.id,
                    name,
                    fromVariantId,
                  }
                  const result = applySceneOp(sceneRef.current, op)
                  if (!result.ok) {
                    setError(result.reason)
                    return
                  }
                  setError(null)
                  pushPresent(result.scene, [op])
                  enqueuePendingOp(op)
                  const master = findMaster(result.scene.masters, editingMaster.id)
                  const added = master?.variants?.[master.variants.length - 1]
                  if (added) activateMasterVariant(added.id)
                },
                onRenameVariant: (variantId, name) => {
                  runOp({
                    op: 'rename_master_variant',
                    masterId: editingMaster.id,
                    variantId,
                    name,
                  })
                },
                onDeleteVariant: (variantId) => {
                  const op = {
                    op: 'delete_master_variant' as const,
                    masterId: editingMaster.id,
                    variantId,
                  }
                  const result = applySceneOp(sceneRef.current, op)
                  if (!result.ok) {
                    setError(result.reason)
                    return
                  }
                  setError(null)
                  pushPresent(result.scene, [op])
                  enqueuePendingOp(op)
                  const master = findMaster(result.scene.masters, editingMaster.id)
                  if (master && editingVariantId === variantId) {
                    const next = resolveMasterVariant(master, master.defaultVariantId)
                    activateMasterVariant(next.id)
                  }
                },
                onAddAxis: (name, values) => {
                  runOp({
                    op: 'add_master_axis',
                    masterId: editingMaster.id,
                    name,
                    values,
                  })
                },
                onRenameAxis: (axisId, name) => {
                  runOp({
                    op: 'rename_master_axis',
                    masterId: editingMaster.id,
                    axisId,
                    name,
                  })
                },
                onDeleteAxis: (axisId) => {
                  runOp({
                    op: 'delete_master_axis',
                    masterId: editingMaster.id,
                    axisId,
                  })
                },
                onAddAxisValue: (axisId, value) => {
                  runOp({
                    op: 'add_master_axis_value',
                    masterId: editingMaster.id,
                    axisId,
                    value,
                  })
                },
                onRenameAxisValue: (axisId, fromValue, toValue) => {
                  runOp({
                    op: 'rename_master_axis_value',
                    masterId: editingMaster.id,
                    axisId,
                    fromValue,
                    toValue,
                  })
                },
                onDeleteAxisValue: (axisId, value) => {
                  runOp({
                    op: 'delete_master_axis_value',
                    masterId: editingMaster.id,
                    axisId,
                    value,
                  })
                },
                onSetAxisFilter: (axisId, value) => {
                  setMasterAxisFilters((prev) => ({ ...prev, [axisId]: value }))
                },
              }
            : null
        }
      />
    )

  function renderLeftRail(mode: 'docked' | 'floating') {
    return (
      <EditorPanelRail
        side="left"
        mode={mode}
        panelChrome={panelChrome}
        title={t('editor.leftRailTitle')}
        undockLabel={t('editor.undockRail')}
        minimizeLabel={t('editor.minimizeRail')}
        restoreLabel={t('editor.restoreRail')}
        dragLabel={t('editor.dragRail')}
        resizeLabel={t('editor.resizeRail')}
        className={
          editingMasterId
            ? 'creation-editor-left creation-editor-left--master-edit'
            : 'creation-editor-left'
        }
        testId="creation-editor-left"
        onRailUndock={onRailUndock}
        onRailToggleMinimize={onRailToggleMinimize}
        onRailMove={onRailMove}
        onRailSnapDock={onRailSnapDock}
        onRailResizeDocked={onRailResizeDocked}
        onRailResizeFloat={onRailResizeFloat}
      >
        {leftRailChildren}
      </EditorPanelRail>
    )
  }

  function renderRightRail(mode: 'docked' | 'floating') {
    return (
      <EditorPanelRail
        side="right"
        mode={mode}
        panelChrome={panelChrome}
        title={t('editor.inspector')}
        undockLabel={t('editor.undockRail')}
        minimizeLabel={t('editor.minimizeRail')}
        restoreLabel={t('editor.restoreRail')}
        dragLabel={t('editor.dragRail')}
        resizeLabel={t('editor.resizeRail')}
        className="creation-editor-right"
        testId="creation-editor-right"
        onRailUndock={onRailUndock}
        onRailToggleMinimize={onRailToggleMinimize}
        onRailMove={onRailMove}
        onRailSnapDock={onRailSnapDock}
        onRailResizeDocked={onRailResizeDocked}
        onRailResizeFloat={onRailResizeFloat}
      >
        {rightRailChildren}
      </EditorPanelRail>
    )
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault()
        setSaveCheckpointOpen(true)
      } else if ((e.metaKey || e.ctrlKey) && e.altKey && e.key.toLowerCase() === 'h') {
        e.preventDefault()
        setHistoryDrawerOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const onboardingRootCount = useMemo(() => countActivePageChildren(scene), [scene])

  useEffect(() => {
    dispatchCompositionChanged(onboardingRootCount)
  }, [onboardingRootCount])

  const handleLoadOnboardingSample = useCallback(() => {
    applySceneSnapshot(buildOnboardingSampleScene(sceneRef.current))
  }, [applySceneSnapshot, sceneRef])

  const topbarChrome = (
    <div className="creation-topbar-trail__bundle" data-testid="creation-topbar-trail-bundle">
      <EditorTopbarChrome {...toolbarProps} />
      <div className="creation-topbar-trail__meta">
        <TopbarPresenceStack
          users={presence.users}
          localUserId={presence.localUserId}
          followingUserId={presence.followingUserId}
          onFollowUser={presence.followUser}
          onClearFollow={presence.clearFollow}
        />
        <PresenceActivityRibbon chips={presenceActivityChips} />
        {softLockPreview ? (
          <span
            data-testid="soft-lock-preview"
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--warning, #c6f24a)',
              whiteSpace: 'nowrap',
              maxWidth: 220,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={softLockPreview}
          >
            {softLockPreview}
          </span>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant={historyDrawerOpen ? 'primary' : 'subtle'}
          onClick={() => setHistoryDrawerOpen((o) => !o)}
          title="Version History & Checkpoints (⌥⌘H)"
          data-testid="editor-history-button"
        >
          History
        </Button>
      </div>
    </div>
  )

  return (
    <TokenCatalogProvider catalog={tokenCatalog}>
      <CollectionDataProvider
        scene={scene}
        platformProjectId={scene.platformProjectId}
      >
      <div className="creation-editor-workspace" data-testid="creation-editor-workspace">
        <OnboardingHost
          rootCount={onboardingRootCount}
          onLoadSample={handleLoadOnboardingSample}
        />
        {savePatternHintOpen ? (
          <div className="creation-editor-save-pattern-hint" data-testid="editor-save-pattern-hint">
            <Hint panel>
              <Text as="p">{t('editor.savePatternHint')}</Text>
              <Button
                type="button"
                size="sm"
                variant="subtle"
                data-testid="editor-save-pattern-hint-dismiss"
                onClick={() => {
                  setSavePatternHintOpen(false)
                  try {
                    sessionStorage.setItem(paths.editorHintSavePatternStorageKey, '1')
                  } catch {
                    /* ignore */
                  }
                }}
              >
                {t('editor.savePatternHintDismiss')}
              </Button>
            </Hint>
          </div>
        ) : null}
        {topbarTrailHost
          ? createPortal(topbarChrome, topbarTrailHost)
          : <EditorFallbackToolbar {...toolbarProps} />}

        <div ref={bodyRef} className="creation-editor-body">
          <EditorCommentsPanel
            open={commentsOpen}
            onClose={() => setCommentsOpen(false)}
            selectedNodeId={selectedIds[0] ?? null}
            selectedNodeLabel={
              selectedIds[0]
                ? findSceneNode(scene, selectedIds[0], workingRoot(scene))?.name ||
                  findSceneNode(scene, selectedIds[0], workingRoot(scene))?.type ||
                  selectedIds[0]
                : null
            }
            comments={commentsForNode(scene.comments, selectedIds[0] ?? null)}
            onAdd={(body) => {
              const nodeId = selectedIds[0]
              if (!nodeId) return
              const next = addSceneComment(withPrunedComments(sceneRef.current), { nodeId, body })
              if (next) pushPresent(next)
            }}
            onSetResolved={(commentId, resolved) => {
              pushPresent(
                setCommentResolved(withPrunedComments(sceneRef.current), commentId, resolved),
              )
            }}
          />
          <EditorHtmlPreviewDialog
            open={htmlPreviewOpen}
            onClose={() => setHtmlPreviewOpen(false)}
            sceneId={scene.id}
            pageId={activePageId}
            baseUpdatedAt={savedUpdatedAt}
            dirty={dirty}
            importSourceHtml={activePageImportHtml}
            onSceneImported={(imported) => {
              applySceneSnapshot(imported)
            }}
          />
          <EditorClientShareDialog
            open={clientShareOpen}
            onClose={() => setClientShareOpen(false)}
            sceneId={scene.id}
            pages={(scenePages?.length
              ? scenePages
              : [{ id: activePageId, name: 'Page 1' }]
            ).map((p) => ({ id: p.id, name: p.name }))}
            collectionBound={isRealPlatformProjectId(scene.platformProjectId)}
            t={t}
            onInviteCollaborator={onShareInvite}
            inviteBusy={shareInviteBusy}
            onStatus={(msg) => setPublishStatus(msg)}
            onError={(msg) => setError(msg)}
          />
          <EditorSceneShareDialog
            open={sceneShareOpen}
            sceneId={scene.id}
            onClose={() => setSceneShareOpen(false)}
          />
          <EditorAddPageDialog
            open={addPageOpen}
            onClose={() => setAddPageOpen(false)}
            t={t}
            onCreate={(op) => runOp(op)}
            onBreakpointSync={onBreakpointChange}
            packLeaves={brandPack?.tokens}
          />
          <EditorCodeExportDialog
            open={codeExportOpen}
            onClose={() => setCodeExportOpen(false)}
            scene={scene}
            activePageId={activePageId}
            selectedNodeId={selectedId}
            tokenCatalog={tokenCatalog}
            packLeaves={brandPack?.tokens}
            activeBreakpoint={activeBreakpoint}
            siteKitStorybookUrl={siteKitStorybook}
            onJumpToIssue={(nodeId) => {
              selectNode(nodeId)
              setLinterOpen(true)
            }}
          />
          <EditorAssetLibraryDialog
            open={assetLibraryOpen}
            onClose={() => setAssetLibraryOpen(false)}
            targetMode={assetLibraryMode}
            targetNodeName={selected?.name || selected?.type || pageRoot?.name || 'Page Container'}
            platformProjectId={scene.platformProjectId}
            onApplyAsset={handleApplyAsset}
          />
          <EditorStorybookDialog
            open={storybookDialogOpen}
            onClose={() => setStorybookDialogOpen(false)}
            scene={scene}
            selectedNode={selected}
            selectedPersistedNode={selectedPersisted}
            activeBreakpoint={activeBreakpoint}
            tokenCatalog={tokenCatalog}
            platformProjectId={scene.platformProjectId}
            masterEditId={editingMasterId}
            siteKitStorybookUrl={siteKitStorybook}
            t={t}
            onSiteKitStatus={(msg) => setPublishStatus(msg)}
            onCompositionSaved={({ masterId, exportName }) => {
              runOp({ op: 'bind_master_composition', masterId, exportName })
            }}
          />
          <InteractiveStateProvider>
          <EditorPanelDockLayout
            panelChrome={panelChrome}
            leftRail={renderLeftRail}
            rightRail={renderRightRail}
            canvas={
              <EditorCanvasChrome
                viewportRef={viewportRef}
                sceneRef={sceneRef}
                editingMasterIdRef={editingMasterIdRef}
                editingVariantIdRef={editingVariantIdRef}
                layerDragIdRef={layerDragIdRef}
                panMode={panMode}
                sceneBoardMode={sceneBoardMode}
                boardSurfaceMode={
                  sceneBoardMode || breakpointCompareMode || masterMatrixMode
                }
                breakpointCompareMode={breakpointCompareMode || masterMatrixMode}
                zoom={zoom}
                panX={panX}
                panY={panY}
                artboardWidth={artboardWidth}
                viewportArtboardHeight={viewportArtboardHeight}
                artboardFill={artboardFill}
                viewRoot={simulatedViewRoot}
                selectedIds={selectedIds}
                selectionBounds={selectionBounds}
                primaryLocked={primaryLocked}
                marquee={marquee}
                scene={scene}
                activePageId={activePageId}
                activeBreakpoint={activeBreakpoint}
                activePrintPreset={activePrintPreset}
                sceneDefaultArtboardWidth={sceneDefaultArtboardWidth}
                canvasShellSize={canvasShellSize}
                frameDraggingPageId={frameDraggingPageId}
                editingMasterId={editingMasterId}
                masterEditExit={
                  editingMaster
                    ? {
                        masterName: editingMaster.name,
                        variantName: editingVariant?.name ?? null,
                        editingLabel: t('editor.mastersEditing'),
                        exitLabel: t('editor.mastersExitEdit'),
                        onExit: () => exitMasterEdit(),
                        variants: listMasterVariants(editingMaster).map((v) => ({
                          id: v.id,
                          name: v.name,
                        })),
                        activeVariantId: editingVariant?.id ?? null,
                        onSelectVariant: (variantId) => activateMasterVariant(variantId),
                        boardDimension: masterMatrixMode
                          ? 'matrix'
                          : breakpointCompareMode
                            ? 'breakpoints'
                            : 'variants',
                        onBoardDimensionChange: (next) => {
                          if (next === 'matrix') {
                            setMasterMatrixMode(true)
                            setBreakpointCompareEnabled(false)
                          } else if (next === 'breakpoints') {
                            setMasterMatrixMode(false)
                            setBreakpointCompareEnabled(true)
                          } else {
                            setMasterMatrixMode(false)
                            setBreakpointCompareEnabled(false)
                          }
                        },
                        dimensionVariantsLabel: t('editor.masterBoardDimensionVariants'),
                        dimensionBreakpointsLabel: t(
                          'editor.masterBoardDimensionBreakpoints',
                        ),
                        dimensionMatrixLabel: t('editor.masterBoardDimensionMatrix'),
                        breakpointsStructureTip: t('editor.secondaryStructureLocked'),
                      }
                    : null
                }
                onSelect={selectNode}
                onPaletteDrop={onPaletteDrop}
                onTokenDrop={onTokenDrop}
                onCrossPageLayerDrop={onCrossPageLayerDrop}
                onCanvasPointerDown={onCanvasPointerDown}
                onCanvasPointerMove={onCanvasPointerMove}
                endPan={endPan}
                onCanvasContextMenu={onCanvasContextMenu}
                onHandlePointerDown={onHandlePointerDown}
                beginFrameDrag={beginFrameDrag}
                activateBoardPage={activateBoardPage}
                runOp={runOp}
                runOps={runOps}
                workingRoot={workingRoot}
                isNodeOrAncestorLocked={isNodeOrAncestorLocked}
                findPageIdForNode={(s, nodeId) => findPageIdForNode(s, nodeId) ?? undefined}
                selectedNode={selected}
                selectedNodes={selectedNodes}
                softLockHint={softLockPreview}
                presenceUsers={presence.users}
                localUserId={presence.localUserId}
                onPresencePointerMove={presence.reportPointerFromClient}
                onLocalViewportGesture={presence.noteLocalViewportGesture}
                onMinimapPanDelta={(dPanX, dPanY) => {
                  setPanX((x) => x + dPanX)
                  setPanY((y) => y + dPanY)
                  presence.noteLocalViewportGesture()
                }}
                onMinimapFitAll={() => fitAllFramesRef.current()}
                onHudAddPrimitive={onAdd}
                onHudWrapStack={() => wrapSelected('SiteStack')}
                onHudWrapGrid={() => wrapSelected('SiteGrid')}
                onHudUnwrap={unwrapSelected}
                onHudGroupSelection={() => wrapSelected('SiteStack')}
                onHudDuplicate={duplicateSelectedNodes}
                onHudDelete={removeSelectedNodes}
                onHudMoveLayer={(delta) => {
                  if (selectedId) moveLayer(selectedId, delta)
                }}
                onHudDetachMaster={
                  editingMasterId || !selectedId
                    ? undefined
                    : () => runOp({ op: 'detach_instance', nodeId: selectedId })
                }
                onHudCreateMaster={
                  editingMasterId || !selectedId || selectedId === pageRoot.id
                    ? undefined
                    : () => runOp({ op: 'create_master', nodeId: selectedId })
                }
                onHudAlignSelected={handleAlignSelected}
                onHudDistributeSelected={handleDistributeSelected}
                brandPack={brandPack}
                onTokenSaved={onTokenSaved}
                onHudHostAction={(action) => {
                  if (action === 'openAssetLibrary') {
                    handleOpenAssetLibrary('image')
                    return
                  }
                  if (action === 'openSvgDeepEdit' && typeof window !== 'undefined') {
                    window.dispatchEvent(new Event(paths.hudHostOpenSvgDeepEditEvent))
                  }
                }}
                commentPinMode={commentPinMode}
                onToggleCommentPinMode={() => setCommentPinMode((p) => !p)}
                onAddSpatialComment={(cmt) => {
                  const next = addSceneComment(withPrunedComments(sceneRef.current), cmt)
                  if (next) pushPresent(next)
                }}
                onReplyComment={(commentId, reply) => {
                  const next = addCommentReply(
                    withPrunedComments(sceneRef.current),
                    commentId,
                    reply,
                  )
                  pushPresent(next)
                  const thread = next.comments?.find((c) => c.id === commentId)
                  if (thread) {
                    void postProjectedShareThreadMirror(sceneRef.current.id, thread)
                  }
                }}
                onToggleCommentResolve={(commentId, resolved) => {
                  const next = setCommentResolved(
                    withPrunedComments(sceneRef.current),
                    commentId,
                    resolved,
                  )
                  pushPresent(next)
                  const thread = next.comments?.find((c) => c.id === commentId)
                  if (thread) {
                    void postProjectedShareThreadMirror(sceneRef.current.id, thread)
                  }
                }}
                onDeleteComment={(commentId) => {
                  pushPresent(
                    removeSceneComment(withPrunedComments(sceneRef.current), commentId),
                  )
                }}
              />
            }
          />
          </InteractiveStateProvider>
          {linterOpen ? (
            <EditorLinterPanel
              scene={scene}
              selectedNodeId={selectedId}
              onSelectNode={selectNode}
              onClose={() => setLinterOpen(false)}
              onApplyOps={runOps}
              tokenCatalog={tokenCatalog}
              i18nActive={i18nSimActive}
              rtlActive={rtlSimActive}
              onToggleI18n={setI18nSimActive}
              onToggleRtl={setRtlSimActive}
            />
          ) : null}
          {selected ? (
            <ChartStudioPanel
              node={selected}
              open={chartStudio.open}
              onDismiss={chartStudio.dismiss}
              onOps={runOps}
              platformProjectId={scene.platformProjectId}
              t={t}
            />
          ) : null}

          {kitDriftRows.length > 0 ? (
            <EditorKitDriftBanner
              rows={kitDriftRows}
              busy={publishBusy}
              onPull={() => {
                void onPullFromSiteKit('pull')
              }}
              onReset={() => {
                void onPullFromSiteKit('reset')
              }}
              onDismiss={dismissDrift}
            />
          ) : null}
          {staleConflict === 'active' ? (
            <div className="creation-editor-confirm" data-testid="editor-stale-conflict-notice">
              <Text role="meta" as="p" className="creation-editor-confirm__message">
                {t('editor.staleSceneConflict')}
              </Text>
              <div className="creation-editor-confirm__actions">
                <Button
                  type="button"
                  size="sm"
                  variant="subtle"
                  onClick={() => {
                    void reloadSceneFromServer(scene.id).catch(() => {
                      setError(t('editor.staleSceneConflict'))
                    })
                  }}
                  data-testid="editor-stale-conflict-reload"
                >
                  {t('editor.staleSceneReload')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => dismissStaleConflict()}
                  data-testid="editor-stale-conflict-keep"
                >
                  {t('editor.staleSceneKeep')}
                </Button>
              </div>
            </div>
          ) : null}
          {remoteUpdateAvailable ? (
            <div className="creation-editor-confirm" data-testid="editor-remote-update-notice">
              <Text role="meta" as="p" className="creation-editor-confirm__message">
                {remoteUpdateAvailable.source === 'scene_import_html'
                  ? t('editor.remoteUpdateImportHtml')
                  : t('editor.remoteUpdateGeneric')}
              </Text>
              <div className="creation-editor-confirm__actions">
                <Button
                  type="button"
                  size="sm"
                  variant="subtle"
                  onClick={() => {
                    void reloadSceneFromServer(scene.id).catch(() => {
                      setError('Remote scene update available - reload failed.')
                    })
                  }}
                  data-testid="editor-remote-update-reload"
                >
                  Reload
                </Button>
              </div>
            </div>
          ) : null}
          {error ? (
            <Text role="meta" as="p" className="creation-editor-error" data-testid="editor-error">
              {error}
            </Text>
          ) : null}
          {pullResetConfirmOpen ? (
            <div
              className="creation-editor-confirm"
              role="alertdialog"
              aria-labelledby="site-kit-reset-confirm-title"
              data-testid="editor-site-kit-reset-confirm"
            >
              <Text
                role="meta"
                as="p"
                id="site-kit-reset-confirm-title"
                className="creation-editor-confirm__message"
              >
                {t('editor.siteKitResetConfirm')}
              </Text>
              <div className="creation-editor-confirm__actions">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setPullResetConfirmOpen(false)}
                  data-testid="editor-site-kit-reset-cancel"
                >
                  {t('editor.siteKitResetCancel')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  disabled={publishBusy}
                  onClick={() => void runSiteKitPull('reset')}
                  data-testid="editor-site-kit-reset-confirm-btn"
                >
                  {t('editor.siteKitResetConfirmAction')}
                </Button>
              </div>
            </div>
          ) : null}
          <ContextMenu
            open={contextMenu.open}
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={closeContextMenu}
            items={contextMenuItems}
            label={t('editor.contextMenu')}
          />
          <span
            className="visually-hidden"
            data-testid={publishStatus ? 'editor-site-kit-publish-status' : 'editor-save-status'}
            data-dirty={dirty ? 'true' : 'false'}
            data-save-state={saveState}
          >
            {publishStatus
              ? publishStatus
              : saveState === 'saving'
                ? t('editor.saving')
                : dirty
                  ? t('editor.dirty')
                  : saveState === 'saved'
                    ? t('editor.saved')
                    : t('editor.savedClean')}
          </span>
          <EditorHistoryDrawer
            isOpen={historyDrawerOpen}
            onClose={() => setHistoryDrawerOpen(false)}
            sceneId={scene.id}
            insetRight={
              panelChrome.rightMode === 'docked' && panelChrome.rightEdge === 'right'
                ? panelChrome.rightSize
                : 0
            }
            onCreateMilestone={() => setSaveCheckpointOpen(true)}
            onRestoreVersion={async (versionId) => {
              const res = await fetch(`/api/scenes/${scene.id}/versions/${versionId}/restore`, {
                method: 'POST',
              })
              if (res.ok) {
                const data = await res.json()
                if (data.scene) {
                  applySceneSnapshot(data.scene)
                }
              }
            }}
          />
          <EditorSaveCheckpointDialog
            isOpen={saveCheckpointOpen}
            onClose={() => setSaveCheckpointOpen(false)}
            onSave={async (name, description) => {
              await fetch(`/api/scenes/${scene.id}/versions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description }),
              })
            }}
          />
        </div>
      </div>
      </CollectionDataProvider>
    </TokenCatalogProvider>
  )
}
