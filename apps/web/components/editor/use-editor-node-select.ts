'use client'

/**
 * Canvas / board / master-board node selection (W5n).
 * Spec: specs/domain/scene-core-split-w5.md
 */
import type { Dispatch, SetStateAction } from 'react'
import type { CompositionScene, SceneNode, SceneOp } from '@zaoly/contracts'
import { findNodeInTree, resolvePersistedSelectionId, resolveSceneBoardSelectionId } from '../../lib/scene/expand-instances'
import { cachedExpandSceneTree } from '../../lib/scene/expand-cache'
import { resolveMasterBoardClick } from '../../lib/scene/master-variants'
import { sceneDocumentFingerprint } from '../../lib/scene/scene-document-fingerprint'
import {
  SCENE_BOARD_ID,
  resolveSceneBoardClick,
} from '../../lib/scene/scene-board'
import {
  BREAKPOINT_BOARD_ID,
  resolveBreakpointBoardClick,
} from '../../lib/scene/breakpoint-board'
import {
  MATRIX_BOARD_ID,
  resolveMatrixBoardClick,
} from '../../lib/scene/master-breakpoint-matrix'
import type { EditorBreakpoint } from '../../lib/scene/breakpoints'
import {
  resolveActivePage,
  resolveActivePageId,
} from '../../lib/scene/scene-pages'
import { replaceSelection, toggleSelectedId } from '../../lib/scene/selection'
import { dispatchOnboardingAction } from '../../lib/editor/onboarding'
import type { EditorMutateResult } from './use-editor-mutations'

