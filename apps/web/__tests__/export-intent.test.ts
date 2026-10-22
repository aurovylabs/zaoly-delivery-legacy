import { describe, expect, it } from 'vitest'
import type { CompositionScene, SceneNode } from '@zaoly/contracts'
import {
  buildExportIntent,
  formatExportIntentMarkdown,
  resolveExportStorybookHref,
} from '../lib/codegen/export-intent'
import { kitPlaygroundHref } from '../lib/paths'

const root: SceneNode = {
  id: 'hero',
  type: 'SiteStack',
  name: 'Hero',
  children: [],
}

const scene: CompositionScene = {
  id: 'scene-1',
  name: 'Landing',
  version: 1,
  root,
  pages: [{ id: 'page-1', name: 'Home', root }],
  activePageId: 'page-1',
  platformProjectId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
  masters: [{ id: 'm1', name: 'HeroMaster', root }],
  updatedAt: '2026-09-14T00:00:00.000Z',
}

describe('export-intent', () => {
  it('builds intent with Collection, breakpoint, Kit, and gaps', () => {
    const intent = buildExportIntent({
      scene,
      target: root,
      scope: 'page',
      format: 'react',
      consumer: 'site-kit',
      activePageId: 'page-1',
      breakpoint: 'tablet',
      kitExplore: {
        componentId: 'SiteStack',
        href: kitPlaygroundHref({
          componentId: 'SiteStack',
          platformProjectId: scene.platformProjectId,
        }),
      },
      ready: false,
      blockers: [
        {
          id: 'i1',
          code: 'DS-TOKEN-UNBOUND',
          severity: 'info',
          message: 'unbound',
          nodeId: 'hero',
          nodeName: 'Hero',
        },
      ],
      storybookOrigin: 'https://creation-site-kit.projects-a.plygrnd.tech',
    })

    expect(intent.collectionId).toBe(scene.platformProjectId)
    expect(intent.breakpoint).toBe('tablet')
    expect(intent.pageName).toBe('Home')
    expect(intent.kitComponentId).toBe('SiteStack')
    expect(intent.gapCodes).toEqual(['DS-TOKEN-UNBOUND'])
    expect(intent.storybookHref).toContain('site-stack--default')

    const md = formatExportIntentMarkdown(intent)
    expect(md).toContain('- Scope: page')
    expect(md).toContain('- Gaps: DS-TOKEN-UNBOUND')
    expect(md).toContain('- Ready for eng: no')
  })

  it('resolves Master when target is an Instance', () => {
    const instance: SceneNode = {
      id: 'inst-1',
      type: 'Instance',
      name: 'HeroInstance',
      instanceOf: 'm1',
    }
    const intent = buildExportIntent({
      scene,
      target: instance,
      scope: 'selection',
      format: 'react',
      consumer: 'site-kit',
      kitExplore: { componentId: 'Composition~x~Hero', href: '/kit?componentId=Composition%7Ex%7EHero' },
      ready: true,
      blockers: [],
    })
    expect(intent.masterId).toBe('m1')
    expect(intent.masterName).toBe('HeroMaster')
  })

  it('builds Storybook Live href for Composition componentIds', () => {
    const href = resolveExportStorybookHref({
      storybookOrigin: 'https://creation-site-kit.projects-a.plygrnd.tech',
      componentId: 'Composition~aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee~Hero',
    })
    expect(href).toContain('compositions-live--default')
    expect(href).toContain('componentId:')
  })
})
