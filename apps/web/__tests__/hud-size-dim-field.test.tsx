import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { SceneNode } from '@zaoly/contracts'
import { HudSizeDimField } from '../components/hud-size-dim-field'
import { HUD_SIZE_DIM_PRESETS } from '../lib/inspect/hud-size-dim-presets'

describe('HudSizeDimField', () => {
  const node: SceneNode = {
    id: 'box',
    type: 'SiteStack',
    name: 'Box',
    props: { width: '240px' },
  }

  it('strip is icon-only; menu opens Hug/Fill/Fixed + Fixed length tools', () => {
    const onOps = vi.fn()
    render(<HudSizeDimField node={node} dim="width" label="Width" onOps={onOps} />)

    const btn = screen.getByTestId('hud-token-width')
    expect(btn.tagName).toBe('BUTTON')
    expect(screen.queryByTestId('hud-literal-width')).toBeNull()
    expect(screen.queryByTestId('hud-token-menu-width')).toBeNull()

    fireEvent.click(btn)
    expect(screen.getByTestId('hud-token-menu-width')).toBeTruthy()
    expect(screen.getByTestId('hud-size-mode-width-fixed')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('hud-literal-width')).toHaveValue('240px')

    fireEvent.click(screen.getByTestId('hud-nudge-inc-width'))
    expect(onOps).toHaveBeenCalledWith([
      { op: 'set_prop', nodeId: 'box', key: 'width', value: '241px' },
    ])
  })

  it('switches mode to Fill / Hug via the menu', () => {
    const onOps = vi.fn()
    render(<HudSizeDimField node={node} dim="width" label="Width" onOps={onOps} />)
    fireEvent.click(screen.getByTestId('hud-token-width'))
    fireEvent.click(screen.getByTestId('hud-size-mode-width-fill'))
    expect(onOps).toHaveBeenCalledWith([
      { op: 'set_prop', nodeId: 'box', key: 'width', value: '100%' },
    ])
    fireEvent.click(screen.getByTestId('hud-size-mode-width-hug'))
    expect(onOps).toHaveBeenCalledWith([
      { op: 'set_prop', nodeId: 'box', key: 'width', value: '' },
    ])
  })

  it('Fixed preset writes a CSS length literal', () => {
    const onOps = vi.fn()
    render(<HudSizeDimField node={node} dim="width" label="Width" onOps={onOps} />)
    fireEvent.click(screen.getByTestId('hud-token-width'))
    expect(HUD_SIZE_DIM_PRESETS).toContain('320px')
    fireEvent.click(screen.getByTestId('hud-size-preset-width-320px'))
    expect(onOps).toHaveBeenCalledWith([
      { op: 'set_prop', nodeId: 'box', key: 'width', value: '320px' },
    ])
  })

  it('title shows mode summary (Fill) without opening menu', () => {
    const fillNode: SceneNode = {
      ...node,
      props: { width: '100%' },
    }
    render(<HudSizeDimField node={fillNode} dim="width" label="Width" onOps={vi.fn()} />)
    expect(screen.getByTestId('hud-token-width')).toHaveAttribute('title', 'Width: Fill')
  })
})

describe('hud-size-dim-presets', () => {
  it('exposes a frame-oriented CSS ladder', () => {
    expect(HUD_SIZE_DIM_PRESETS.length).toBeGreaterThanOrEqual(6)
    expect(HUD_SIZE_DIM_PRESETS).toContain('320px')
    expect(HUD_SIZE_DIM_PRESETS.every((v) => /^\d+px$/.test(v))).toBe(true)
  })
})
