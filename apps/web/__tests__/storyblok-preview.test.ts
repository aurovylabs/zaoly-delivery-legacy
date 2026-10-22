import { describe, expect, it } from 'vitest'
import {
  blokNameToSiteKitType,
  collectionIdFromStoryblokContent,
  storyblokBlokToComposition,
  storyblokContentToComposition,
} from '../lib/storyblok/blok-to-composition'
import { isPublicPath } from '../lib/middleware-public-paths'
import { paths, storyblokPreviewHref } from '../lib/paths'

describe('storyblok preview mapping', () => {
  it('maps site_* blok names to Site Kit types', () => {
    expect(blokNameToSiteKitType('site_button')).toBe('SiteButton')
    expect(blokNameToSiteKitType('site_table_cell')).toBe('SiteTableCell')
    expect(blokNameToSiteKitType('creation_page')).toBe('SiteStack')
  })

  it('maps a nested creation_page tree to CompositionPreview nodes', () => {
    const node = storyblokContentToComposition({
      component: 'creation_page',
      body: [
        {
          component: 'site_stack',
          name: 'Hero',
          token_bindings: JSON.stringify({ gap: 'spacing.static.medium' }),
          body: [
            {
              component: 'site_text',
              children: 'Hello',
              role: 'title',
            },
            {
              component: 'site_button',
              children: 'Go',
              variant: 'primary',
            },
          ],
        },
      ],
    })
    expect(node.type).toBe('SiteStack')
    expect(node.children?.[0]?.type).toBe('SiteStack')
    expect(node.children?.[0]?.style?.gap).toBe('var(--ds-spacing-static-medium)')
    expect(node.children?.[0]?.children?.[0]?.type).toBe('SiteText')
    expect(node.children?.[0]?.children?.[0]?.props.children).toBe('Hello')
    expect(node.children?.[0]?.children?.[1]?.type).toBe('SiteButton')
  })

  it('applies layout snapshot for Creation-like flex rows', () => {
    const node = storyblokBlokToComposition({
      component: 'site_stack',
      layout: JSON.stringify({
        display: 'flex',
        flexDirection: 'row',
        gap: '16px',
        padding: '24px',
        alignItems: 'center',
      }),
      body: [
        { component: 'site_text', children: 'Logo' },
        { component: 'site_button', children: 'CTA' },
      ],
    })
    expect(node?.style?.flexDirection).toBe('row')
    expect(node?.style?.gap).toBe('16px')
    expect(node?.style?.padding).toBe('24px')
    expect(node?.props.direction).toBe('row')
  })

  it('lets token_bindings override layout color keys', () => {
    const node = storyblokBlokToComposition({
      component: 'site_text',
      children: 'Hi',
      layout: JSON.stringify({ color: '#ff0000', fontSize: '24px' }),
      token_bindings: JSON.stringify({ color: 'color.ink.primary' }),
    })
    expect(node?.style?.color).toBe('var(--ds-color-ink-primary)')
    expect(node?.style?.fontSize).toBe('24px')
  })

  it('reads collection_id from creation_page', () => {
    expect(
      collectionIdFromStoryblokContent({
        component: 'creation_page',
        collection_id: '32498667-471e-4b21-b920-5eff5c338300',
        body: [],
      }),
    ).toBe('32498667-471e-4b21-b920-5eff5c338300')
  })

  it('maps leaf bloks without body', () => {
    const leaf = storyblokBlokToComposition({
      component: 'site_image',
      src: 'https://example.test/a.jpg',
      alt: 'A',
    })
    expect(leaf?.type).toBe('SiteImage')
    expect(leaf?.props.src).toContain('example.test')
    expect(leaf?.children).toBeUndefined()
  })
})

describe('storyblok preview paths', () => {
  it('is public for Storyblok iframe (no Creation session)', () => {
    expect(isPublicPath('/preview/storyblok', 'GET')).toBe(true)
    expect(isPublicPath('/preview/storyblok/imported-page', 'GET')).toBe(true)
  })

  it('builds staging preview href with optional Collection', () => {
    expect(storyblokPreviewHref('imported-page')).toBe(
      `${paths.ecosystemStagingZaoly}/preview/storyblok/imported-page`,
    )
    expect(
      storyblokPreviewHref('imported-page', {
        platformProjectId: '32498667-471e-4b21-b920-5eff5c338300',
      }),
    ).toContain('platformProjectId=32498667')
  })
})
