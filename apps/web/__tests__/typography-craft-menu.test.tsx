import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { SceneNode } from '@zaoly/contracts'
import { TypographyCraftMenu, isTypographyCraftNode } from '../components/typography-craft-menu'
import { TokenCatalogProvider } from '../lib/inspect/token-catalog-context'
import { INSPECT_TOKEN_CATALOG } from '../lib/inspect/token-catalog'
import { resolveEnumPropsToStyle } from '../lib/inspect/resolve-bindings'

vi.mock('../lib/user-prefs', () => ({
  useT: () => (key: string) => {
    const map: Record<string, string> = {
      'editor.typoCraftStyleToken': 'Typographic style token',
      'editor.typoCraftTokenNone': 'No style token',
      'editor.typoCraftAddToken': 'add new token',
      'editor.typoCraftSearchFont': 'Search font',
      'editor.typoCraftProperties': 'Typography',
      'editor.typoCraftWeight': 'Weight',
      'editor.typoCraftSize': 'Size',
      'editor.typoCraftLineHeight': 'Line height',
      'editor.typoCraftTracking': 'Tracking',
      'editor.typoCraftParagraph': 'Paragraph',
      'editor.typoCraftAlign': 'Alignment',
      'editor.typoCraftAlignLeft': 'Left',
      'editor.typoCraftAlignRight': 'Right',
      'editor.typoCraftFormat': 'Format',
    }
    return map[key] ?? key
  },
}))

describe('TypographyCraftMenu', () => {
  it('detects text families', () => {
    expect(isTypographyCraftNode({ id: '1', type: 'SiteText', name: 'T', props: {} })).toBe(true)
    expect(isTypographyCraftNode({ id: '1', type: 'SiteStack', name: 'S', props: {} })).toBe(false)
  })

  it('renders mockup split: token bar, fonts, typography props', () => {
    const node: SceneNode = {
      id: 't1',
      type: 'SiteText',
      name: 'Headline',
      props: { color: '#1f44ff', fontSize: '14px', fontWeight: '500' },
      tokenBindings: {},
    }
    render(
      <TokenCatalogProvider catalog={INSPECT_TOKEN_CATALOG}>
        <TypographyCraftMenu node={node} onOps={vi.fn()} />
      </TokenCatalogProvider>,
    )
    const menu = screen.getByTestId('typography-craft-menu')
    expect(menu).toBeTruthy()
    expect(menu.className).toMatch(/creation-typo-craft--dense/)
    expect(menu.getAttribute('style') ?? '').toMatch(/420px/)
    expect(screen.getByTestId('typo-craft-token-bar')).toBeTruthy()
    expect(screen.getByTestId('typo-craft-fonts')).toBeTruthy()
    expect(screen.getByTestId('typo-craft-weight')).toBeTruthy()
    expect(screen.getByTestId('typo-craft-size')).toBeTruthy()
    expect(screen.getByTestId('typo-craft-lineheight')).toBeTruthy()
    expect(screen.getByTestId('typo-craft-tracking')).toBeTruthy()
    expect(screen.getByTestId('typo-craft-paragraph')).toBeTruthy()
    expect(screen.getByTestId('typo-craft-align')).toBeTruthy()
    expect(screen.getByTestId('typo-craft-format')).toBeTruthy()
    expect(screen.getByTestId('typo-craft-font-search')).toBeTruthy()
  })

  it('toggles italic via set_prop fontStyle', () => {
    const node: SceneNode = {
      id: 't1',
      type: 'SiteText',
      name: 'T',
      props: { fontStyle: 'normal' },
    }
    const onOps = vi.fn()
    render(
      <TokenCatalogProvider catalog={INSPECT_TOKEN_CATALOG}>
        <TypographyCraftMenu node={node} onOps={onOps} />
      </TokenCatalogProvider>,
    )
    fireEvent.click(screen.getByTestId('typo-craft-italic'))
    expect(onOps).toHaveBeenCalledWith([
      { op: 'set_prop', nodeId: 't1', key: 'fontStyle', value: 'italic' },
    ])
  })

  it('writes size literal via hybrid TokenPicker', () => {
    const node: SceneNode = {
      id: 't1',
      type: 'SiteText',
      name: 'T',
      props: { fontSize: '14px' },
      tokenBindings: { lineHeight: 'typography.body.family' },
    }
    const onOps = vi.fn()
    render(
      <TokenCatalogProvider catalog={INSPECT_TOKEN_CATALOG}>
        <TypographyCraftMenu node={node} onOps={onOps} />
      </TokenCatalogProvider>,
    )
    expect(screen.getByTestId('typo-craft-lineheight-picker')).toBeTruthy()
    expect(screen.getByTestId('typo-craft-size-input')).toBeTruthy()
    fireEvent.change(screen.getByTestId('typo-craft-size-input'), { target: { value: '18px' } })
    fireEvent.blur(screen.getByTestId('typo-craft-size-input'))
    expect(onOps).toHaveBeenCalledWith([
      { op: 'set_prop', nodeId: 't1', key: 'fontSize', value: '18px' },
    ])
  })

  it('weight hybrid accepts a free literal', () => {
    const node: SceneNode = {
      id: 't1',
      type: 'SiteText',
      name: 'T',
      props: { fontWeight: '400' },
    }
    const onOps = vi.fn()
    render(
      <TokenCatalogProvider catalog={INSPECT_TOKEN_CATALOG}>
        <TypographyCraftMenu node={node} onOps={onOps} />
      </TokenCatalogProvider>,
    )
    fireEvent.change(screen.getByTestId('typo-craft-weight-input'), { target: { value: '600' } })
    fireEvent.blur(screen.getByTestId('typo-craft-weight-input'))
    // Weight 600 matches typography.display and snaps to a token bind.
    expect(onOps).toHaveBeenCalledWith([
      { op: 'set_prop', nodeId: 't1', key: 'fontWeight', value: '' },
      {
        op: 'set_token_binding',
        nodeId: 't1',
        key: 'fontWeight',
        tokenPath: 'typography.display',
      },
    ])
  })

  it('picks a google font via TokenPicker', async () => {
    const node: SceneNode = {
      id: 't1',
      type: 'SiteText',
      name: 'T',
      props: {},
    }
    const onOps = vi.fn()
    render(
      <TokenCatalogProvider catalog={INSPECT_TOKEN_CATALOG}>
        <TypographyCraftMenu node={node} onOps={onOps} />
      </TokenCatalogProvider>,
    )
    expect(await screen.findByTestId('typo-craft-font-picker')).toBeTruthy()
    const options = await screen.findAllByRole('option')
    const option = options.find((el) => /Inter/i.test(el.textContent ?? ''))
    expect(option).toBeTruthy()
    fireEvent.click(option!)
    expect(onOps).toHaveBeenCalled()
  })
})

describe('fontStyle binding', () => {
  it('maps fontStyle prop into CSS', () => {
    expect(resolveEnumPropsToStyle({ fontStyle: 'italic' }).fontStyle).toBe('italic')
  })
})
