import { describe, expect, it } from 'vitest'
import type { CompositionScene } from '@zaoly/contracts'
import { analyzeMasterImpact } from '../lib/scene/master-impact'

describe('Master Component Usage Impact & Instance Analytics (P118)', () => {
  it('identifies instances across multiple pages and detects overrides accurately', () => {
    const scene: CompositionScene = {
      id: 'scene_impact_test',
      name: 'Impact Test Scene',
      version: 1,
      updatedAt: '2026-09-08T00:00:00.000Z',
      masters: [
        {
          id: 'master_button',
          name: 'Primary Button',
          root: { id: 'btn_def', type: 'Button', props: { label: 'Click Me' } },
        },
      ],
      pages: [
        {
          id: 'page_home',
          name: 'Home',
          root: {
            id: 'root_home',
            type: 'Stack',
            children: [
              {
                id: 'inst_1',
                type: 'Instance',
                instanceOf: 'master_button',
              },
              {
                id: 'inst_2',
                type: 'Instance',
                instanceOf: 'master_button',
                instanceOverrides: {
                  props: { label: 'Get Started' },
                  style: { backgroundColor: '#ff0000' },
                },
              },
            ],
          },
        },
        {
          id: 'page_checkout',
          name: 'Checkout',
          root: {
            id: 'root_checkout',
            type: 'Stack',
            children: [
              {
                id: 'inst_3',
                type: 'Instance',
                instanceOf: 'master_button',
                instanceVariantId: 'var_outline',
                instanceOverrides: {
                  tokenBindings: { color: 'brand.accent' },
                },
              },
            ],
          },
        },
      ],
      root: { id: 'root_home', type: 'Stack' },
    }

    const report = analyzeMasterImpact(scene, 'master_button')

    expect(report.masterId).toBe('master_button')
    expect(report.masterName).toBe('Primary Button')
    expect(report.totalInstances).toBe(3)
    expect(report.pageCount).toBe(2)

    // Instance 1: No overrides
    const inst1 = report.instances.find((i) => i.instanceNodeId === 'inst_1')
    expect(inst1).toBeDefined()
    expect(inst1?.pageId).toBe('page_home')
    expect(inst1?.hasOverrides).toBe(false)
    expect(inst1?.overrideKeys).toEqual([])

    // Instance 2: Props and Style overrides
    const inst2 = report.instances.find((i) => i.instanceNodeId === 'inst_2')
    expect(inst2).toBeDefined()
    expect(inst2?.pageId).toBe('page_home')
    expect(inst2?.hasOverrides).toBe(true)
    expect(inst2?.overrideKeys).toContain('props.label')
    expect(inst2?.overrideKeys).toContain('style.backgroundColor')

    // Instance 3: Variant + Token override
    const inst3 = report.instances.find((i) => i.instanceNodeId === 'inst_3')
    expect(inst3).toBeDefined()
    expect(inst3?.pageId).toBe('page_checkout')
    expect(inst3?.variantId).toBe('var_outline')
    expect(inst3?.hasOverrides).toBe(true)
    expect(inst3?.overrideKeys).toEqual(['tokenBindings.color'])
  })

  it('handles empty scene and missing master gracefully', () => {
    const emptyScene: CompositionScene = {
      id: 'empty_scene',
      name: 'Empty',
      version: 1,
      updatedAt: '2026-09-08T00:00:00.000Z',
      root: { id: 'root', type: 'Stack' },
    }

    const report = analyzeMasterImpact(emptyScene, 'non_existent')
    expect(report.masterId).toBe('non_existent')
    expect(report.masterName).toBe('Unknown Master')
    expect(report.totalInstances).toBe(0)
    expect(report.pageCount).toBe(0)
    expect(report.instances).toEqual([])
  })
})
