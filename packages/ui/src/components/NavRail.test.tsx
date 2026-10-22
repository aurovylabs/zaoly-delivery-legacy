import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { NavRail } from './NavRail'
import { railOrientationFromEdge } from '../shell/railDock'

const frameCss = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../css/frame.css'), 'utf8')

afterEach(() => {
  cleanup()
})

describe('railOrientationFromEdge', () => {
  it('maps side edges to vertical and top/bottom to horizontal', () => {
    expect(railOrientationFromEdge('left')).toBe('vertical')
    expect(railOrientationFromEdge('right')).toBe('vertical')
    expect(railOrientationFromEdge('top')).toBe('horizontal')
    expect(railOrientationFromEdge('bottom')).toBe('horizontal')
  })
})

describe('NavRail surface CSS', () => {
  it('frosts the capsule and stacks via --z-nav-rail', () => {
    expect(frameCss).toContain('backdrop-filter: blur(16px)')
    expect(frameCss).toContain('z-index: var(--z-nav-rail)')
    expect(frameCss).not.toContain('--z-nav-rail-compact')
    expect(frameCss).toContain('prefers-reduced-transparency')
  })
})

describe('NavRail', () => {
  it('sets horizontal orientation for top static dock', () => {
    render(
      <NavRail dockable={false} defaultDockEdge="top" items={[{ id: 'a', label: 'A', href: '#a' }]} />,
    )
    const rail = screen.getByRole('navigation', { name: 'Primary' })
    expect(rail).toHaveAttribute('data-orientation', 'horizontal')
    expect(rail).toHaveAttribute('data-edge', 'top')
  })

  it('sets horizontal orientation for bottom static dock', () => {
    render(
      <NavRail
        dockable={false}
        defaultDockEdge="bottom"
        items={[{ id: 'a', label: 'A', href: '#a' }]}
      />,
    )
    const rail = screen.getByRole('navigation', { name: 'Primary' })
    expect(rail).toHaveAttribute('data-orientation', 'horizontal')
    expect(rail).toHaveAttribute('data-edge', 'bottom')
  })

  it('keeps vertical orientation for left static dock', () => {
    render(
      <NavRail dockable={false} defaultDockEdge="left" items={[{ id: 'a', label: 'A', href: '#a' }]} />,
    )
    const rail = screen.getByRole('navigation', { name: 'Primary' })
    expect(rail).toHaveAttribute('data-orientation', 'vertical')
    expect(rail).toHaveAttribute('data-edge', 'left')
  })

  it('locks to bottom compact dock when viewport matches compact media', async () => {
    const mq = {
      matches: true,
      media: '(max-width: 900px)',
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }
    const original = window.matchMedia
    window.matchMedia = (() => mq) as typeof window.matchMedia

    try {
      const onDockEdgeChange = vi.fn()
      render(
        <NavRail
          dockable={false}
          defaultDockEdge="left"
          onDockEdgeChange={onDockEdgeChange}
          items={[{ id: 'a', label: 'A', href: '#a' }]}
        />,
      )
      await waitFor(() => {
        const rail = screen.getByRole('navigation', { name: 'Primary' })
        expect(rail).toHaveAttribute('data-edge', 'bottom')
        expect(rail).toHaveAttribute('data-orientation', 'horizontal')
        expect(rail.className).toContain('nav-rail--compact-bottom')
      })
      expect(onDockEdgeChange).toHaveBeenCalledWith('bottom')
    } finally {
      window.matchMedia = original
    }
  })
})
