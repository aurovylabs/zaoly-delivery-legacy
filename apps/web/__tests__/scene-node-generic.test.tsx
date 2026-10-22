import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SceneNodeView } from '../components/scene-node-view'
import { catalogComponent } from '@zaoly/ui/catalog-registry'
import { CATALOG_GENERIC_VARS } from '../lib/scene/catalog-generic-grain'

describe('SceneNodeView catalog fallback', () => {
  it('renders ChatBlockPanel via catalogComponent (not the Print/slot switch)', () => {
    expect(catalogComponent('ChatBlockPanel')).toBeTruthy()
    render(
      <SceneNodeView
        node={{
          id: 'chat-block-1',
          type: 'ChatBlockPanel',
          props: { title: 'Generic catalog panel' },
        }}
        selectedIds={[]}
        onSelect={() => undefined}
      />,
    )
    expect(screen.queryByTestId('scene-node-unsupported')).toBeNull()
    const host = document.querySelector('[data-node-type="ChatBlockPanel"]')
    expect(host).toBeTruthy()
    expect(host?.querySelector('[data-zaoly-chat-block]')).toBeTruthy()
    expect(screen.getByText('Generic catalog panel')).toBeInTheDocument()
  })

  it('paints closed alignment props onto generic catalog style immediately', () => {
    render(
      <SceneNodeView
        node={{
          id: 'chat-block-2',
          type: 'ChatBlockPanel',
          props: { title: 'Aligned', textAlign: 'right' },
        }}
        selectedIds={[]}
        onSelect={() => undefined}
      />,
    )
    const el = document.querySelector('[data-zaoly-chat-block]') as HTMLElement
    expect(el).toBeTruthy()
    expect(el.style.textAlign).toBe('right')
  })

  it('paints fill, radius, and type onto wrap CSS vars for inner DS surfaces', () => {
    render(
      <SceneNodeView
        node={{
          id: 'chat-block-3',
          type: 'ChatBlockPanel',
          props: {
            title: 'Painted',
            background: '#112233',
            radius: '12px',
            color: '#abcdef',
            fontSize: '20px',
          },
        }}
        selectedIds={[]}
        onSelect={() => undefined}
      />,
    )
    const wrap = document.querySelector('[data-node-type="ChatBlockPanel"]') as HTMLElement
    expect(wrap).toBeTruthy()
    expect(wrap.className).toContain('creation-scene-node--catalog-generic')
    expect(wrap.getAttribute('data-catalog-fill')).toBe('true')
    expect(wrap.getAttribute('data-catalog-radius')).toBe('true')
    expect(wrap.getAttribute('data-catalog-typo')).toBe('true')
    expect(wrap.style.getPropertyValue(CATALOG_GENERIC_VARS.fill)).toBe('#112233')
    expect(wrap.style.getPropertyValue(CATALOG_GENERIC_VARS.radius)).toBe('12px')
    expect(wrap.style.getPropertyValue(CATALOG_GENERIC_VARS.color)).toBe('#abcdef')
    expect(wrap.style.getPropertyValue(CATALOG_GENERIC_VARS.fontSize)).toBe('20px')
    expect(wrap.querySelector('.ds-panel, [class*="__surface"]')).toBeTruthy()
  })

  it('paints TokenPicker fill with empty props.background (operator clipboard shape)', () => {
    render(
      <SceneNodeView
        node={{
          id: 'chatblockpanel-msxcyyf1-47',
          type: 'ChatBlockPanel',
          props: { background: '' },
          tokenBindings: { background: 'color.action.accent' },
        }}
        selectedIds={[]}
        onSelect={() => undefined}
      />,
    )
    const wrap = document.querySelector('[data-node-type="ChatBlockPanel"]') as HTMLElement
    expect(wrap).toBeTruthy()
    expect(wrap.getAttribute('data-catalog-fill')).toBe('true')
    expect(wrap.style.getPropertyValue(CATALOG_GENERIC_VARS.fill)).toBe('#c6f24a')
    expect(wrap.style.backgroundColor).toBe('')
  })

  it('P26 paints textTransform onto Text / Heading leaves', () => {
    render(
      <SceneNodeView
        node={{
          id: 'text-transform-1',
          type: 'Text',
          props: { children: 'Hello case', textTransform: 'uppercase' },
        }}
        selectedIds={[]}
        onSelect={() => undefined}
      />,
    )
    const leaf = document.querySelector('[data-node-type="Text"] .ds-text-body') as HTMLElement
    expect(leaf).toBeTruthy()
    expect(leaf.style.textTransform).toBe('uppercase')
  })
})
