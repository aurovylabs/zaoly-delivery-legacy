import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SceneNodeView } from '../components/scene-node-view'
import { defaultChildForType, isSceneContainerType } from '../lib/scene/ops'
import {
  editorPaletteItems,
  groupCatalogPaletteItems,
  isEditorInsertableType,
  resolveEditorInsertType,
} from '../lib/scene/catalog-palette'
import { isSiteKitPaletteType } from '../lib/scene/site-kit-palette'
import { siteKitArgsFromNode } from '../lib/site-kit/write-client'
import { inspectFieldsForType, hasComponentContract } from '../lib/inspect/field-catalog'

describe('Site Kit editor wiring (atoms-first)', () => {
  it('palette lists atoms only — no SiteHero', () => {
    const items = editorPaletteItems()
    expect(items.some((item) => item.id === 'SiteButton')).toBe(true)
    expect(items.some((item) => item.id === 'SiteImage')).toBe(true)
    expect(items.some((item) => item.id === 'SiteStack')).toBe(true)
    expect(items.some((item) => item.id === 'SiteHero')).toBe(false)
    expect(isEditorInsertableType('SiteButton')).toBe(true)
    expect(isSiteKitPaletteType('SiteHero')).toBe(false)
    expect(resolveEditorInsertType('SiteButton')).toBe('SiteButton')
    const groups = groupCatalogPaletteItems(items)
    expect(groups[0]?.id).toBe('Site')
    expect(groups[0]?.items.every((item) => isSiteKitPaletteType(item.id))).toBe(true)
  })

  it('defaultChildForType seeds SiteButton / SiteStack / SiteImage atoms', () => {
    expect(defaultChildForType('SiteButton')).toMatchObject({
      type: 'SiteButton',
      props: { variant: 'primary', children: 'Get started' },
    })
    expect(defaultChildForType('SiteImage')).toMatchObject({
      type: 'SiteImage',
      props: { alt: 'Image' },
    })
    expect(defaultChildForType('SiteImage').props?.src).toContain('placehold.co')
    const stack = defaultChildForType('SiteStack')
    expect(stack.type).toBe('SiteStack')
    expect(isSceneContainerType('SiteStack')).toBe(true)
    expect(isSceneContainerType('SiteButton')).toBe(false)
    expect(isSceneContainerType('SiteImage')).toBe(false)
  })

  it('renders SiteStack with nested SiteText on canvas', () => {
    const stack = defaultChildForType('SiteStack')
    stack.id = 'stack-1'
    stack.children = [
      {
        id: 't1',
        type: 'SiteText',
        name: 'Title',
        props: { role: 'display', children: 'Hello atoms' },
      },
    ]
    render(
      <SceneNodeView node={stack} selectedIds={[]} onSelect={() => undefined} />,
    )
    expect(screen.queryByTestId('scene-node-unsupported')).toBeNull()
    expect(screen.getByText('Hello atoms')).toBeInTheDocument()
  })

  it('renders SiteImage on canvas and exposes src/alt in inspect', () => {
    const image = defaultChildForType('SiteImage')
    image.id = 'img-1'
    render(
      <SceneNodeView node={image} selectedIds={[]} onSelect={() => undefined} />,
    )
    expect(screen.queryByTestId('scene-node-unsupported')).toBeNull()
    const img = document.querySelector('[data-node-type="SiteImage"] img') as HTMLImageElement
    expect(img).toBeTruthy()
    expect(img.alt).toBe('Image')
    expect(hasComponentContract('SiteImage')).toBe(true)
    const names = inspectFieldsForType('SiteImage').map((f) => f.name)
    expect(names).toEqual(expect.arrayContaining(['src', 'alt', 'name']))
  })

  it('inspect exposes SiteButton label + variant; write args come from props', () => {
    expect(hasComponentContract('SiteButton')).toBe(true)
    const names = inspectFieldsForType('SiteButton').map((f) => f.name)
    expect(names).toEqual(expect.arrayContaining(['children', 'name']))
    expect(names).not.toContain('variant')
    const args = siteKitArgsFromNode({
      id: 'x',
      type: 'SiteButton',
      props: { children: 'Go', variant: 'ghost', padding: '16', textAlign: 'center' },
    })
    expect(args).toEqual({ children: 'Go', variant: 'ghost' })
    expect(args).not.toHaveProperty('padding')
    expect(args).not.toHaveProperty('textAlign')
  })

  it('composition serialize keeps textAlign and token color as CSS', async () => {
    const { serializeSiteKitComposition } = await import('../lib/site-kit/sync-tree')
    const text = defaultChildForType('SiteText')
    text.name = 'Title'
    text.props = { ...text.props, children: 'Right title', textAlign: 'right' }
    text.tokenBindings = { color: 'color.action.primary' }
    const tree = serializeSiteKitComposition(text)
    expect(tree.style?.textAlign).toBe('right')
    expect(tree.style?.color).toBeTruthy()
    expect(tree.tokenBindings?.color).toBe('color.action.primary')
    expect(tree.props).not.toHaveProperty('textAlign')
    expect(tree.props.children).toBe('Right title')
  })

  it('serialize moves inspect paint into style and maps gap enums', async () => {
    const { serializeSiteKitComposition } = await import('../lib/site-kit/sync-tree')
    const stack = defaultChildForType('SiteStack')
    stack.props = {
      ...stack.props,
      direction: 'row',
      gap: 'lg',
      padding: '24',
      alignItems: 'center',
      justifyContent: 'space-between',
    }
    stack.children = [
      {
        id: 'b1',
        type: 'SiteButton',
        props: { variant: 'primary', children: 'CTA', width: '120' },
      },
    ]
    const tree = serializeSiteKitComposition(stack)
    expect(tree.props).toEqual({})
    expect(tree.props).not.toHaveProperty('direction')
    expect(tree.style?.gap).toBe('var(--site-space-5)')
    expect(tree.style?.padding).toBe('24')
    expect(tree.style?.alignItems).toBe('center')
    expect(tree.style?.justifyContent).toBe('space-between')
    expect(tree.style?.display).toBe('flex')
    expect(tree.style?.flexDirection).toBe('row')
    expect(tree.style?.flexWrap).toBe('wrap')
    expect(tree.children?.[0]?.props).toEqual({ variant: 'primary', children: 'CTA' })
    expect(tree.children?.[0]?.style?.width).toBe('120')
  })

  it('serialize keeps an explicit gap enum over a token-bound gap', async () => {
    const { serializeSiteKitComposition } = await import('../lib/site-kit/sync-tree')
    const stack = defaultChildForType('SiteStack')
    stack.props = { ...stack.props, gap: 'sm' }
    stack.tokenBindings = { ...stack.tokenBindings, gap: 'spacing.gap.modules' }
    const tree = serializeSiteKitComposition(stack)
    expect(tree.style?.gap).toBe('var(--site-space-2)')
    expect(tree.tokenBindings?.gap).toBe('spacing.gap.modules')
  })

  it('canvas SiteStack applies align/justify on the flex shell', () => {
    const stack = defaultChildForType('SiteStack')
    stack.id = 'stack-flex'
    stack.props = {
      direction: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
    }
    stack.children = [
      { id: 'a', type: 'SiteButton', props: { children: 'A', variant: 'primary' } },
      { id: 'b', type: 'SiteButton', props: { children: 'B', variant: 'secondary' } },
    ]
    const { container } = render(
      <SceneNodeView node={stack} selectedIds={[]} onSelect={() => undefined} />,
    )
    const shell = container.querySelector('.site-stack') as HTMLElement
    expect(shell).toBeTruthy()
    expect(shell.style.display).toBe('flex')
    expect(shell.style.flexDirection).toBe('row')
    expect(shell.style.alignItems).toBe('flex-end')
    expect(shell.style.justifyContent).toBe('space-between')
    const host = container.querySelector('[data-node-id="stack-flex"]') as HTMLElement
    expect(host.style.alignItems).toBe('')
    expect(host.style.justifyContent).toBe('')
  })

  it('serialize cascades active breakpoint overrides into paint', async () => {
    const { serializeSiteKitComposition } = await import('../lib/site-kit/sync-tree')
    const text = defaultChildForType('SiteText')
    text.props = { ...text.props, children: 'Base', textAlign: 'left' }
    text.breakpoints = {
      tablet: { props: { textAlign: 'center', padding: '8' } },
    }
    const desktop = serializeSiteKitComposition(text, { breakpoint: 'desktop' })
    expect(desktop.style?.textAlign).toBe('left')
    expect(desktop.style?.padding).toBeUndefined()

    const tablet = serializeSiteKitComposition(text, { breakpoint: 'tablet' })
    expect(tablet.style?.textAlign).toBe('center')
    expect(tablet.style?.padding).toBe('8')
    expect(tablet.props).not.toHaveProperty('textAlign')
    expect(tablet.props).not.toHaveProperty('padding')
  })

  it('inspect exposes gap / wrap / columns for layout shells', () => {
    const stack = inspectFieldsForType('SiteStack').map((f) => f.name)
    expect(stack).toEqual(expect.arrayContaining(['direction', 'gap', 'wrap']))
    const grid = inspectFieldsForType('SiteGrid').map((f) => f.name)
    expect(grid).toEqual(expect.arrayContaining(['columns', 'gap']))
  })

  it('serialize maps SiteGrid columns and wrap', async () => {
    const { serializeSiteKitComposition } = await import('../lib/site-kit/sync-tree')
    const grid = defaultChildForType('SiteGrid')
    grid.props = { ...grid.props, columns: '3', gap: 'md' }
    const tree = serializeSiteKitComposition(grid)
    expect(tree.props).not.toHaveProperty('columns')
    expect(tree.style?.display).toBe('grid')
    expect(tree.style?.gridTemplateColumns).toBe(
      'repeat(auto-fit, minmax(min(100%, 14rem), 1fr))',
    )
    expect(tree.style?.gap).toBe('var(--site-space-4)')

    const stack = defaultChildForType('SiteStack')
    stack.props = { direction: 'row', wrap: false }
    const noWrap = serializeSiteKitComposition(stack)
    expect(noWrap.props).not.toHaveProperty('wrap')
    expect(noWrap.style?.flexWrap).toBe('nowrap')
  })

  it('serialize uses live token catalog when provided', async () => {
    const { serializeSiteKitComposition } = await import('../lib/site-kit/sync-tree')
    const text = defaultChildForType('SiteText')
    text.tokenBindings = { color: 'color.action.primary' }
    const live = [
      {
        path: 'color.action.primary',
        group: 'color' as const,
        label: 'Primary',
        preview: '#aabbcc',
        type: 'color',
        value: { digital: { hex: '#aabbcc' } },
      },
    ]
    const tree = serializeSiteKitComposition(text, { tokenCatalog: live })
    expect(tree.style?.color).toBe('#aabbcc')
  })

  it('inspect dedupes Align: shells keep Stack-parity align/justify, leaves keep textAlign', () => {
    const stack = inspectFieldsForType('SiteStack').map((f) => f.name)
    expect(stack).toContain('align')
    expect(stack).toContain('justify')
    expect(stack).not.toContain('textAlign')
    expect(stack).not.toContain('gridTemplateColumns')

    const text = inspectFieldsForType('SiteText').map((f) => f.name)
    expect(text).toContain('textAlign')
    expect(text).toContain('textTransform')
    expect(text).not.toContain('alignItems')
    expect(text).not.toContain('justifyContent')
    expect(text).not.toContain('align')
    expect(text).not.toContain('justify')
  })

  it('P26 paints textTransform on SiteText (including none over label role)', () => {
    render(
      <SceneNodeView
        node={{
          id: 'site-text-transform',
          type: 'SiteText',
          props: {
            children: 'Label case',
            role: 'label',
            textTransform: 'none',
          },
        }}
        selectedIds={[]}
        onSelect={() => undefined}
      />,
    )
    const leaf = document.querySelector('[data-node-type="SiteText"] .site-text') as HTMLElement
    expect(leaf).toBeTruthy()
    expect(leaf.style.textTransform).toBe('none')
  })

  it('SiteSelect exposes options string and seeds defaults', () => {
    const names = inspectFieldsForType('SiteSelect').map((f) => f.name)
    expect(names).toEqual(expect.arrayContaining(['options', 'placeholder']))
    const node = defaultChildForType('SiteSelect')
    expect(node.props?.options).toBe('Option A\nOption B')
    const args = siteKitArgsFromNode(node)
    expect(args.options).toBe('Option A\nOption B')
  })
})
