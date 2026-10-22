'use client'

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import type { CompositionScene, PrintPresetId, SceneNode, SceneOp } from '@zaoly/contracts'
import { isRealPlatformProjectId } from '../../lib/platform-project-id'
import { paths } from '../../lib/paths'
import { siteKitStorybookUrl } from '../../lib/runtime-config'
import {
  INSPECT_TOKEN_CATALOG,
  editorPackFromLocalApi,
  mergeLivePackIntoCatalog,
  type BrandTokenPackResponse,
  type InspectTokenOption,
  type ZaolyPackLeaf,
} from '../../lib/inspect/token-catalog'
import { resolveArtboardFillCss } from '../../lib/inspect/resolve-bindings'
import { cascadeNodeForBreakpoint } from '../../lib/scene/cascade'
import { useSceneGoogleFonts } from '../../lib/fonts/use-scene-google-fonts'
import {
  applySceneOp,
  findSceneNode,
  isNodeOrAncestorLocked,
  planCrossPageLayerDrop,
  planPaletteDrop,
} from '../../lib/scene/ops'
import {
  findMaster,
  findNodeInTree,
  resolveMasterEditInspectSubject,
} from '../../lib/scene/expand-instances'
import {
  cachedExpandBreakpointBoardForPaint,
  cachedExpandCompositionScene,
  cachedExpandMasterVariantBoardForPaint,
  cachedExpandSceneBoardForPaint,
  resolveCachedInspectSubject,
} from '../../lib/scene/expand-cache'
import {
  BREAKPOINT_BOARD_ID,
  buildBreakpointCompareBoard,
  computeBreakpointBoardCanvasSize,
  isBreakpointBoardId,
} from '../../lib/scene/breakpoint-board'
import { buildMasterBreakpointMatrixBoard } from '../../lib/scene/master-breakpoint-matrix'
import { planResetBreakpointOverrides } from '../../lib/scene/breakpoint-visibility'
import {
  loadBreakpointCompareMode,
  saveBreakpointCompareMode,
} from '../../lib/editor/breakpoint-compare-prefs'
import {
  buildMasterVariantBoard,
  listMasterVariants,
  resolveMasterVariant,
} from '../../lib/scene/master-variants'
import {
  artboardCssSize,
  type EditorBreakpoint,
} from '../../lib/scene/breakpoints'
import {
  activePageRoot,
  findPageIdForNode,
  resolveActivePage,
  resolveActivePageId,
} from '../../lib/scene/scene-pages'
import {
  SCENE_BOARD_ID,
  buildSceneBoardForPaint,
  boardPagesForScene,
  computeSceneBoardCanvasSize,
  defaultArtboardWidthForScene,
  isPageFrameInspectableId,
  isSceneBoardNodeId,
  resolvePageArtboardHeight,
  resolvePageArtboardWidth,
  shouldLazyPaintInactiveBoardPages,
} from '../../lib/scene/scene-board'
import { planTokenDrop } from '../../lib/inspect/token-drop'
import { type SceneUpdatedEvent } from '../../lib/scene/scene-events'
import {
  replaceSelection,
  unionBounds,
  type Bounds,
} from '../../lib/scene/selection'
import { useUserPrefs } from '../../lib/user-prefs'
import { useToast } from '../../lib/zaoly-ui-client'
import {
  resolveDisplaySelectionBounds,
  type SelectionBoundsSnapshot,
} from '../../lib/editor/selection-bounds-viewport'
import { useEditorViewportState } from './use-editor-viewport-state'
import { useEditorHistory } from './use-editor-history'
import { useEditorSelection } from './use-editor-selection'
import { useEditorPersistence } from './use-editor-persistence'
import { useEditorIntegrations } from './use-editor-integrations'
import { useEditorMutations } from './use-editor-mutations'
import { useEditorPalette } from './use-editor-palette'
import { useEditorPointer } from './use-editor-pointer'
import { useEditorBoardNav } from './use-editor-board-nav'
import { useEditorMasterEdit } from './use-editor-master-edit'
import { useEditorNodeSelect } from './use-editor-node-select'
import { useEditorContextMenu } from './use-editor-context-menu'
import { useEditorSceneSync } from './use-editor-scene-sync'
import { useEditorStructure } from './use-editor-structure'
import { useLocalPackFocusRefresh } from './use-local-pack-focus-refresh'
import {
  createEditorBoot,
  isEditableTarget,
  LEFT_TAB_KEY,
  measureNodeBounds,
  readLeftTab,
  sceneDocumentFingerprint,
  type FrameDragSession,
  type LeftTab,
  type MarqueeSession,
  type ResizeSession,
} from './editor-boot'

