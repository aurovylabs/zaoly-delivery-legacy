import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { COMPONENT_PALETTE_DND_MIME, ComponentPalette } from './ComponentPalette'

afterEach(() => {
  cleanup()
})

describe('ComponentPalette', () => {
  it('renders items', () => {
    render(<ComponentPalette items={[{ id: 'x', label: 'ComponentPalette' }]} />)
    expect(screen.getByText('ComponentPalette')).toBeInTheDocument()
  })

  it('renders an optional item icon', () => {
    render(
      <ComponentPalette
        items={[{ id: 'Stack', label: 'Stack', icon: <span data-testid="palette-icon">S</span> }]}
      />,
    )
    expect(screen.getByTestId('palette-icon')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Stack/ })).toBeInTheDocument()
  })

  it('does not concatenate label and description into one word', () => {
    render(
      <ComponentPalette items={[{ id: 'Stack', label: 'Stack', description: 'Top-N' }]} />,
    )
    const btn = screen.getByRole('button', { name: /Stack/ })
    expect(btn.textContent).toMatch(/Stack\s+Top-N/)
    expect(btn.textContent).not.toBe('StackTop-N')
    expect(btn.querySelector('.ds-component-palette__label')?.textContent).toBe('Stack')
    expect(btn.querySelector('.ds-component-palette__desc')?.textContent).toBe('Top-N')
  })

  it('marks items draggable and sets palette MIME on dragstart', () => {
    const onItemDragStart = vi.fn()
    render(
      <ComponentPalette
        items={[{ id: 'Button', label: 'Button' }]}
        onItemDragStart={onItemDragStart}
      />,
    )
    const row = screen.getByRole('button', { name: /Button/ }).closest('li')
    expect(row).toHaveAttribute('draggable', 'true')
    const data: Record<string, string> = {}
    fireEvent.dragStart(row as HTMLElement, {
      dataTransfer: {
        setData: (type: string, value: string) => {
          data[type] = value
        },
        effectAllowed: 'none',
      },
    })
    expect(data[COMPONENT_PALETTE_DND_MIME]).toBe('Button')
    expect(onItemDragStart).toHaveBeenCalledWith('Button', expect.anything())
  })
})
