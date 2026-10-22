import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppProviders } from '../components/app-providers'
import { HomeMagazine } from '../components/home-magazine'
import { LibraryHub } from '../components/library-hub'

describe('shell smoke', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ compositions: [] }),
    } as Response)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders home magazine cover and launch tiles without shell page title', () => {
    render(
      <AppProviders>
        <HomeMagazine projects={[]} compositions={[]} libraryItems={[]} />
      </AppProviders>,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'CREATION' })).toBeInTheDocument()
    const launch = screen.getByLabelText('Launch actions')
    const ctaHrefs = [...launch.querySelectorAll('a.creation-home-cta')].map((a) =>
      a.getAttribute('href'),
    )
    expect(ctaHrefs).toEqual(['/projects', '/compositions', '/library'])
  })

  it('renders library hub surface', async () => {
    render(
      <AppProviders>
        <LibraryHub projects={[]} />
      </AppProviders>,
    )
    expect(await screen.findByTestId('library-open-kit-playground')).toBeInTheDocument()
    expect(screen.getByTestId('library-site-kit-atoms')).toBeInTheDocument()
  })
})
