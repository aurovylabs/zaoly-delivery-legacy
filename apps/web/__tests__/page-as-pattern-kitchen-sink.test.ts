/**
 * Kitchen-sink regression: every Inspect shared/style prop must survive Save page as Pattern.
 * Spec: page-as-pattern.md — stop whack-a-mole on unknown prop / non–Site-Kit type.
 */
import { describe, expect, it } from 'vitest'
import { contractPropsForType } from '@zaoly/contracts'
import type { CompositionScene, SceneNode } from '@zaoly/contracts'
import { SITE_KIT_ALLOWED_PROPS } from '@zaoly/site-kit/composition-codegen'
import { INSTANCE_TYPE } from '../lib/scene/expand-instances'
import { SITE_KIT_PALETTE_IDS } from '../lib/scene/site-kit-palette'
import { prepareCompositionFromPage } from '../lib/site-kit/prepare-composition-from-page'
import { stripSiteKitPaintProps } from '../lib/site-kit/sync-tree'

const PLATFORM_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'

function samplePropValue(name: string): unknown {
  if (name.startsWith('aria') && name !== 'ariaLabel') return false
  if (name === 'disabled' || name === 'required' || name === 'readOnly' || name === 'ariaHidden') {
    return true
  }
  if (name === 'columns' || name === 'zIndex' || name === 'order' || name === 'tabIndex') return '2'
  if (name === 'flexGrow' || name === 'flexShrink') return '1'
  if (name === 'direction') return 'column'
  if (name === 'wrap') return true
  if (name === 'mark') return 'triangle'
  if (name === 'markup') return '<svg viewBox="0 0 48 48"><path d="M0 0h48v48H0z"/></svg>'
  if (name === 'viewBox') return '0 0 48 48'
  if (name === 'src' || name === 'href') return 'https://example.test/x'
  if (name === 'alt' || name === 'title' || name === 'placeholder' || name === 'ariaLabel') {
    return 'Sample'
  }
  if (name === 'children' || name === 'label' || name === 'text') return 'Sample'
  if (name === 'variant' || name === 'role') return 'body'
  if (name === 'gap' || name === 'rowGap' || name === 'columnGap') return 'md'
  return '8px'
}

function kitchenSinkProps(type: string): Record<string, unknown> {
  const props: Record<string, unknown> = {}
  for (const field of contractPropsForType(type)) {
    // Never overwrite structural children arrays — those live on node.children.
    if (field.name === 'children') continue
    props[field.name] = samplePropValue(field.name)
  }
  // Force classic failure modes even if contract list drifts.
  props.zIndex = '3'
  props.rowGap = '12px'
  props.columnGap = '8px'
  props.position = 'relative'
  props.top = '4px'
  if (type === 'SiteSvg') props.mark = 'triangle'
  return props
}

function pageScene(root: SceneNode, masters: CompositionScene['masters'] = []): CompositionScene {
  return {
    id: 'scene-kitchen-sink',
    name: 'Kitchen sink',
    version: 1,
    updatedAt: '2026-09-12T12:00:00.000Z',
    platformProjectId: PLATFORM_ID,
    root,
    pages: [{ id: 'page-home', name: 'Home Page', root }],
    activePageId: 'page-home',
    masters,
  }
}

describe('Save page as Pattern — challenge inspect leaks', () => {
  it('stripSiteKitPaintProps drops inspect paint keys for SiteStack', () => {
    const stripped = stripSiteKitPaintProps(
      {
        ...kitchenSinkProps('SiteStack'),
        name: 'Hero',
        children: 'nope',
      },
      'SiteStack',
    )
    expect(stripped).toEqual({ name: 'Hero', children: 'nope' })
    expect(stripped.zIndex).toBeUndefined()
    expect(stripped.rowGap).toBeUndefined()
    expect(stripped.position).toBeUndefined()
  })

  it('prepares a page with every Site Kit palette type + full inspect prop dump', () => {
    const children: SceneNode[] = SITE_KIT_PALETTE_IDS.filter(
      (t) => !['SiteTable', 'SiteTableRow', 'SiteTableCell'].includes(t),
    ).map((type, i) => ({
      id: `atom-${i}`,
      type,
      props: kitchenSinkProps(type),
    }))

    // Nested Master still carrying editor Stack chrome.
    children.push({
      id: 'inst-legacy',
      type: INSTANCE_TYPE,
      instanceOf: 'master-legacy',
    })

    // Free editor aliases that used to fail validate.
    children.push({
      id: 'wrap-legacy',
      type: 'Stack',
      props: kitchenSinkProps('SiteStack'),
      children: [
        { id: 'heading', type: 'Heading', props: { text: 'Hi', level: 2 } },
        { id: 'btn', type: 'Button', props: { label: 'Go' } },
        { id: 'grid', type: 'Grid', props: { columns: 2, gap: 'md' }, children: [] },
      ],
    })

    const root: SceneNode = {
      id: 'root-home',
      type: 'SiteStack',
      props: kitchenSinkProps('SiteStack'),
      children,
    }

    const scene = pageScene(root, [
      {
        id: 'master-legacy',
        name: 'LegacyBlock',
        root: {
          id: 'legacy-root',
          type: 'Stack',
          props: kitchenSinkProps('SiteStack'),
          children: [
            {
              id: 'legacy-svg',
              type: 'SiteSvg',
              props: kitchenSinkProps('SiteSvg'),
            },
          ],
        },
      },
    ])

    const prepared = prepareCompositionFromPage({
      scene,
      pageId: 'page-home',
      name: 'KitchenSinkPage',
    })
    expect(prepared.ok).toBe(true)
    if (!prepared.ok) {
      // Surface the exact validate error if this regresses.
      expect(prepared).toEqual({ ok: true })
      return
    }
    const json = JSON.stringify(prepared.root)
    expect(json).not.toContain('"type":"Stack"')
    expect(json).not.toContain('"type":"Grid"')
    expect(json).not.toContain('"type":"Heading"')
    expect(json).not.toContain('"type":"Button"')
    expect(json).not.toMatch(/"mark"\s*:/)
    expect(prepared.root.props.zIndex).toBeUndefined()
    expect(prepared.root.props.rowGap).toBeUndefined()
  })
})
