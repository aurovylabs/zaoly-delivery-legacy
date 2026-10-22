/** @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { CompositionScene, SceneOp } from '@zaoly/contracts'
import { useEditorCanvasCallbacks } from '../components/editor/use-editor-canvas-callbacks'
import { INSTANCE_EXPAND_SEP } from '../lib/scene/instance-descendants'
import {
  createZaolyDefaultLandingScene,
  ZAOLY_DEFAULT_LANDING_HERO_STAGE_ID,
} from '../lib/scene/zaoly-default-landing-scene'

describe('useEditorCanvasCallbacks onSetProp', () => {
  it('commits expand-id children writes for nested Instance text (landing headline)', () => {
    const scene = createZaolyDefaultLandingScene()
    const sceneRef = { current: scene }
    const editingMasterIdRef = { current: null as string | null }
    const runOp = vi.fn()
    const expandId = `${ZAOLY_DEFAULT_LANDING_HERO_STAGE_ID}${INSTANCE_EXPAND_SEP}inst-zaoly-landing-headline`

    const { result } = renderHook(() =>
      useEditorCanvasCallbacks({
        sceneRef: sceneRef as React.RefObject<CompositionScene>,
        editingMasterIdRef: editingMasterIdRef as React.RefObject<string | null>,
        editingVariantIdRef: { current: null },
        layerDragIdRef: { current: null },
        workingRoot: (s) => s.root,
        isNodeOrAncestorLocked: () => false,
        findPageIdForNode: () => undefined,
        runOp: runOp as (op: SceneOp) => void,
        onPaletteDrop: () => {},
        onTokenDrop: () => {},
        onCrossPageLayerDrop: () => {},
      }),
    )

    act(() => {
      result.current.onSetProp(expandId, 'children', 'Canvas headline edit')
    })

    expect(runOp).toHaveBeenCalledWith({
      op: 'set_prop',
      nodeId: expandId,
      key: 'children',
      value: 'Canvas headline edit',
    })
  })

  it('still no-ops unknown ids outside Master-Edit', () => {
    const scene = createZaolyDefaultLandingScene()
    const runOp = vi.fn()
    const { result } = renderHook(() =>
      useEditorCanvasCallbacks({
        sceneRef: { current: scene } as React.RefObject<CompositionScene>,
        editingMasterIdRef: { current: null } as React.RefObject<string | null>,
        editingVariantIdRef: { current: null },
        layerDragIdRef: { current: null },
        workingRoot: (s) => s.root,
        isNodeOrAncestorLocked: () => false,
        findPageIdForNode: () => undefined,
        runOp: runOp as (op: SceneOp) => void,
        onPaletteDrop: () => {},
        onTokenDrop: () => {},
        onCrossPageLayerDrop: () => {},
      }),
    )

    act(() => {
      result.current.onSetProp('totally-missing-node', 'children', 'nope')
    })
    expect(runOp).not.toHaveBeenCalled()
  })
})
