import { describe, expect, it } from 'vitest'
import type { SceneMaster, SceneNode } from '@zaoly/contracts'
import { expandInstanceNode } from '../lib/scene/expand-instances'
import {
  prepareSiteKitCompositionExportRoot,
} from '../lib/site-kit/master-kit-export'
import {
  validateCompositionTree,
  validateNamedCompositionVariants,
} from '../lib/site-kit/composition-write'
import { serializeSiteKitComposition } from '../lib/site-kit/sync-tree'

describe('site-kit instance export', () => {
  const buttonMaster: SceneMaster = {
    id: 'master-btn',
    name: 'Btn',
    root: {
      id: 'btn-root',
      type: 'SiteButton',
      props: { children: 'Go', variant: 'primary' },
    },
  }

  const gridMaster: SceneMaster = {
    id: 'master-grid',
    name: '3col',
    root: {
      id: 'grid-root',
      type: 'SiteGrid',
      props: { columns: 3 },
      children: [
        {
          id: 'slot-a',
          type: 'Instance',
          instanceOf: 'master-btn',
        },
        {
          id: 'slot-b',
          type: 'Instance',
          instanceOf: 'master-btn',
        },
        {
          id: 'slot-c',
          type: 'Instance',
          instanceOf: 'master-btn',
        },
      ],
    },
  }

  const masters = [gridMaster, buttonMaster]

  const pageInstance: SceneNode = {
    id: 'pattern-features',
    type: 'Instance',
    name: 'col3',
    instanceOf: 'master-grid',
  }

  it('expands nested Instances before composition validate', () => {
    const inspectSubject = expandInstanceNode(pageInstance, masters)
    expect(inspectSubject.type).toBe('SiteGrid')
    expect(inspectSubject.children?.some((c) => c.type === 'Instance')).toBe(true)

    const exportRoot = prepareSiteKitCompositionExportRoot(inspectSubject, masters)
    expect(exportRoot.type).toBe('SiteGrid')
    expect(exportRoot.children?.every((c) => c.type === 'SiteButton')).toBe(true)

    const tree = serializeSiteKitComposition(exportRoot)
    expect(validateCompositionTree(tree).ok).toBe(true)
    expect(tree.type).toBe('SiteGrid')
    expect(tree.children).toHaveLength(3)
    expect(tree.children?.every((c) => c.type === 'SiteButton')).toBe(true)
  })

  it('expands Instance root directly', () => {
    const exportRoot = prepareSiteKitCompositionExportRoot(pageInstance, masters)
    expect(validateCompositionTree(serializeSiteKitComposition(exportRoot)).ok).toBe(true)
  })

  it('strips layout inspect keys from props after serialize (direction → style)', () => {
    const stack: SceneNode = {
      id: 'hero-stack',
      type: 'SiteStack',
      props: { direction: 'column', gap: 'md' },
      children: [
        {
          id: 't1',
          type: 'SiteText',
          props: { children: 'Title', role: 'display' },
        },
      ],
    }
    const tree = serializeSiteKitComposition(stack)
    expect(tree.props).not.toHaveProperty('direction')
    expect(tree.style?.flexDirection).toBe('column')
    expect(validateCompositionTree(tree).ok).toBe(true)
  })

  it('rejects Instance type explicitly in serialized tree', () => {
    const bad = validateCompositionTree({ type: 'Instance', props: {} })
    expect(bad.ok).toBe(false)
    if (!bad.ok) expect(bad.error).toContain('Instance')
  })
})
