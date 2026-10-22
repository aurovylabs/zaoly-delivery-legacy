import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ContextMenu, type ContextMenuItem } from './ContextMenu'

function items(overrides: Partial<ContextMenuItem>[] = []): ContextMenuItem[] {
  const base: ContextMenuItem[] = [
    { id: 'a', label: 'Alpha', onSelect: vi.fn() },
    { id: 'b', label: 'Beta', onSelect: vi.fn() },
    { id: 'c', label: 'Danger', danger: true, onSelect: vi.fn() },
  ]
  return base.map((item, i) => ({ ...item, ...(overrides[i] ?? {}) }))
}

describe('ContextMenu', () => {
  it('renders nothing when closed or empty', () => {
    const { rerender } = render(
      <ContextMenu open={false} x={10} y={20} onClose={() => undefined} items={items()} />,
    )
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    rerender(<ContextMenu open x={10} y={20} onClose={() => undefined} items={[]} />)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('positions the menu and runs onSelect then onClose', () => {
    const onClose = vi.fn()
    const onSelect = vi.fn()
    render(
      <ContextMenu
        open
        x={40}
        y={60}
        onClose={onClose}
        items={[{ id: 'go', label: 'Go', onSelect }]}
      />,
    )
    const menu = screen.getByRole('menu')
    expect(menu).toHaveClass('ds-context-menu--portal')
    expect(menu).toHaveAttribute('data-testid', 'ds-context-menu-portal')
    expect(document.body.contains(menu)).toBe(true)
    expect(menu).toHaveStyle({ left: '40px', top: '60px' })
    fireEvent.click(screen.getByRole('menuitem', { name: 'Go' }))
    expect(onSelect).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('ignores outside close when pressing the anchor trigger', () => {
    const onClose = vi.fn()
    const anchor = document.createElement('button')
    document.body.appendChild(anchor)
    const anchorRef = { current: anchor }
    render(
      <ContextMenu open x={0} y={0} onClose={onClose} items={items()} anchorRef={anchorRef} />,
    )
    fireEvent.mouseDown(anchor)
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.mouseDown(document.body)
    expect(onClose).toHaveBeenCalled()
    anchor.remove()
  })

  it('closes on Escape and outside click', () => {
    const onClose = vi.fn()
    render(
      <ContextMenu open x={0} y={0} onClose={onClose} items={items()} label="Board menu" />,
    )
    expect(screen.getByRole('menu', { name: 'Board menu' })).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
    onClose.mockClear()
    fireEvent.mouseDown(document.body)
    expect(onClose).toHaveBeenCalled()
  })

  it('skips disabled items on activate', () => {
    const onSelect = vi.fn()
    const onClose = vi.fn()
    render(
      <ContextMenu
        open
        x={0}
        y={0}
        onClose={onClose}
        items={[{ id: 'x', label: 'Nope', disabled: true, onSelect }]}
      />,
    )
    fireEvent.click(screen.getByRole('menuitem', { name: 'Nope' }))
    expect(onSelect).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('renders icon, separator, and section rows', () => {
    render(
      <ContextMenu
        open
        x={0}
        y={0}
        onClose={() => undefined}
        items={[
          { id: 'sec', label: 'Szene', section: true, onSelect: vi.fn() },
          {
            id: 'open',
            label: 'Infos',
            separator: true,
            icon: <span data-testid="cm-icon">i</span>,
            onSelect: vi.fn(),
          },
        ]}
      />,
    )
    expect(screen.getByText('Szene')).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Szene' })).not.toBeInTheDocument()
    expect(screen.getByTestId('cm-icon')).toBeInTheDocument()
    expect(screen.getByRole('separator')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Infos' })).toBeInTheDocument()
  })

  it('forwards optional item testId', () => {
    render(
      <ContextMenu
        open
        x={0}
        y={0}
        onClose={() => undefined}
        items={[{ id: 'go', label: 'Go', testId: 'cm-go', onSelect: vi.fn() }]}
      />,
    )
    expect(screen.getByTestId('cm-go')).toHaveAttribute('role', 'menuitem')
  })
})
