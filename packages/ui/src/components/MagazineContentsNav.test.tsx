import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MagazineContentsNav } from './MagazineContentsNav'

afterEach(() => cleanup())

const items = [
  { id: 'tokens', index: '01', label: 'Tokens', href: '#tokens' },
  { id: 'evaluate', index: '02', label: 'Evaluate', href: '#evaluate' },
]

describe('MagazineContentsNav', () => {
  it('marks the active segment', () => {
    render(
      <MagazineContentsNav items={items} activeId="evaluate" aria-label="Sections" />
    )
    const active = screen.getByRole('tab', { selected: true })
    expect(active).toHaveTextContent('Evaluate')
    expect(active.className).toContain('ds-magazine-contents__link--active')
  })

  it('renders exit slot and forced compact', () => {
    render(
      <MagazineContentsNav
        items={items}
        activeId="tokens"
        compact
        exit={<a href="#hub">Hub</a>}
      />
    )
    expect(screen.getByRole('navigation')).toHaveAttribute('data-compact', 'true')
    expect(screen.getByRole('link', { name: 'Hub' })).toHaveAttribute('href', '#hub')
  })

  it('supports renderItem override', () => {
    const onClick = vi.fn()
    render(
      <MagazineContentsNav
        items={items}
        activeId="tokens"
        renderItem={(item, { className, selected }) => (
          <button
            type="button"
            role="tab"
            aria-selected={selected}
            className={className}
            data-section={item.id}
            onClick={() => onClick(item.id)}
          >
            <span className="ds-magazine-contents__index">{item.index}</span>
            <span className="ds-magazine-contents__name">{item.label}</span>
          </button>
        )}
      />
    )
    fireEvent.click(screen.getByRole('tab', { name: /02\s*Evaluate/ }))
    expect(onClick).toHaveBeenCalledWith('evaluate')
  })
})
