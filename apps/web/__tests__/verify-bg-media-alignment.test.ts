import { describe, expect, it } from 'vitest'
import type { SceneNode } from '@zaoly/contracts'
import {
  planSpatialAlignOps,
  planSpatialDistributeOps,
  type NodeSpatialBox,
} from '../lib/scene/spatial-align'
import { resolveNodePaintStyle } from '../lib/inspect/resolve-bindings'
import { hasBackgroundMedia, shouldAutoExpandFillGroup } from '../lib/inspect/fill-groups'

describe('planSpatialAlignOps', () => {
  const nodeA: SceneNode = { id: 'node-a', type: 'Box', props: { position: 'relative', left: '10px', top: '20px' } }
  const nodeB: SceneNode = { id: 'node-b', type: 'Box', props: { position: 'relative', left: '80px', top: '100px' } }

  const boxes: NodeSpatialBox[] = [
    { node: nodeA, box: { left: 10, top: 20, width: 40, height: 30 } },
    { node: nodeB, box: { left: 80, top: 100, width: 60, height: 50 } },
  ]

  it('aligns nodes left to minLeft (10px)', () => {
    const ops = planSpatialAlignOps(boxes, 'left')
    expect(ops).toHaveLength(1) // nodeA already at 10px
    expect(ops[0]).toEqual({
      op: 'set_prop',
      nodeId: 'node-b',
      key: 'left',
      value: '10px',
    })
  })

  it('aligns nodes right to maxRight (140px)', () => {
    const ops = planSpatialAlignOps(boxes, 'right')
    // nodeA should move to 140 - 40 = 100px (+90px)
    // nodeB should move to 140 - 60 = 80px (already at 80px)
    expect(ops).toHaveLength(1)
    expect(ops[0]).toEqual({
      op: 'set_prop',
      nodeId: 'node-a',
      key: 'left',
      value: '100px',
    })
  })

  it('aligns nodes center to midX', () => {
    // minLeft = 10, maxRight = 140 -> midX = 75
    // nodeA target = 75 - 20 = 55px (cur 10, delta +45 -> 55px)
    // nodeB target = 75 - 30 = 45px (cur 80, delta -35 -> 45px)
    const ops = planSpatialAlignOps(boxes, 'center')
    expect(ops).toHaveLength(2)
    expect(ops[0]).toEqual({
      op: 'set_prop',
      nodeId: 'node-a',
      key: 'left',
      value: '55px',
    })
    expect(ops[1]).toEqual({
      op: 'set_prop',
      nodeId: 'node-b',
      key: 'left',
      value: '45px',
    })
  })

  it('aligns nodes top to minTop (20px)', () => {
    const ops = planSpatialAlignOps(boxes, 'top')
    expect(ops).toHaveLength(1)
    expect(ops[0]).toEqual({
      op: 'set_prop',
      nodeId: 'node-b',
      key: 'top',
      value: '20px',
    })
  })

  it('aligns nodes bottom to maxBottom (150px)', () => {
    // minTop = 20, maxBottom = 150
    // nodeA target = 150 - 30 = 120px (cur 20, delta +100 -> 120px)
    // nodeB target = 150 - 50 = 100px (already at 100px)
    const ops = planSpatialAlignOps(boxes, 'bottom')
    expect(ops).toHaveLength(1)
    expect(ops[0]).toEqual({
      op: 'set_prop',
      nodeId: 'node-a',
      key: 'top',
      value: '120px',
    })
  })

  it('aligns nodes middle to midY', () => {
    // minTop = 20, maxBottom = 150 -> midY = 85
    // nodeA target = 85 - 15 = 70px (cur 20, delta +50 -> 70px)
    // nodeB target = 85 - 25 = 60px (cur 100, delta -40 -> 60px)
    const ops = planSpatialAlignOps(boxes, 'middle')
    expect(ops).toHaveLength(2)
    expect(ops[0]).toEqual({
      op: 'set_prop',
      nodeId: 'node-a',
      key: 'top',
      value: '70px',
    })
    expect(ops[1]).toEqual({
      op: 'set_prop',
      nodeId: 'node-b',
      key: 'top',
      value: '60px',
    })
  })

  it('handles canvas zoom scaling correctly', () => {
    const zoom = 2
    // targetX for nodeB is 10, screen box.left is 80, delta is (10 - 80) / 2 = -35
    // curLeft is 80 -> newLeft = 45px
    const ops = planSpatialAlignOps(boxes, 'left', 'desktop', zoom)
    expect(ops[0]).toEqual({
      op: 'set_prop',
      nodeId: 'node-b',
      key: 'left',
      value: '45px',
    })
  })

  it('sets position relative if node has no position defined', () => {
    const unpositionedNode: SceneNode = { id: 'node-c', type: 'Box' }
    const ops = planSpatialAlignOps(
      [
        { node: nodeA, box: { left: 0, top: 0, width: 50, height: 50 } },
        { node: unpositionedNode, box: { left: 100, top: 0, width: 50, height: 50 } },
      ],
      'left',
    )
    expect(ops).toContainEqual({
      op: 'set_prop',
      nodeId: 'node-c',
      key: 'position',
      value: 'relative',
    })
  })
})

