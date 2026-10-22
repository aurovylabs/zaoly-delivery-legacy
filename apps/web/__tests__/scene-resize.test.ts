import { describe, expect, it } from 'vitest'
import type { SceneNode } from '@zaoly/contracts'
import {
  applyResizeDelta,
  cssLengthToPx,
  nearestSizeTokenPath,
  planNudgeOps,
  planResizeOps,
} from '../lib/scene/resize'
import { applySceneOp } from '../lib/scene/ops'
import { createLegacyFixtureScene } from '../lib/scene/demo-scene'

describe('resize physics', () => {
  it('expands se corner by delta', () => {
    expect(applyResizeDelta({ width: 100, height: 80 }, 'se', 20, 10)).toEqual({
      width: 120,
      height: 90,
    })
  })

  it('shrinks nw corner and clamps min', () => {
    expect(applyResizeDelta({ width: 40, height: 40 }, 'nw', 50, 50)).toEqual({
      width: 24,
      height: 24,
    })
  })

  it('parses rem size tokens to px', () => {
    expect(cssLengthToPx('16rem')).toBe(256)
    expect(cssLengthToPx('auto')).toBeNull()
    expect(nearestSizeTokenPath(40)).toBe('size.control.md')
  })

  it('plans set_style for free px far from tokens', () => {
    const node: SceneNode = { id: 'n1', type: 'Card' }
    const ops = planResizeOps(node, { width: 200, height: 90 }, { width: 120, height: 80 })
    expect(ops.some((o) => o.op === 'set_style' && o.key === 'width' && o.value === 200)).toBe(
      true,
    )
  })

  it('plans token binding when already bound', () => {
    const node: SceneNode = {
      id: 'n1',
      type: 'Card',
      tokenBindings: { width: 'size.logo.min' },
    }
    const ops = planResizeOps(node, { width: 40, height: 80 }, { width: 24, height: 80 })
    const widthOp = ops.find((o) => o.op === 'set_token_binding' && o.key === 'width')
    expect(widthOp).toMatchObject({ op: 'set_token_binding', tokenPath: 'size.control.md' })
  })

  it('nudges numeric width by step', () => {
    const node: SceneNode = { id: 'n1', type: 'Card', style: { width: 100 } }
    const ops = planNudgeOps(node, 'width', 1, 100)
    expect(ops).toEqual([{ op: 'set_style', nodeId: 'n1', key: 'width', value: 108 }])
  })

  it('nudges token-bound width along size ladder', () => {
    const node: SceneNode = {
      id: 'n1',
      type: 'Card',
      tokenBindings: { width: 'size.logo.min' },
    }
    const ops = planNudgeOps(node, 'width', 1, 24)
    expect(ops).toEqual([
      { op: 'set_token_binding', nodeId: 'n1', key: 'width', tokenPath: 'size.control.sm' },
    ])
  })
})

describe('set_style op', () => {
  it('accepts numeric width and clears token binding', () => {
    let scene = createLegacyFixtureScene()
    const bound = applySceneOp(scene, {
      op: 'set_token_binding',
      nodeId: 'title',
      key: 'width',
      tokenPath: 'size.touch.target',
    })
    expect(bound.ok).toBe(true)
    if (!bound.ok) return
    scene = bound.scene
    const styled = applySceneOp(scene, {
      op: 'set_style',
      nodeId: 'title',
      key: 'width',
      value: 180,
    })
    expect(styled.ok).toBe(true)
    if (!styled.ok) return
    const title = styled.scene.root.children?.find((c) => c.id === 'title')
    expect(title?.style?.width).toBe(180)
    expect(title?.tokenBindings?.width).toBeUndefined()
  })

  it('rejects free CSS string via non-number', () => {
    const scene = createLegacyFixtureScene()
    const bad = applySceneOp(scene, {
      op: 'set_style',
      nodeId: 'title',
      key: 'width',
      // @ts-expect-error intentional invalid
      value: '12px',
    })
    expect(bad.ok).toBe(false)
  })
})
