import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { SiteKitLibraryPreview } from '../components/site-kit-library-preview'

describe('SiteKitLibraryPreview', () => {
  it('SSR/prerender of section tiles stays empty (no Date.now seed path)', () => {
    const html = renderToString(
      <SiteKitLibraryPreview kind="section" componentId="Composition:LandingHero" />,
    )
    expect(html).toContain('creation-library-kit-preview--empty')
    expect(html).not.toContain('creation-library-kit-preview__canvas')
  })

  it('hydrates starter section trees after mount', async () => {
    render(<SiteKitLibraryPreview kind="section" componentId="Composition:LandingHero" />)
    await waitFor(() => {
      expect(
        screen
          .getByTestId('library-section-preview-Composition:LandingHero')
          .querySelector('.creation-library-kit-preview__canvas'),
      ).toBeTruthy()
    })
  })

  it('renders atom previews synchronously from static catalog', () => {
    render(<SiteKitLibraryPreview kind="atom" atomId="SiteButton" />)
    expect(screen.getByTestId('library-atom-preview-SiteButton')).toBeInTheDocument()
    expect(
      screen
        .getByTestId('library-atom-preview-SiteButton')
        .querySelector('.creation-library-kit-preview__canvas'),
    ).toBeTruthy()
  })
})