export function useEditorSceneState(initialScene: CompositionScene) {
  const { t } = useUserPrefs()
  const { push: pushToast } = useToast()
  const siteKitStorybook = siteKitStorybookUrl()
  const [boot] = useState(() => createEditorBoot(initialScene))
  const {
    history,
    scene,
    revision,
    pushPresent,
    undo,
    redo,
    resetPresent,
    mutatePresent,
    canUndo: historyCanUndo,
    canRedo: historyCanRedo,
  } = useEditorHistory(boot.history)
  const {
    selectedIds,
    setSelectedIds,
    selectedId,
    selectedIdsRef,
    selectedIdRef,
  } = useEditorSelection(boot.selectedIds)
  const [activeBreakpoint, setActiveBreakpoint] = useState<EditorBreakpoint>(boot.activeBreakpoint)
  const [activePrintPreset, setActivePrintPreset] = useState<PrintPresetId>(boot.activePrintPreset)
  const [artboardHeight, setArtboardHeight] = useState(640)

  // Always start with the SSR default — restore sessionStorage after mount (hydration-safe).
  const [leftTab, setLeftTab] = useState<LeftTab>('components')
  const [leftTabHydrated, setLeftTabHydrated] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** W6: `409 stale-scene` keep-draft — autosave paused until reload. */
  const [staleConflict, setStaleConflict] = useState<'active' | 'dismissed' | null>(null)
  const staleConflictRef = useRef(staleConflict)
  staleConflictRef.current = staleConflict

  const sceneRef = useRef(scene)
  const activeBreakpointRef = useRef(activeBreakpoint)
  const activePrintPresetRef = useRef(activePrintPreset)
  const revisionRef = useRef(revision)
  sceneRef.current = scene
  activeBreakpointRef.current = activeBreakpoint
  activePrintPresetRef.current = activePrintPreset
  revisionRef.current = revision

  const {
    savedFingerprint,
    markSaved,
    savedUpdatedAt,
    setSavedUpdatedAt,
    savedUpdatedAtRef,
    saveState,
    dirty,
    dirtyRef,
    saveInFlightRef,
    toastSaveFeedbackRef,
    onSaveRef,
    clearPendingSaveOps,
    syncSavedSceneSnapshot,
    enqueuePendingOp,
    enqueuePendingOps,
    onSave,
  } = useEditorPersistence({
    initialUpdatedAt: boot.savedUpdatedAt,
    initialPresent: boot.history.present,
    initialBreakpoint: boot.activeBreakpoint,
    initialPrintPreset: boot.activePrintPreset,
    contentRevision: revision,
    scene,
    activeBreakpoint,
    activePrintPreset,
    getLive: () => ({
      scene: sceneRef.current,
      activeBreakpoint: activeBreakpointRef.current,
      activePrintPreset: activePrintPresetRef.current,
      revision: revisionRef.current,
    }),
    isSaveBlocked: () => staleConflictRef.current !== null,
    onStaleConflict: () => {
      setStaleConflict('active')
    },
    t,
    pushToast,
    setError,
  })

  const {
    editingMasterId,
    setEditingMasterId,
    editingVariantId,
    setEditingVariantId,
    masterAxisFilters,
    setMasterAxisFilters,
    editingMasterIdRef,
    editingVariantIdRef,
    enterMasterEdit,
    exitMasterEdit,
    activateMasterVariant,
    upsertMasterBoardCell,
    addMasterVariantFromBoard,
  } = useEditorMasterEdit({
    sceneRef,
    setSelectedIds,
    setLeftTab,
    pushPresent,
    enqueuePendingOp,
    setError,
  })

  const panOrigin = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)
  const resizeSession = useRef<ResizeSession | null>(null)
  const marqueeSession = useRef<MarqueeSession | null>(null)
  const frameDragSession = useRef<FrameDragSession | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  /** Wired by workspace to presence.noteLocalViewportGesture (clears follow on pan/zoom). */
  const viewportGestureRef = useRef<(() => void) | null>(null)
  const viewport = useEditorViewportState(viewportRef, {
    onViewportGesture: () => viewportGestureRef.current?.(),
  })
  const {
    zoom,
    panX,
    panY,
    panning,
    marquee,
    spaceDown,
    panMode,
    setPanX,
    setPanY,
    setPanning,
    setMarquee,
    setSpaceDown,
    zoomPanRef,
    commitViewport,
    commitViewportImmediate,
    stepCanvasZoom,
    zoomCanvasAtViewportCenter,
  } = viewport
  const [selectionBoundsSnapshot, setSelectionBoundsSnapshot] =
    useState<SelectionBoundsSnapshot | null>(null)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [commentPinMode, setCommentPinMode] = useState(false)
  const [htmlPreviewOpen, setHtmlPreviewOpen] = useState(false)
  const [codeExportOpen, setCodeExportOpen] = useState(false)
  const [linterOpen, setLinterOpen] = useState(false)
  const [remoteUpdateAvailable, setRemoteUpdateAvailable] = useState<SceneUpdatedEvent | null>(null)
  const [tokenCatalog, setTokenCatalog] = useState<InspectTokenOption[]>(INSPECT_TOKEN_CATALOG)
  const [brandPack, setBrandPack] = useState<BrandTokenPackResponse | null>(null)
  useLocalPackFocusRefresh(true, setTokenCatalog, setBrandPack)

  const {
    pdfBusy,
    exportBusy,
    publishBusy,
    publishStatus,
    setPublishStatus,
    pullResetConfirmOpen,
    setPullResetConfirmOpen,
    publishableMasterCount,
    pullableMasterCount,
    onDownloadPdf,
    onSurfaceExport,
    onPublishToStorybook,
    onPullFromSiteKit,
    runSiteKitPull,
    onSavePageAsPattern,
  } = useEditorIntegrations({
    scene,
    sceneRef,
    activeBreakpoint,
    tokenCatalog,
    pushPresent,
    mutatePresent,
    t,
    pushToast,
    setError,
    ensureScenePersisted: async () => {
      await onSave()
    },
  })

  const scenePages = scene.pages?.length ? scene.pages : [resolveActivePage(scene)]
  const activePageId = resolveActivePageId(scenePages, scene.activePageId)
  const activePageImportHtml = scenePages.find((p) => p.id === activePageId)?.importSourceHtml
  // Always start false so SSR HTML matches the first client paint; restore
  // device pref after mount (Wave G hydration — no window/localStorage in useState).
  const [breakpointCompareMode, setBreakpointCompareMode] = useState(false)
  const [comparePrefsReady, setComparePrefsReady] = useState(false)
  /** Wave I — Master-Edit nested variant × BP matrix (UI-only). */
  const [masterMatrixMode, setMasterMatrixMode] = useState(false)
  // Gate boards until prefs load — avoids Scene-board → Compare flash.
  const sceneBoardMode =
    comparePrefsReady &&
    !editingMasterId &&
    !breakpointCompareMode &&
    !masterMatrixMode
  /** Compare allowed on page and in Master-Edit (active variant root). */
  const breakpointBoardMode =
    comparePrefsReady && breakpointCompareMode && !masterMatrixMode
  const matrixBoardMode =
    comparePrefsReady && masterMatrixMode && Boolean(editingMasterId)
  const pageRoot = useMemo(() => activePageRoot(scene), [scene])

  useEffect(() => {
    setBreakpointCompareMode(loadBreakpointCompareMode())
    setComparePrefsReady(true)
  }, [])

  useEffect(() => {
    if (!editingMasterId) setMasterMatrixMode(false)
  }, [editingMasterId])

  const docFingerprint = useMemo(() => sceneDocumentFingerprint(scene), [scene])
  useSceneGoogleFonts(pageRoot, tokenCatalog, activeBreakpoint)

  const selectionBounds = useMemo(
    () => resolveDisplaySelectionBounds(selectionBoundsSnapshot, panX, panY, zoom),
    [selectionBoundsSnapshot, panX, panY, zoom],
  )

  const layerDragIdRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(paths.routes.apiTokens, { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) return null
        return (await res.json()) as {
          tokens?: ZaolyPackLeaf[]
          origins?: Record<string, string>
          canWrite?: boolean
        }
      })
      .then((body) => {
        if (cancelled) return
        const pack = editorPackFromLocalApi(body ?? {})
        setBrandPack(pack)
        setTokenCatalog(
          pack.tokens.length ? mergeLivePackIntoCatalog(pack.tokens) : INSPECT_TOKEN_CATALOG,
        )
      })
      .catch(() => {
        if (!cancelled) {
          setBrandPack(null)
          setTokenCatalog(INSPECT_TOKEN_CATALOG)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const onTokenSaved = useCallback((token: ZaolyPackLeaf) => {
    setBrandPack((prev) => {
      const base =
        prev ??
        editorPackFromLocalApi({ tokens: [], canWrite: true })
      const tokens = base.tokens.map((leaf) => (leaf.path === token.path ? token : leaf))
      if (!tokens.some((leaf) => leaf.path === token.path)) tokens.push(token)
      const next = { ...base, tokens }
      setTokenCatalog(mergeLivePackIntoCatalog(next.tokens))
      return next
    })
  }, [])

  const editingMaster = useMemo(
    () => (editingMasterId ? findMaster(scene.masters, editingMasterId) : undefined),
    [scene.masters, editingMasterId],
  )
  const editingVariant = useMemo(() => {
    if (!editingMaster) return undefined
    return resolveMasterVariant(editingMaster, editingVariantId)
  }, [editingMaster, editingVariantId])
  const masterBoardRoot = useMemo(() => {
    // Wait for Compare prefs so we don't flash variant board → BP Compare.
    if (!comparePrefsReady) return null
    // Compare / Matrix win over variant cell board while Master-Edit.
    if (breakpointCompareMode || masterMatrixMode) return null
    if (!editingMaster || !editingVariant) return null
    const board = buildMasterVariantBoard(editingMaster, editingVariant.id, {
      axisFilters: masterAxisFilters,
    })
    // paintKey: active variant + filters are UI state (not in docFingerprint).
    const paintKey = `${editingVariant.id}:${JSON.stringify(masterAxisFilters)}`
    return cachedExpandMasterVariantBoardForPaint(
      board,
      scene.masters,
      docFingerprint,
      paintKey,
    )
  }, [
    comparePrefsReady,
    breakpointCompareMode,
    masterMatrixMode,
    editingMaster,
    editingVariant,
    masterAxisFilters,
    scene.masters,
    docFingerprint,
  ])
  const scenePrimaryBreakpoint =
    scene.primaryBreakpoint === 'tablet' ||
    scene.primaryBreakpoint === 'mobile' ||
    scene.primaryBreakpoint === 'desktop'
      ? scene.primaryBreakpoint
      : 'desktop'
  const breakpointBoardLabels = useMemo(
    () => ({
      mobile: t('editor.breakpoint.mobile'),
      tablet: t('editor.breakpoint.tablet'),
      desktop: t('editor.breakpoint.desktop'),
    }),
    [t],
  )
  const expandedRoot = useMemo(() => {
    if (matrixBoardMode && editingMaster && editingVariant) {
      const size = artboardCssSize(activeBreakpoint, activePrintPreset)
      const board = buildMasterBreakpointMatrixBoard(
        editingMaster,
        editingVariant.id,
        activeBreakpoint,
        {
          labels: breakpointBoardLabels,
          primaryLabel: t('editor.breakpointPrimary'),
          primaryBreakpoint: scenePrimaryBreakpoint,
          minHeight: size.height ?? artboardHeight,
        },
      )
      const paintKey = `matrix:${editingMasterId}:${editingVariant.id}:${activeBreakpoint}:${scenePrimaryBreakpoint}`
      return cachedExpandBreakpointBoardForPaint(
        board,
        scene.masters,
        docFingerprint,
        paintKey,
      )
    }
    if (breakpointBoardMode) {
      const size = artboardCssSize(activeBreakpoint, activePrintPreset)
      const compareRoot = editingVariant?.root ?? pageRoot
      const board = buildBreakpointCompareBoard(compareRoot, activeBreakpoint, {
        labels: breakpointBoardLabels,
        primaryLabel: t('editor.breakpointPrimary'),
        primaryBreakpoint: scenePrimaryBreakpoint,
        minHeight: size.height ?? artboardHeight,
      })
      const paintKey = editingVariant
        ? `master:${editingMasterId}:${editingVariant.id}:${activeBreakpoint}`
        : String(activeBreakpoint)
      return cachedExpandBreakpointBoardForPaint(
        board,
        scene.masters,
        docFingerprint,
        paintKey,
      )
    }
    if (masterBoardRoot) return masterBoardRoot
    if (sceneBoardMode) {
      const size = artboardCssSize(activeBreakpoint, activePrintPreset)
      const activePage = boardPagesForScene(scene).find((p) => p.id === activePageId)
      const paintWidth = activePage
        ? resolvePageArtboardWidth(activePage, scene)
        : size.width
      const paintHeight = activePage
        ? resolvePageArtboardHeight(activePage, scene, size.height ?? artboardHeight)
        : (size.height ?? artboardHeight)
      let board = buildSceneBoardForPaint(scene, activePageId, paintWidth, paintHeight, {
        lazyInactivePages: shouldLazyPaintInactiveBoardPages(
          boardPagesForScene(scene).length,
        ),
      })
      board = cachedExpandSceneBoardForPaint(board, scene.masters, docFingerprint)
      return board
    }
    return cachedExpandCompositionScene(scene, docFingerprint)
  }, [
    masterBoardRoot,
    matrixBoardMode,
    breakpointBoardMode,
    breakpointBoardLabels,
    editingMaster,
    editingVariant,
    editingMasterId,
    pageRoot,
    sceneBoardMode,
    scene,
    scenePrimaryBreakpoint,
    activePageId,
    activeBreakpoint,
    activePrintPreset,
    artboardHeight,
    docFingerprint,
    t,
  ])
  const viewRoot = expandedRoot
  const boardCanvasSize = useMemo(() => {
    const size = artboardCssSize(activeBreakpoint, activePrintPreset)
    const activePage = boardPagesForScene(scene).find((p) => p.id === activePageId)
    const paintWidth = activePage
      ? resolvePageArtboardWidth(activePage, scene)
      : size.width
    const paintHeight = activePage
      ? resolvePageArtboardHeight(activePage, scene, size.height ?? artboardHeight)
      : (size.height ?? artboardHeight)
    if (matrixBoardMode && editingMaster) {
      const variantCount = Math.max(1, listMasterVariants(editingMaster).length)
      const bpSize = computeBreakpointBoardCanvasSize(activeBreakpoint, paintHeight)
      return {
        width: bpSize.width,
        height: Math.max(paintHeight, bpSize.height * variantCount + 48 * variantCount),
      }
    }
    if (breakpointBoardMode) {
      return computeBreakpointBoardCanvasSize(activeBreakpoint, paintHeight)
    }
    if (!sceneBoardMode) {
      return { width: paintWidth, height: paintHeight }
    }
    const computed = computeSceneBoardCanvasSize(scene, paintWidth, paintHeight)
    if (boardPagesForScene(scene).length <= 1) {
      return { width: paintWidth, height: Math.max(paintHeight, computed.height) }
    }
    return computed
  }, [
    matrixBoardMode,
    editingMaster,
    breakpointBoardMode,
    sceneBoardMode,
    scene,
    activePageId,
    activeBreakpoint,
    activePrintPreset,
    artboardHeight,
  ])
  const artboardFill = useMemo(() => {
    const fillRoot = editingVariant?.root ?? pageRoot
    if (
      (sceneBoardMode && viewRoot.id === SCENE_BOARD_ID) ||
      (breakpointBoardMode && viewRoot.id === BREAKPOINT_BOARD_ID) ||
      matrixBoardMode
    ) {
      const cascaded = cascadeNodeForBreakpoint(
        fillRoot,
        activeBreakpoint,
        scenePrimaryBreakpoint,
      )
      return resolveArtboardFillCss(
        cascaded.props,
        cascaded.tokenBindings,
        (fillRoot.style ?? {}) as CSSProperties,
        tokenCatalog,
      )
    }
    const cascaded = cascadeNodeForBreakpoint(
      viewRoot,
      activeBreakpoint,
      scenePrimaryBreakpoint,
    )
    return resolveArtboardFillCss(
      cascaded.props,
      cascaded.tokenBindings,
      (viewRoot.style ?? {}) as CSSProperties,
      tokenCatalog,
    )
  }, [
    sceneBoardMode,
    breakpointBoardMode,
    matrixBoardMode,
    viewRoot,
    pageRoot,
    editingVariant,
    activeBreakpoint,
    scenePrimaryBreakpoint,
    tokenCatalog,
  ])
  const selected = useMemo(() => {
    if (editingVariant) {
      return resolveMasterEditInspectSubject(editingVariant.root, selectedId, scene.masters)
    }
    return resolveCachedInspectSubject(scene, selectedId, docFingerprint)
  }, [editingVariant, scene, selectedId, docFingerprint])
  const selectedPersisted = useMemo(() => {
    if (!selectedId) return null
    if (editingVariant) return findNodeInTree(editingVariant.root, selectedId)
    return findNodeInTree(pageRoot, selectedId)
  }, [editingVariant, pageRoot, selectedId])
  const selectedNodes = useMemo(() => {
    if (editingVariant) {
      return selectedIds
        .map((id) =>
          resolveMasterEditInspectSubject(editingVariant.root, id, scene.masters),
        )
        .filter((n): n is NonNullable<typeof n> => Boolean(n))
    }
    return selectedIds
      .map((id) => resolveCachedInspectSubject(scene, id, docFingerprint))
      .filter((n): n is NonNullable<typeof n> => Boolean(n))
  }, [editingVariant, scene, selectedIds, docFingerprint])
  const artboardWidth = boardCanvasSize.width
  const viewportArtboardHeight =
    sceneBoardMode || breakpointBoardMode ? boardCanvasSize.height : artboardHeight
  const inspectRoot = editingVariant ? editingVariant.root : pageRoot
  const layersRoot = inspectRoot
  const primaryLocked = Boolean(
    selectedId &&
      (isSceneBoardNodeId(selectedId) ||
        isBreakpointBoardId(selectedId) ||
        isNodeOrAncestorLocked(inspectRoot, selectedId)),
  )
  const pageFrameSelection =
    Boolean(selectedId && isPageFrameInspectableId(selectedId)) && !editingVariant
  const sceneDefaultArtboardWidth = defaultArtboardWidthForScene(scene)
  const [canvasShellSize, setCanvasShellSize] = useState({ width: 960, height: 640 })

  const selectedRef = useRef(selected)
  const selectionBoundsRef = useRef(selectionBounds)
  const expandedRootRef = useRef(expandedRoot)
  const masterBoardRootRef = useRef(masterBoardRoot)
  const inspectRootRef = useRef(inspectRoot)
  selectedRef.current = selected
  selectionBoundsRef.current = selectionBounds
  expandedRootRef.current = expandedRoot
  masterBoardRootRef.current = masterBoardRoot
  inspectRootRef.current = inspectRoot

  const primaryMark = t('editor.breakpointPrimary')
  const breakpointLabels = {
    mobile:
      scenePrimaryBreakpoint === 'mobile'
        ? `${t('editor.breakpoint.mobile')} · ${primaryMark}`
        : t('editor.breakpoint.mobile'),
    tablet:
      scenePrimaryBreakpoint === 'tablet'
        ? `${t('editor.breakpoint.tablet')} · ${primaryMark}`
        : t('editor.breakpoint.tablet'),
    desktop:
      scenePrimaryBreakpoint === 'desktop'
        ? `${t('editor.breakpoint.desktop')} · ${primaryMark}`
        : t('editor.breakpoint.desktop'),
    print: t('editor.breakpoint.print'),
  } as const

  const refreshSelectionBounds = useCallback(() => {
    if (resizeSession.current) return
    const viewport = viewportRef.current
    if (!viewport || !selectedIds.length) {
      setSelectionBoundsSnapshot(null)
      return
    }
    const z = zoomPanRef.current
    if (selectedIds.length === 1 && selectedId) {
      const bounds = measureNodeBounds(viewport, selectedId)
      if (!bounds) {
        setSelectionBoundsSnapshot(null)
        return
      }
      setSelectionBoundsSnapshot({ bounds, panX: z.panX, panY: z.panY, zoom: z.zoom })
      return
    }
    const parts: Bounds[] = []
    for (const id of selectedIds) {
      if (id === pageRoot.id) continue
      const b = measureNodeBounds(viewport, id)
      if (b) parts.push(b)
    }
    const bounds = unionBounds(parts)
    if (!bounds) {
      setSelectionBoundsSnapshot(null)
      return
    }
    setSelectionBoundsSnapshot({ bounds, panX: z.panX, panY: z.panY, zoom: z.zoom })
  }, [pageRoot.id, selectedId, selectedIds, zoomPanRef])

  useLayoutEffect(() => {
    refreshSelectionBounds()
  }, [refreshSelectionBounds, scene, zoom, artboardWidth])

  useLayoutEffect(() => {
    const shell = viewportRef.current
    if (!shell) return
    const sync = () => {
      const rect = shell.getBoundingClientRect()
      setCanvasShellSize({
        width: Math.max(1, Math.round(rect.width)),
        height: Math.max(1, Math.round(rect.height)),
      })
    }
    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(shell)
    return () => ro.disconnect()
  }, [])

  useLayoutEffect(() => {
    if (sceneBoardMode) return
    const activePage = boardPagesForScene(scene).find((p) => p.id === activePageId)
    if (
      activePage &&
      typeof activePage.frame?.height === 'number' &&
      activePage.frame.height > 0
    ) {
      setArtboardHeight(activePage.frame.height)
      return
    }
    const bpSize = artboardCssSize(activeBreakpoint, activePrintPreset)
    if (activeBreakpoint === 'print' && bpSize.height != null) {
      setArtboardHeight(bpSize.height)
      return
    }
    const viewport = viewportRef.current
    if (!viewport) return
    const pad = viewport.querySelector('.creation-editor-canvas__pad')
    if (!(pad instanceof HTMLElement)) return
    const next = Math.max(640, Math.ceil(pad.scrollHeight + 32))
    setArtboardHeight((h) => (h === next ? h : next))
  }, [sceneBoardMode, scene, activePageId, artboardWidth, zoom, activeBreakpoint, activePrintPreset])

  useLayoutEffect(() => {
    setLeftTab(readLeftTab())
    setLeftTabHydrated(true)
  }, [])

  useEffect(() => {
    if (!leftTabHydrated) return
    try {
      sessionStorage.setItem(LEFT_TAB_KEY, leftTab)
    } catch {
      /* ignore */
    }
  }, [leftTab, leftTabHydrated])



  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => refreshSelectionBounds())
    ro.observe(viewport)
    return () => ro.disconnect()
  }, [refreshSelectionBounds])

  const {
    rejectMutation,
    applyMutatingOp,
    workingRoot,
    runOp,
    runOps,
  } = useEditorMutations({
    sceneRef,
    editingMasterIdRef,
    editingVariantIdRef,
    inspectRootRef,
    pushPresent,
    enqueuePendingOp,
    enqueuePendingOps,
    setSelectedIds,
    setError,
    pushToast,
  })

  const {
    paletteQuery,
    setPaletteQuery,
    patternItems,
    paletteItems,
    paletteGroups,
    onAdd,
    onPaletteDrop,
    onTokenDrop,
  } = useEditorPalette({
    scene,
    sceneRef,
    selectedId,
    workingRoot,
    editingMasterIdRef,
    editingVariantIdRef,
    activeBreakpoint,
    runOps,
    pushPresent,
    setSelectedIds,
    setError,
    t,
  })

  const {
    frameDraggingPageId,
    beginFrameDrag,
    onCanvasPointerDown,
    onCanvasPointerMove,
    endPan,
    onHandlePointerDown,
  } = useEditorPointer({
    sceneRef,
    viewportRef,
    inspectRootRef,
    zoomPanRef,
    panOrigin,
    resizeSession,
    marqueeSession,
    frameDragSession,
    zoom,
    spaceDown,
    activeBreakpoint,
    activePrintPreset,
    artboardHeight,
    selected,
    selectedIds,
    selectionBounds,
    primaryLocked,
    runOp,
    runOps,
    setSelectedIds,
    setPanning,
    setMarquee,
    setSelectionBoundsSnapshot,
    commitViewport,
    refreshSelectionBounds,
  })

  const {
    fitToViewRef,
    fitAllFramesRef,
    fitToActiveFrame,
    fitToAllFrames,
    activateBoardPage,
    cycleActivePage,
  } = useEditorBoardNav({
    scene,
    sceneRef,
    viewportRef,
    sceneBoardMode,
    breakpointBoardMode: breakpointBoardMode || matrixBoardMode,
    boardCanvasSize,
    editingMasterId,
    activeBreakpoint,
    activePrintPreset,
    artboardHeight,
    artboardWidth,
    viewportArtboardHeight,
    commitViewportImmediate,
    applyMutatingOp,
    rejectMutation,
    pushPresent,
    enqueuePendingOp,
    setSelectedIds,
    setError,
  })

  // Entering Compare / Master BP matrix: reset camera so all tiles are in view.
  const wideBoardCameraRef = useRef(false)
  useEffect(() => {
    if (!comparePrefsReady) return
    const wide = breakpointBoardMode || matrixBoardMode
    const entering = wide && !wideBoardCameraRef.current
    wideBoardCameraRef.current = wide
    if (!entering) return
    let cancelled = false
    const outer = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) fitAllFramesRef.current()
      })
    })
    return () => {
      cancelled = true
      cancelAnimationFrame(outer)
    }
  }, [breakpointBoardMode, matrixBoardMode, comparePrefsReady])

  const onBreakpointChangeRef = useRef<(value: string) => void>(() => undefined)
  const { selectNode } = useEditorNodeSelect({
    sceneRef,
    editingMasterIdRef,
    editingVariantIdRef,
    masterBoardRootRef,
    inspectRootRef,
    expandedRootRef,
    activeBreakpointRef,
    onActivateBreakpoint: (bp) => onBreakpointChangeRef.current(bp),
    applyMutatingOp,
    activateMasterVariant,
    upsertMasterBoardCell,
    addMasterVariantFromBoard,
    pushPresent,
    setSelectedIds,
    setError,
  })

  const {
    clipboardRef,
    removeSelectedNodes,
    duplicateSelectedNodes,
    copySelectedNodes,
    pasteSelectedNodes,
    cutSelectedNodes,
    wrapSelected,
    unwrapSelected,
    nudgeSelected,
    moveLayer,
    onReorderDrop,
    onCrossPageLayerDrop,
    nestSelectedIntoPreviousContainer,
    unnestSelected,
    toggleHidden,
    toggleLocked,
  } = useEditorStructure({
    sceneRef,
    selectedIdsRef,
    selectedIdRef,
    selectedRef,
    selectionBoundsRef,
    zoom,
    activeBreakpoint,
    workingRoot,
    applyMutatingOp,
    runOp,
    runOps,
    pushPresent,
    enqueuePendingOp,
    enqueuePendingOps,
    setSelectedIds,
    setError,
    pushToast,
    rejectMutation,
    t,
  })

  const {
    contextMenu,
    contextMenuItems,
    closeContextMenu,
    openEditorContextMenu,
    onCanvasContextMenu,
  } = useEditorContextMenu({
    scene,
    pageRoot,
    selectedIdsRef,
    clipboardLength: () => clipboardRef.current.length,
    workingRoot,
    activeBreakpoint,
    setSelectedIds,
    t,
    actions: {
      cut: () => cutSelectedNodes(),
      copy: () => {
        void copySelectedNodes()
      },
      paste: () => pasteSelectedNodes(),
      duplicate: () => duplicateSelectedNodes(),
      delete: () => removeSelectedNodes(),
      wrapStack: () => wrapSelected('SiteStack'),
      wrapGrid: () => wrapSelected('SiteGrid'),
      unwrap: () => unwrapSelected(),
      resetBreakpoint: () => {
        const current = sceneRef.current
        const primary =
          current.primaryBreakpoint === 'tablet' ||
          current.primaryBreakpoint === 'mobile' ||
          current.primaryBreakpoint === 'desktop'
            ? current.primaryBreakpoint
            : 'desktop'
        const root = workingRoot(current)
        const nodes = selectedIdsRef.current
          .map((id) => findNodeInTree(root, id))
          .filter((n): n is NonNullable<typeof n> => Boolean(n))
        const ops = planResetBreakpointOverrides(
          nodes,
          activeBreakpointRef.current,
          primary,
        )
        if (ops.length) runOps(ops)
      },
      setPrimaryBreakpoint: () => {
        const bp = activeBreakpointRef.current
        if (bp !== 'desktop' && bp !== 'tablet' && bp !== 'mobile') return
        runOp({ op: 'set_primary_breakpoint', breakpoint: bp })
        const label =
          bp === 'tablet'
            ? t('editor.breakpoint.tablet')
            : bp === 'mobile'
              ? t('editor.breakpoint.mobile')
              : t('editor.breakpoint.desktop')
        pushToast({
          message: t('editor.setPrimaryBreakpointDone', { bp: label }),
          tone: 'ok',
          durationMs: 2800,
        })
      },
    },
  })

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.code === 'Space' && !isEditableTarget(e.target)) {
        setSpaceDown(true)
        e.preventDefault()
      }
      if (isEditableTarget(e.target)) return

      const meta = e.metaKey || e.ctrlKey
      const key = e.key.toLowerCase()

      if (meta && key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
        clearPendingSaveOps()
        return
      }
      if (meta && ((key === 'z' && e.shiftKey) || key === 'y')) {
        e.preventDefault()
        redo()
        clearPendingSaveOps()
        return
      }
      if (meta && key === 'd') {
        e.preventDefault()
        duplicateSelectedNodes()
        return
      }
      if (meta && key === 'c') {
        e.preventDefault()
        copySelectedNodes()
        return
      }
      if (!meta && !e.shiftKey && !e.altKey && key === 'c') {
        e.preventDefault()
        setCommentPinMode((prev) => !prev)
        return
      }
      if (meta && key === 'x') {
        e.preventDefault()
        cutSelectedNodes()
        return
      }
      if (meta && key === 'v') {
        e.preventDefault()
        pasteSelectedNodes()
        return
      }
      if (meta && key === 'g' && e.shiftKey) {
        e.preventDefault()
        unwrapSelected()
        return
      }
      if (meta && key === 'g') {
        e.preventDefault()
        wrapSelected('SiteStack')
        return
      }
      if (meta && key === 's') {
        e.preventDefault()
        toastSaveFeedbackRef.current = true
        void onSaveRef.current()
        return
      }
      if (meta && key === 'e') {
        e.preventDefault()
        setCodeExportOpen(true)
        return
      }
      if (meta && e.altKey && key === 'k') {
        e.preventDefault()
        const id = selectedIdRef.current
        if (id && id !== pageRoot.id && !editingMasterIdRef.current) {
          runOp({ op: 'create_master', nodeId: id })
        }
        return
      }
      if (meta && e.altKey && key === 'b') {
        e.preventDefault()
        const id = selectedIdRef.current
        if (id && id !== pageRoot.id && !editingMasterIdRef.current) {
          runOp({ op: 'detach_instance', nodeId: id })
        }
        return
      }
      if (meta && (key === '=' || key === '+')) {
        e.preventDefault()
        stepCanvasZoom('in')
        return
      }
      if (meta && key === '-') {
        e.preventDefault()
        stepCanvasZoom('out')
        return
      }
      if (meta && key === '0') {
        e.preventDefault()
        zoomCanvasAtViewportCenter(1)
        return
      }
      if (e.shiftKey && key === '1' && !meta) {
        e.preventDefault()
        fitToViewRef.current()
        return
      }
      if (meta && e.altKey && e.key === ']' && sceneBoardMode) {
        e.preventDefault()
        cycleActivePage(1)
        return
      }
      if (meta && e.altKey && e.key === '[' && sceneBoardMode) {
        e.preventDefault()
        cycleActivePage(-1)
        return
      }
      // Nest / unnest (Alt+] / Alt+[) — bare [ ] are reserved for rail dock (P74).
      if (e.altKey && e.key === ']' && !meta) {
        e.preventDefault()
        nestSelectedIntoPreviousContainer()
        return
      }
      if (e.altKey && e.key === '[' && !meta) {
        e.preventDefault()
        unnestSelected()
        return
      }

      if (e.key === 'Escape') {
        e.preventDefault()
        setCommentPinMode(false)
        setSelectedIds(replaceSelection(inspectRootRef.current.id))
        return
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        removeSelectedNodes()
        return
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        nudgeSelected('width', -1)
        return
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        nudgeSelected('width', 1)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        nudgeSelected('height', 1)
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        nudgeSelected('height', -1)
        return
      }

    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code === 'Space') setSpaceDown(false)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [stepCanvasZoom, zoomCanvasAtViewportCenter, t])

  const {
    onBreakpointChange,
    onPrintPresetChange,
    applySceneSnapshot,
    reloadSceneFromServer,
  } = useEditorSceneSync({
    sceneId: scene.id,
    activeBreakpoint,
    activePrintPreset,
    activeBreakpointRef,
    activePrintPresetRef,
    savedUpdatedAtRef,
    dirtyRef,
    saveInFlightRef,
    setActiveBreakpoint,
    setActivePrintPreset,
    setEditingMasterId,
    setEditingVariantId,
    setSelectedIds,
    setRemoteUpdateAvailable,
    setStaleConflict,
    setError,
    mutatePresent,
    resetPresent,
    setSavedUpdatedAt,
    syncSavedSceneSnapshot,
    markSaved,
  })
  onBreakpointChangeRef.current = onBreakpointChange

  function setBreakpointCompareEnabled(next: boolean) {
    setBreakpointCompareMode((prev) => {
      if (prev === next) return prev
      if (next && activeBreakpointRef.current === 'print') {
        onBreakpointChangeRef.current('desktop')
      }
      saveBreakpointCompareMode(next)
      return next
    })
  }

  function onBreakpointCompareToggle() {
    setBreakpointCompareMode((prev) => {
      const next = !prev
      if (next && activeBreakpointRef.current === 'print') {
        onBreakpointChangeRef.current('desktop')
      }
      saveBreakpointCompareMode(next)
      return next
    })
  }

  return {
    t,
    siteKitStorybook,
    history,
    scene,
    selectedIds,
    setSelectedIds,
    selectedId,
    activeBreakpoint,
    setActiveBreakpoint,
    activePrintPreset,
    setActivePrintPreset,
    zoom,
    panX,
    panY,
    setPanX,
    setPanY,
    frameDraggingPageId,
    spaceDown,
    panning,
    panMode,
    marquee,
    contextMenu,
    closeContextMenu,
    artboardHeight,
    leftTab,
    setLeftTab,
    editingMasterId,
    setEditingMasterId,
    editingVariantId,
    setEditingVariantId,
    masterAxisFilters,
    setMasterAxisFilters,
    savedFingerprint,
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
    dismissStaleConflict: () => setStaleConflict('dismissed'),
    paletteQuery,
    setPaletteQuery,
    patternItems,
    tokenCatalog,
    brandPack,
    scenePages,
    activePageId,
    activePageImportHtml,
    sceneBoardMode,
    breakpointCompareMode,
    breakpointBoardMode,
    pageRoot,
    viewRoot,
    expandedRoot,
    boardCanvasSize,
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
    clipboardRef,
    selectionBounds,
    paletteItems,
    paletteGroups,
    breakpointLabels,
    editingMaster,
    editingVariant,
    masterBoardRoot,
    publishableMasterCount,
    pullableMasterCount,
    contextMenuItems,
    canUndo: historyCanUndo,
    canRedo: historyCanRedo,
    pushPresent,
    undo,
    redo,
    resetPresent,
    clearPendingSaveOps,
    enqueuePendingOp,
    runOp,
    runOps,
    selectNode,
    removeSelectedNodes,
    duplicateSelectedNodes,
    copySelectedNodes,
    pasteSelectedNodes,
    cutSelectedNodes,
    wrapSelected,
    unwrapSelected,
    openEditorContextMenu,
    onCanvasContextMenu,
    nudgeSelected,
    moveLayer,
    onReorderDrop,
    onCrossPageLayerDrop,
    enterMasterEdit,
    exitMasterEdit,
    activateMasterVariant,
    upsertMasterBoardCell,
    toggleHidden,
    toggleLocked,
    onBreakpointChange,
    onBreakpointCompareToggle,
    setBreakpointCompareEnabled,
    masterMatrixMode,
    setMasterMatrixMode,
    matrixBoardMode,
    scenePrimaryBreakpoint,
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
    fitToActiveFrame,
    fitToAllFrames,
    fitToViewRef,
    fitAllFramesRef,
    activateBoardPage,
    cycleActivePage,
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
    planPaletteDrop,
    planTokenDrop,
    planCrossPageLayerDrop,
    isRealPlatformProjectId,
  }
}
