import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Chip } from './Chip'

describe('Chip', () => {
  it('renders filter chip with ds + legacy classes', () => {
    render(<Chip>MARKET</Chip>)
    const btn = screen.getByRole('button', { name: 'MARKET' })
    expect(btn.className).toContain('ds-chip')
    expect(btn.className).toContain('chip')
    expect(btn.className).toContain('ds-chip--sm')
    expect(btn.className).toContain('dense')
    expect(btn).toHaveAttribute('aria-pressed', 'false')
  })

  it('marks selected and allows md override', () => {
    render(
      <Chip selected size="md">
        ALL
      </Chip>,
    )
    const btn = screen.getByRole('button', { name: 'ALL' })
    expect(btn.className).toContain('ds-chip--selected')
    expect(btn.className).toContain('active')
    expect(btn.className).toContain('ds-chip--md')
    expect(btn).toHaveAttribute('aria-pressed', 'true')
  })

  it('supports static span', () => {
    render(
      <Chip static selected>
        LABEL
      </Chip>,
    )
    expect(screen.queryByRole('button')).toBeNull()
    const el = screen.getByText('LABEL')
    expect(el.tagName).toBe('SPAN')
    expect(el.className).toContain('ds-chip--static')
  })

  it('fires onClick', () => {
    const onClick = vi.fn()
    render(<Chip onClick={onClick}>Go</Chip>)
    fireEvent.click(screen.getByRole('button', { name: 'Go' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
