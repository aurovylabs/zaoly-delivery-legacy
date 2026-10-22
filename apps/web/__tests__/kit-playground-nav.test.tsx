import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { KitPlaygroundNav } from '../components/kit-playground/kit-playground-nav'
import type { Translator } from '../lib/i18n'

vi.mock('@zaoly/ui', async () => {
  const actual = await vi.importActual<typeof import('@zaoly/ui')>('@zaoly/ui')
  return {
    ...actual,
    Text: ({ children, ...props }: { children?: React.ReactNode }) => (
      <p {...props}>{children}</p>
    ),
  }
})

const t: Translator = ((key: string) => key) as Translator

describe('KitPlaygroundNav', () => {
  it('lists atom groups, starter sections, and patterns', () => {
    const onSelect = vi.fn()
    render(
      <KitPlaygroundNav
        patterns={[
          {
            name: 'Hero',
            exportName: 'Hero',
            componentId: 'Composition~aaaaaaaaaaaaaaaa~Hero',
          },
        ]}
        selectedId={null}
        onSelect={onSelect}
        t={t}
      />,
    )
    expect(screen.getByTestId('kit-playground-nav')).toBeTruthy()
    expect(screen.getByTestId('kit-nav-group-forms')).toBeTruthy()
    expect(screen.getByTestId('kit-nav-atom-SiteButton')).toBeTruthy()
    expect(screen.getByTestId('kit-nav-sections')).toBeTruthy()
    expect(screen.getByTestId('kit-nav-section-LandingNav')).toBeTruthy()
    fireEvent.click(screen.getByTestId('kit-nav-atom-SiteButton'))
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'atom', componentId: 'SiteButton' }),
    )
    fireEvent.click(screen.getByTestId('kit-nav-section-LandingNav'))
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'section',
        componentId: 'Composition:LandingNav',
        exportName: 'LandingNav',
      }),
    )
    fireEvent.click(screen.getByTestId('kit-nav-pattern-Hero'))
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'pattern', exportName: 'Hero' }),
    )
  })

  it('shows empty patterns hint', () => {
    render(
      <KitPlaygroundNav patterns={[]} selectedId={null} onSelect={vi.fn()} t={t} />,
    )
    expect(screen.getByTestId('kit-nav-patterns-empty')).toBeTruthy()
  })

  it('filters atoms via search', () => {
    render(
      <KitPlaygroundNav patterns={[]} selectedId={null} onSelect={vi.fn()} t={t} />,
    )
    fireEvent.change(screen.getByTestId('kit-nav-search'), { target: { value: 'Button' } })
    expect(screen.getByTestId('kit-nav-atom-SiteButton')).toBeTruthy()
    expect(screen.queryByTestId('kit-nav-atom-SiteText')).toBeNull()
  })
})
