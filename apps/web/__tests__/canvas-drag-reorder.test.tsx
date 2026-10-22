// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import React from 'react'
import { render } from '@testing-library/react'
import { dropEdgeFromPoint, applySceneOp } from '../lib/scene/ops'
import { CanvasDropIndicator } from '../components/canvas-drop-indicator'
import type { CompositionScene, SceneNode } from '@zaoly/contracts'

describe('P102: Direct Canvas Drag & Drop and Sibling Reordering', () => {
  describe('dropEdgeFromPoint spatial hit testing', () => {
    it('accurately resolves vertical stack drop edge based on 50% split', () => {
      // Column stack: element at y=100, height=100
      // Hover at y=120 (top 20%) -> 'before' (above)
      const edgeTop = dropEdgeFromPoint(false, 120, 100, 100, 50, 0, 100, 'column')
      expect(edgeTop).toBe('before')

      // Hover at y=180 (bottom 80%) -> 'after' (below)
      const edgeBottom = dropEdgeFromPoint(false, 180, 100, 100, 50, 0, 100, 'column')
      expect(edgeBottom).toBe('after')
    })

    it('accurately resolves horizontal row stack drop edge based on X-axis 50% split', () => {
      // Row stack: element at x=200, width=100
      // Hover at x=220 (left 20%) -> 'before' (to the left)
      const edgeLeft = dropEdgeFromPoint(false, 50, 0, 100, 220, 200, 100, 'row')
      expect(edgeLeft).toBe('before')

      // Hover at x=280 (right 80%) -> 'after' (to the right)
      const edgeRight = dropEdgeFromPoint(false, 50, 0, 100, 280, 200, 100, 'row')
      expect(edgeRight).toBe('after')
    })

    it('resolves container into drop edge when hovering container middle zone', () => {
      // Container element at y=100, height=100, center hover at y=150
      const edgeInto = dropEdgeFromPoint(true, 150, 100, 100, 50, 0, 100, 'column')
      expect(edgeInto).toBe('into')
    })
  })

  describe('CanvasDropIndicator component rendering', () => {
    it('renders 2px horizontal glowing insertion line for column stack', () => {
      const rect = { left: 50, top: 120, width: 300, height: 40 }
      const { getByTestId } = render(
        <CanvasDropIndicator
          visible={true}
          edge="before"
          direction="column"
          rect={rect}
          label="Insert Above"
        />
      )

      const indicator = getByTestId('canvas-drop-indicator-line-before')
      expect(indicator).toBeTruthy()
      expect(indicator.style.left).toBe('50px')
      expect(indicator.style.top).toBe('119px')
      expect(indicator.style.width).toBe('300px')
      expect(indicator.style.height).toBe('2px')
      expect(indicator.textContent).toContain('Insert Above')
    })

    it('renders 2px vertical glowing insertion line for row stack', () => {
      const rect = { left: 100, top: 40, width: 80, height: 48 }
      const { getByTestId } = render(
        <CanvasDropIndicator
          visible={true}
          edge="after"
          direction="row"
          rect={rect}
          label="Insert Right"
        />
      )

      const indicator = getByTestId('canvas-drop-indicator-line-after')
      expect(indicator).toBeTruthy()
      expect(indicator.style.left).toBe('180px')
      expect(indicator.style.top).toBe('40px')
      expect(indicator.style.width).toBe('2px')
      expect(indicator.style.height).toBe('48px')
    })

    it('renders dashed outline container frame for into edge', () => {
      const rect = { left: 40, top: 60, width: 400, height: 200 }
      const { getByTestId } = render(
        <CanvasDropIndicator
          visible={true}
          edge="into"
          rect={rect}
          label="Drop Inside Container"
        />
      )

      const frame = getByTestId('canvas-drop-indicator-into')
      expect(frame).toBeTruthy()
      expect(frame.style.border).toContain('dashed')
      expect(frame.textContent).toContain('Drop Inside Container')
    })
  })

  describe('move_node scene operation mutation', () => {
    it('moves sibling node to new index under same parent', () => {
      const child1: SceneNode = { id: 'c1', type: 'Text' }
      const child2: SceneNode = { id: 'c2', type: 'Button' }
      const child3: SceneNode = { id: 'c3', type: 'Image' }
      const root: SceneNode = { id: 'root', type: 'Stack', children: [child1, child2, child3] }
      const scene: CompositionScene = {
        id: 'test-scene',
        name: 'Test',
        root,
      }

      // Move c3 before c1 (index 0)
      const result = applySceneOp(scene, {
        op: 'move_node',
        nodeId: 'c3',
        parentId: 'root',
        index: 0,
      })

      expect(result.ok).toBe(true)
      if (result.ok) {
        const children = result.scene.root.children ?? []
        expect(children.map((c) => c.id)).toEqual(['c3', 'c1', 'c2'])
      }
    })

    it('reparents node inside a different container', () => {
      const leaf: SceneNode = { id: 'leaf', type: 'Badge' }
      const containerA: SceneNode = { id: 'cont-a', type: 'Stack', children: [leaf] }
      const containerB: SceneNode = { id: 'cont-b', type: 'Stack', children: [] }
      const root: SceneNode = { id: 'root', type: 'Box', children: [containerA, containerB] }
      const scene: CompositionScene = {
        id: 'test-scene',
        name: 'Test',
        root,
      }

      // Move leaf from cont-a into cont-b
      const result = applySceneOp(scene, {
        op: 'move_node',
        nodeId: 'leaf',
        parentId: 'cont-b',
        index: 0,
      })

      expect(result.ok).toBe(true)
      if (result.ok) {
        const contA = result.scene.root.children?.[0]
        const contB = result.scene.root.children?.[1]
        expect(contA?.children?.length).toBe(0)
        expect(contB?.children?.length).toBe(1)
        expect(contB?.children?.[0].id).toBe('leaf')
      }
    })
  })
})