describe('planSpatialDistributeOps', () => {
  const node1: SceneNode = { id: 'node-1', type: 'Box', props: { position: 'relative', left: '0px', top: '0px' } }
  const node2: SceneNode = { id: 'node-2', type: 'Box', props: { position: 'relative', left: '50px', top: '40px' } }
  const node3: SceneNode = { id: 'node-3', type: 'Box', props: { position: 'relative', left: '200px', top: '160px' } }

  const boxes: NodeSpatialBox[] = [
    { node: node1, box: { left: 0, top: 0, width: 20, height: 20 } },
    { node: node2, box: { left: 50, top: 40, width: 20, height: 20 } },
    { node: node3, box: { left: 200, top: 160, width: 20, height: 20 } },
  ]

  it('returns empty array if fewer than 3 nodes', () => {
    expect(planSpatialDistributeOps(boxes.slice(0, 2), 'horizontal')).toEqual([])
  })

  it('distributes 3 nodes evenly along horizontal axis', () => {
    // first = 0, last = 200 + 20 = 220 -> totalSpan = 220
    // totalWidths = 20 + 20 + 20 = 60
    // gap = (220 - 60) / 2 = 80px
    // node 1: left = 0 (unchanged)
    // node 2: left = 0 + 20 + 80 = 100px (cur 50, delta +50 -> 100px)
    // node 3: left = 100 + 20 + 80 = 200px (unchanged)
    const ops = planSpatialDistributeOps(boxes, 'horizontal')
    expect(ops).toHaveLength(1)
    expect(ops[0]).toEqual({
      op: 'set_prop',
      nodeId: 'node-2',
      key: 'left',
      value: '100px',
    })
  })

  it('distributes 3 nodes evenly along vertical axis', () => {
    // first = 0, last = 160 + 20 = 180 -> totalSpan = 180
    // totalHeights = 20 + 20 + 20 = 60
    // gap = (180 - 60) / 2 = 60px
    // node 1: top = 0
    // node 2: top = 0 + 20 + 60 = 80px (cur 40, delta +40 -> 80px)
    // node 3: top = 80 + 20 + 60 = 160px
    const ops = planSpatialDistributeOps(boxes, 'vertical')
    expect(ops).toHaveLength(1)
    expect(ops[0]).toEqual({
      op: 'set_prop',
      nodeId: 'node-2',
      key: 'top',
      value: '80px',
    })
  })
})

describe('Container Background Media & Fills', () => {
  it('resolves background-image with url wrapping and styles', () => {
    const style = resolveNodePaintStyle({
      backgroundImage: 'https://images.unsplash.com/photo-1',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    })

    expect(style.backgroundImage).toBe('url("https://images.unsplash.com/photo-1")')
    expect(style.backgroundSize).toBe('cover')
    expect(style.backgroundPosition).toBe('center')
    expect(style.backgroundRepeat).toBe('no-repeat')
  })

  it('resolves background-image layered with backgroundOverlay', () => {
    const style = resolveNodePaintStyle({
      backgroundImage: 'https://images.unsplash.com/photo-1',
      backgroundOverlay: 'rgba(0, 0, 0, 0.5)',
    })

    expect(style.backgroundImage).toBe('rgba(0, 0, 0, 0.5), url("https://images.unsplash.com/photo-1")')
  })

  it('does not double-wrap if already formatted as url(...)', () => {
    const style = resolveNodePaintStyle({
      backgroundImage: 'url("https://example.com/image.jpg")',
    })

    expect(style.backgroundImage).toBe('url("https://example.com/image.jpg")')
  })

  it('detects background media keys in fill groups', () => {
    expect(hasBackgroundMedia({})).toBe(false)
    expect(hasBackgroundMedia({ props: { backgroundImage: 'https://example.com/pic.jpg' } })).toBe(true)
    expect(shouldAutoExpandFillGroup({ props: { backgroundImage: 'https://example.com/pic.jpg' } })).toBe(true)
  })
})
