import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { SceneNode } from '@zaoly/contracts'
import { HudTokenField } from '../components/hud-token-field'
import { TokenCatalogProvider } from '../lib/inspect/token-catalog-context'
import { INSPECT_TOKEN_CATALOG } from '../lib/inspect/token-catalog'

describe('HudTokenField', () => {
  const node: SceneNode = {
    id: 't1',
    type: 'SiteText',
    name: 'Headline',
    props: {},
    tokenBindings: { color: 'color.neutral.700', fontFamily: 'typography.body.family' },
  }

  it('strip shows an icon button; click opens menu with TokenPicker', () => {
    const onOps = vi.fn()
    render(
      <TokenCatalogProvider catalog={INSPECT_TOKEN_CATALOG}>
        <HudTokenField
          node={node}
          slotKey="fontFamily"
          label="Font"
          tokenGroup="fontFamily"
          onOps={onOps}
        />
      </TokenCatalogProvider>,
    )

    const btn = screen.getByTestId('hud-token-fontFamily')
    expect(btn.tagName).toBe('BUTTON')
    expect(screen.queryByTestId('hud-literal-fontFamily')).toBeNull()
    expect(screen.queryByTestId('hud-token-menu-fontFamily')).toBeNull()

    fireEvent.click(btn)
    expect(screen.getByTestId('hud-token-menu-fontFamily')).toBeTruthy()
    expect(screen.getByTestId('hud-literal-fontFamily')).toBeTruthy()
    expect(screen.queryByTestId('token-picker-active')).toBeNull()
    const labels = screen.getAllByRole('option').map((el) => (el.textContent ?? '').trim())
    expect(labels.some((l) => /^(Primary|Secondary|Accent|Background)$/i.test(l))).toBe(false)

    const bodyOpt = screen.getAllByRole('option').find((el) => /Body/i.test(el.textContent ?? ''))
    expect(bodyOpt).toBeTruthy()
    expect(bodyOpt!.textContent ?? '').not.toMatch(/Noto Sans JP.*,/)
    expect(bodyOpt!.textContent?.trim()).toMatch(/^Body$/i)
    fireEvent.click(bodyOpt!)
    expect(onOps).toHaveBeenCalled()
    const ops = onOps.mock.calls[0]![0] as Array<{ op: string; tokenPath?: string }>
    expect(ops.some((o) => o.op === 'set_token_binding')).toBe(true)
  })

  it(
    'Google font pick writes family literal and clears the binding',
    () => {
      const onOps = vi.fn()
      render(
        <TokenCatalogProvider catalog={INSPECT_TOKEN_CATALOG}>
          <HudTokenField
            node={node}
            slotKey="fontFamily"
            label="Font"
            tokenGroup="fontFamily"
            onOps={onOps}
          />
        </TokenCatalogProvider>,
      )

      fireEvent.click(screen.getByTestId('hud-token-fontFamily'))
      const input = screen.getByTestId('hud-literal-fontFamily')
      fireEvent.focus(input)
      const inter = screen
        .getAllByRole('option')
        .find((el) => (el.textContent ?? '').trim() === 'Inter')
      expect(inter).toBeTruthy()
      fireEvent.mouseDown(inter!)
      fireEvent.click(inter!)

      expect(onOps).toHaveBeenCalled()
      const opsBatches = onOps.mock.calls.map(
        (c) => c[0] as Array<{ op: string; key?: string; value?: unknown }>,
      )
      const flat = opsBatches.flat()
      expect(
        flat.some((o) => o.op === 'set_prop' && o.key === 'fontFamily' && o.value === 'Inter'),
      ).toBe(true)
      expect(flat.some((o) => o.op === 'clear_token_binding' && o.key === 'fontFamily')).toBe(true)
      // Blur must not recommit the previous token label after the Google pick.
      expect(flat.some((o) => o.op === 'set_prop' && o.value === 'Body')).toBe(false)
      expect(screen.queryByTestId('hud-token-menu-fontFamily')).toBeNull()
    },
    20_000,
  )

  it('color icon opens menu; literal hex commits there', () => {
    const onOps = vi.fn()
    render(
      <TokenCatalogProvider catalog={INSPECT_TOKEN_CATALOG}>
        <HudTokenField
          node={{ ...node, tokenBindings: {}, props: { color: '#000000' } }}
          slotKey="color"
          label="Color"
          tokenGroup="color"
          onOps={onOps}
        />
      </TokenCatalogProvider>,
    )

    fireEvent.click(screen.getByTestId('hud-token-color'))
    const input = screen.getByTestId('hud-literal-color')
    fireEvent.change(input, { target: { value: '#1f44ff' } })
    fireEvent.blur(input)
    // Exact palette hex snaps to token bind (clear prop + set_token_binding).
    expect(onOps).toHaveBeenCalledWith([
      { op: 'set_prop', nodeId: 't1', key: 'color', value: '' },
      {
        op: 'set_token_binding',
        nodeId: 't1',
        key: 'color',
        tokenPath: 'color.palette.cobalt.500',
      },
    ])
  })

  it('strip has no ±; open menu exposes nudges for size', () => {
    const onOps = vi.fn()
    render(
      <TokenCatalogProvider catalog={INSPECT_TOKEN_CATALOG}>
        <HudTokenField
          node={{ ...node, tokenBindings: {}, props: { fontSize: '16px' } }}
          slotKey="fontSize"
          label="Size"
          tokenGroup="fontSize"
          onOps={onOps}
        />
      </TokenCatalogProvider>,
    )
    expect(screen.queryByTestId('hud-nudge-inc-fontSize')).toBeNull()
    fireEvent.click(screen.getByTestId('hud-token-fontSize'))
    fireEvent.click(screen.getByTestId('hud-nudge-inc-fontSize'))
    expect(onOps).toHaveBeenCalledWith([
      { op: 'set_prop', nodeId: 't1', key: 'fontSize', value: '17px' },
    ])
  })

  it('Size menu lists type roles + CSS presets; chip summary is the size facet', () => {
    const onOps = vi.fn()
    render(
      <TokenCatalogProvider catalog={INSPECT_TOKEN_CATALOG}>
        <HudTokenField
          node={{
            ...node,
            tokenBindings: { fontSize: 'typography.body.family' },
          }}
          slotKey="fontSize"
          label="Size"
          tokenGroup="fontSize"
          onOps={onOps}
        />
      </TokenCatalogProvider>,
    )

    const chip = screen.getByTestId('hud-token-fontSize')
    expect(chip.getAttribute('aria-label')).toMatch(/^Size:\s*1rem$/i)
    expect(chip.getAttribute('aria-label')).not.toMatch(/Body/i)

    fireEvent.click(chip)
    expect(screen.queryByTestId('token-picker-active')).toBeNull()
    const labels = screen.getAllByRole('option').map((el) => (el.textContent ?? '').trim())
    expect(labels.some((l) => /^(Primary|Secondary|Accent|Background)$/i.test(l))).toBe(false)
    expect(labels.some((l) => /^Body$/i.test(l))).toBe(true)
    expect(labels.some((l) => /^H1$/i.test(l))).toBe(true)
    expect(labels).toContain('16px')
    expect(labels.some((l) => /0\.78rem\s*·\s*Body/i.test(l))).toBe(false)

    const h1 = screen.getAllByRole('option').find((el) => /^H1$/i.test((el.textContent ?? '').trim()))
    expect(h1).toBeTruthy()
    fireEvent.click(h1!)
    expect(onOps).toHaveBeenCalled()
    const ops = onOps.mock.calls[0]![0] as Array<{ op: string; tokenPath?: string }>
    expect(ops.some((o) => o.op === 'set_token_binding' && o.tokenPath === 'typography.heading.h1')).toBe(
      true,
    )
  })

  it('Size preset pick writes a CSS length literal', () => {
    const onOps = vi.fn()
    render(
      <TokenCatalogProvider catalog={INSPECT_TOKEN_CATALOG}>
        <HudTokenField
          node={{
            ...node,
            tokenBindings: { fontSize: 'typography.body.family' },
          }}
          slotKey="fontSize"
          label="Size"
          tokenGroup="fontSize"
          onOps={onOps}
        />
      </TokenCatalogProvider>,
    )
    fireEvent.click(screen.getByTestId('hud-token-fontSize'))
    const input = screen.getByTestId('hud-literal-fontSize')
    fireEvent.focus(input)
    const sixteen = screen.getAllByRole('option').find((el) => (el.textContent ?? '').trim() === '16px')
    expect(sixteen).toBeTruthy()
    fireEvent.mouseDown(sixteen!)
    fireEvent.click(sixteen!)
    expect(onOps).toHaveBeenCalledWith([
      { op: 'set_prop', nodeId: 't1', key: 'fontSize', value: '16px' },
      { op: 'clear_token_binding', nodeId: 't1', key: 'fontSize' },
    ])
    // Closing the menu must not recommit the previous strip label (e.g. "Body").
    const flat = onOps.mock.calls.flatMap((c) => c[0] as Array<{ op: string; value?: unknown }>)
    expect(flat.some((o) => o.op === 'set_prop' && o.value === 'Body')).toBe(false)
  })

  it('Weight menu lists type roles + weight presets; chip summary is the weight facet', () => {
    const onOps = vi.fn()
    render(
      <TokenCatalogProvider catalog={INSPECT_TOKEN_CATALOG}>
        <HudTokenField
          node={{
            ...node,
            tokenBindings: { fontWeight: 'typography.body.family' },
          }}
          slotKey="fontWeight"
          label="Weight"
          tokenGroup="fontWeight"
          onOps={onOps}
        />
      </TokenCatalogProvider>,
    )

    const chip = screen.getByTestId('hud-token-fontWeight')
    expect(chip.getAttribute('aria-label')).toMatch(/^Weight:\s*400$/i)
    expect(chip.getAttribute('aria-label')).not.toMatch(/Body/i)

    fireEvent.click(chip)
    expect(screen.queryByTestId('token-picker-active')).toBeNull()
    const labels = screen.getAllByRole('option').map((el) => (el.textContent ?? '').trim())
    expect(labels.some((l) => /^(Primary|Secondary|Accent)$/i.test(l))).toBe(false)
    expect(labels.some((l) => /^Body$/i.test(l))).toBe(true)
    expect(labels.some((l) => /^H1$/i.test(l))).toBe(true)
    expect(labels).toContain('700')
    expect(labels.some((l) => /400\s*·\s*Body/i.test(l))).toBe(false)

    const seven = screen.getAllByRole('option').find((el) => (el.textContent ?? '').trim() === '700')
    expect(seven).toBeTruthy()
    fireEvent.mouseDown(seven!)
    fireEvent.click(seven!)
    expect(onOps).toHaveBeenCalledWith([
      { op: 'set_prop', nodeId: 't1', key: 'fontWeight', value: '700' },
      { op: 'clear_token_binding', nodeId: 't1', key: 'fontWeight' },
    ])
  })

  it('Gap length menu: CSS presets first; pick writes literal', () => {
    const onOps = vi.fn()
    const stack: SceneNode = {
      id: 's1',
      type: 'Stack',
      name: 'Row',
      props: {},
      tokenBindings: { gap: 'spacing.static.medium' },
    }
    render(
      <TokenCatalogProvider catalog={INSPECT_TOKEN_CATALOG}>
        <HudTokenField
          node={stack}
          slotKey="gap"
          label="Gap"
          tokenGroup="space"
          onOps={onOps}
        />
      </TokenCatalogProvider>,
    )

    fireEvent.click(screen.getByTestId('hud-token-gap'))
    const labels = screen.getAllByRole('option').map((el) => (el.textContent ?? '').trim())
    const idx8 = labels.findIndex((l) => l === '8px')
    const idx16 = labels.findIndex((l) => l === '16px')
    expect(idx8).toBeGreaterThanOrEqual(0)
    expect(idx16).toBeGreaterThan(idx8)
    // Presets precede Brandion role rows (roles are not bare Npx).
    const firstRole = labels.findIndex((l, i) => i > idx16 && l.length > 0 && !/^\d+px$/.test(l))
    expect(firstRole).toBeGreaterThan(idx16)

    const sixteen = screen.getAllByRole('option').find((el) => (el.textContent ?? '').trim() === '16px')
    expect(sixteen).toBeTruthy()
    fireEvent.mouseDown(sixteen!)
    fireEvent.click(sixteen!)
    expect(onOps).toHaveBeenCalledWith([
      { op: 'set_prop', nodeId: 's1', key: 'gap', value: '16px' },
      { op: 'clear_token_binding', nodeId: 's1', key: 'gap' },
    ])
  })

  it('Gap menu head prefers length facet over path · role', () => {
    const stack: SceneNode = {
      id: 's2',
      type: 'Stack',
      name: 'Col',
      props: {},
      tokenBindings: { gap: 'spacing.static.medium' },
    }
    render(
      <TokenCatalogProvider catalog={INSPECT_TOKEN_CATALOG}>
        <HudTokenField node={stack} slotKey="gap" label="Gap" tokenGroup="space" onOps={vi.fn()} />
      </TokenCatalogProvider>,
    )
    fireEvent.click(screen.getByTestId('hud-token-gap'))
    const head = screen.getByTestId('hud-token-menu-gap')
    const text = head.textContent ?? ''
    expect(text).not.toMatch(/·/)
  })

  it('menu layout keeps inline TokenPicker without icon strip button', () => {
    render(
      <TokenCatalogProvider catalog={INSPECT_TOKEN_CATALOG}>
        <HudTokenField
          node={node}
          slotKey="gap"
          label="Gap"
          tokenGroup="space"
          layout="menu"
          menuExpanded
          onOps={vi.fn()}
        />
      </TokenCatalogProvider>,
    )
    expect(screen.queryByTestId('hud-token-menu-gap')).toBeNull()
    expect(screen.getByTestId('hud-token-gap')).toBeTruthy()
  })
})
