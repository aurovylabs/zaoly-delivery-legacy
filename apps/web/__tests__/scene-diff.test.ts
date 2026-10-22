import { describe, expect, it } from 'vitest'
import type { CompositionScene } from '@zaoly/contracts'
import { compareScenes, diffNodePair } from '../lib/scene/scene-diff'

describe('Scene Version Diffing (P117)', () => {
  it('detects property and tokenBinding mutations on identical node IDs', () => {
    const baseNode = {
      id: 'btn_1',
      type: 'Button',
      props: { label: 'Submit', size: 'md' },
      style: { backgroundColor: '#ffffff' },
      tokenBindings: { backgroundColor: 'brand.primary' },
    }

    const targetNode = {
      id: 'btn_1',
      type: 'Button',
      props: { label: 'Click Me', size: 'md' },
      style: { backgroundColor: '#000000' },
      tokenBindings: { backgroundColor: 'brand.accent' },
    }

    const diff = diffNodePair(baseNode, targetNode)

    expect(diff.kind).toBe('modified')
    expect(diff.propertyDiffs).toHaveLength(3)

    const labelDiff = diff.propertyDiffs.find((p) => p.key === 'label')
    expect(labelDiff).toEqual({
      key: 'label',
      kind: 'prop',
      oldValue: 'Submit',
      newValue: 'Click Me',
    })

    const tokenDiff = diff.propertyDiffs.find((p) => p.key === 'backgroundColor' && p.kind === 'tokenBinding')
    expect(tokenDiff).toEqual({
      key: 'backgroundColor',
      kind: 'tokenBinding',
      oldValue: 'brand.primary',
      newValue: 'brand.accent',
    })
  })

  it('computes aggregate added, removed, and modified counts across scenes', () => {
    const baseScene: CompositionScene = {
      id: 'scene_1',
      name: 'Base Version',
      version: 1,
      updatedAt: '2026-09-08T00:00:00.000Z',
      root: {
        id: 'root',
        type: 'Stack',
        children: [
          { id: 'node_1', type: 'Text', props: { content: 'Old Header' } },
          { id: 'node_2', type: 'Button', props: { label: 'Delete Me' } },
        ],
      },
    }

    const targetScene: CompositionScene = {
      id: 'scene_1',
      name: 'Target Version',
      version: 1,
      updatedAt: '2026-09-08T01:00:00.000Z',
      root: {
        id: 'root',
        type: 'Stack',
        children: [
          { id: 'node_1', type: 'Text', props: { content: 'New Header' } }, // modified
          { id: 'node_3', type: 'Card', props: { title: 'New Card' } }, // added
          // node_2 removed
        ],
      },
    }

    const diffResult = compareScenes(baseScene, targetScene)

    expect(diffResult.totalAdded).toBe(1)
    expect(diffResult.totalRemoved).toBe(1)
    expect(diffResult.totalModified).toBe(1)

    expect(diffResult.pages).toHaveLength(1)
    const pageDiff = diffResult.pages[0]
    expect(pageDiff.addedCount).toBe(1)
    expect(pageDiff.removedCount).toBe(1)
    expect(pageDiff.modifiedCount).toBe(1)

    const addedNode = pageDiff.nodeDiffs.find((n) => n.kind === 'added')
    expect(addedNode?.nodeId).toBe('node_3')

    const removedNode = pageDiff.nodeDiffs.find((n) => n.kind === 'removed')
    expect(removedNode?.nodeId).toBe('node_2')

    const modifiedNode = pageDiff.nodeDiffs.find((n) => n.kind === 'modified')
    expect(modifiedNode?.nodeId).toBe('node_1')
  })

  it('handles added and removed pages cleanly', () => {
    const baseScene: CompositionScene = {
      id: 'scene_2',
      name: 'Multi-page Base',
      version: 1,
      updatedAt: '2026-09-08T00:00:00.000Z',
      pages: [
        {
          id: 'page_a',
          name: 'Page A',
          root: { id: 'root_a', type: 'Stack', children: [{ id: 'n1', type: 'Text' }] },
        },
      ],
      root: { id: 'root_a', type: 'Stack' },
    }

    const targetScene: CompositionScene = {
      id: 'scene_2',
      name: 'Multi-page Target',
      version: 1,
      updatedAt: '2026-09-08T01:00:00.000Z',
      pages: [
        {
          id: 'page_b',
          name: 'Page B',
          root: { id: 'root_b', type: 'Stack', children: [{ id: 'n2', type: 'Button' }] },
        },
      ],
      root: { id: 'root_b', type: 'Stack' },
    }

    const diffResult = compareScenes(baseScene, targetScene)

    // page_a removed (2 nodes: root_a, n1), page_b added (2 nodes: root_b, n2)
    expect(diffResult.totalRemoved).toBe(2)
    expect(diffResult.totalAdded).toBe(2)
    expect(diffResult.pages).toHaveLength(2)
  })
})