export function useEditorNodeSelect(args: {
  sceneRef: { current: CompositionScene }
  editingMasterIdRef: { current: string | null }
  editingVariantIdRef: { current: string | null }
  masterBoardRootRef: { current: SceneNode | null }
  inspectRootRef: { current: SceneNode }
  expandedRootRef: { current: SceneNode | null | undefined }
  activeBreakpointRef: { current: EditorBreakpoint }
  onActivateBreakpoint: (breakpoint: EditorBreakpoint) => void
  applyMutatingOp: (current: CompositionScene, op: SceneOp) => EditorMutateResult
  activateMasterVariant: (variantId: string) => void
  upsertMasterBoardCell: (combination: Record<string, string>) => void
  addMasterVariantFromBoard: () => void
  pushPresent: (next: CompositionScene, ops?: SceneOp[]) => void
  setSelectedIds: Dispatch<SetStateAction<string[]>>
  setError: (message: string | null) => void
}) {
  const {
    sceneRef,
    editingMasterIdRef,
    editingVariantIdRef,
    masterBoardRootRef,
    inspectRootRef,
    expandedRootRef,
    activeBreakpointRef,
    onActivateBreakpoint,
    applyMutatingOp,
    activateMasterVariant,
    upsertMasterBoardCell,
    addMasterVariantFromBoard,
    pushPresent,
    setSelectedIds,
    setError,
  } = args

  function selectNode(
    id: string,
    mods?: { shiftKey?: boolean; metaKey?: boolean; ctrlKey?: boolean },
  ) {
    const painted = expandedRootRef.current
    // Wave I matrix — before plain Compare / Master board.
    if (painted?.id === MATRIX_BOARD_ID) {
      const resolved = resolveMatrixBoardClick(id)
      if (!resolved) return
      if (resolved.kind === 'variant') {
        activateMasterVariant(resolved.variantId)
        return
      }
      if (resolved.variantId !== editingVariantIdRef.current) {
        activateMasterVariant(resolved.variantId)
      }
      if (resolved.bp !== activeBreakpointRef.current) {
        onActivateBreakpoint(resolved.bp)
      }
      if (resolved.nodeId) {
        setSelectedIds(replaceSelection(resolved.nodeId))
        dispatchOnboardingAction('select')
      }
      return
    }
    // Breakpoint Compare (page or Master-Edit active variant) — before Master board.
    if (painted?.id === BREAKPOINT_BOARD_ID) {
      const resolved = resolveBreakpointBoardClick(id, activeBreakpointRef.current)
      if (resolved.type === 'noop') return
      if (resolved.type === 'activate') {
        onActivateBreakpoint(resolved.breakpoint)
        if (resolved.selectId) {
          setSelectedIds(replaceSelection(resolved.selectId))
          dispatchOnboardingAction('select')
        }
        return
      }
      id = resolved.nodeId
    }
    const board = masterBoardRootRef.current
    const activeRoot = inspectRootRef.current
    const activeVariantId = editingVariantIdRef.current
    if (
      board &&
      activeVariantId &&
      editingMasterIdRef.current &&
      painted?.id !== BREAKPOINT_BOARD_ID &&
      painted?.id !== MATRIX_BOARD_ID
    ) {
      const masters = sceneRef.current.masters
      if (masters?.length && !findNodeInTree(activeRoot, id)) {
        const expandedActive = cachedExpandSceneTree(
          activeRoot,
          masters,
          sceneDocumentFingerprint(sceneRef.current),
        )
        if (findNodeInTree(expandedActive, id)) {
          id = resolvePersistedSelectionId(activeRoot, expandedActive, id)
        } else {
          const resolved = resolveMasterBoardClick(board, activeRoot, activeVariantId, id)
          if (resolved.type === 'noop') return
          if (resolved.type === 'activate') {
            activateMasterVariant(resolved.variantId)
            return
          }
          if (resolved.type === 'upsert') {
            upsertMasterBoardCell(resolved.combination)
            return
          }
          if (resolved.type === 'add') {
            addMasterVariantFromBoard()
            return
          }
          id = resolved.nodeId
        }
      } else {
        const resolved = resolveMasterBoardClick(board, activeRoot, activeVariantId, id)
        if (resolved.type === 'noop') return
        if (resolved.type === 'activate') {
          activateMasterVariant(resolved.variantId)
          return
        }
        if (resolved.type === 'upsert') {
          upsertMasterBoardCell(resolved.combination)
          return
        }
        if (resolved.type === 'add') {
          addMasterVariantFromBoard()
          return
        }
        id = resolved.nodeId
      }
    }
    if (!editingMasterIdRef.current && painted?.id === SCENE_BOARD_ID) {
      const currentScene = sceneRef.current
      const pageId = resolveActivePageId(
        currentScene.pages?.length ? currentScene.pages : [resolveActivePage(currentScene)],
        currentScene.activePageId,
      )
      const resolved = resolveSceneBoardClick(
        painted,
        currentScene,
        pageId,
        id,
      )
      if (resolved.type === 'noop') return
      if (resolved.type === 'activate') {
        const result = applyMutatingOp(currentScene, {
          op: 'set_active_page',
          pageId: resolved.pageId,
        })
        if (!result.ok) {
          setError(result.reason)
          return
        }
        setError(null)
        pushPresent(result.scene)
        const nextSelect = resolved.selectId
          ? resolveSceneBoardSelectionId(
              result.scene,
              painted,
              resolved.selectId,
              result.scene.masters,
            )
          : result.scene.root.id
        setSelectedIds(replaceSelection(nextSelect))
        dispatchOnboardingAction('select')
        return
      }
      id = resolveSceneBoardSelectionId(
        currentScene,
        painted,
        id,
        currentScene.masters,
      )
    }
    const mapped =
      editingMasterIdRef.current || !expandedRootRef.current
        ? id
        : expandedRootRef.current.id === SCENE_BOARD_ID
          ? id
          : resolvePersistedSelectionId(sceneRef.current.root, expandedRootRef.current, id)
    const additive = Boolean(mods?.shiftKey || mods?.metaKey || mods?.ctrlKey)
    if (additive) {
      setSelectedIds((prev) => toggleSelectedId(prev, mapped))
      dispatchOnboardingAction('select')
      return
    }
    setSelectedIds(replaceSelection(mapped))
    dispatchOnboardingAction('select')
  }

  return { selectNode }
}
