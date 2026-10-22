import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { formatRankIndex, RankedList, RankedRow } from './RankedList'

describe('formatRankIndex', () => {
  it('zero-pads 1-based ranks', () => {
    expect(formatRankIndex(1)).toBe('01')
    expect(formatRankIndex(12)).toBe('12')
    expect(formatRankIndex(0)).toBe('00')
  })

  it('floors and clamps non-finite', () => {
    expect(formatRankIndex(3.9)).toBe('03')
    expect(formatRankIndex(Number.NaN)).toBe('00')
    expect(formatRankIndex(-2)).toBe('00')
  })
})

describe('RankedList / RankedRow', () => {
  it('renders dual ds + legacy classes with track width', () => {
    const { container } = render(
      <RankedList hint={<span>hint</span>}>
        <RankedRow index={1} label="MARKET" value={20} secondary="50%" barPct={75} />
      </RankedList>,
    )
    expect(container.querySelector('.ds-rank')).toBeTruthy()
    expect(container.querySelector('.category-rank')).toBeTruthy()
    expect(container.querySelector('.ds-rank-row')).toBeTruthy()
    expect(container.querySelector('.category-rank-row')).toBeTruthy()
    expect(screen.getByText('01')).toBeTruthy()
    expect(screen.getByText('MARKET')).toBeTruthy()
    expect(screen.getByText('20')).toBeTruthy()
    expect(screen.getByText('50%')).toBeTruthy()
    expect(screen.getByText('hint')).toBeTruthy()
    const fill = container.querySelector('.ds-rank-fill') as HTMLElement
    expect(fill.style.width).toBe('75%')
  })

  it('clamps barPct and omits track when undefined', () => {
    const { container, rerender } = render(
      <RankedList>
        <RankedRow index={2} label="A" barPct={150} />
      </RankedList>,
    )
    expect((container.querySelector('.ds-rank-fill') as HTMLElement).style.width).toBe(
      '100%',
    )
    rerender(
      <RankedList>
        <RankedRow index={2} label="A" />
      </RankedList>,
    )
    expect(container.querySelector('.ds-rank-track')).toBeNull()
  })

  it('activates on click and Enter when onActivate set', () => {
    const onActivate = vi.fn()
    render(
      <RankedList>
        <RankedRow index={1} label="Go" onActivate={onActivate} />
      </RankedList>,
    )
    const row = screen.getByRole('button', { name: /Go/ })
    fireEvent.click(row)
    fireEvent.keyDown(row, { key: 'Enter' })
    fireEvent.keyDown(row, { key: ' ' })
    expect(onActivate).toHaveBeenCalledTimes(3)
  })

  it('stays static without onActivate', () => {
    render(
      <RankedList>
        <RankedRow index={1} label="Static" />
      </RankedList>,
    )
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText('Static')).toBeTruthy()
  })
})
