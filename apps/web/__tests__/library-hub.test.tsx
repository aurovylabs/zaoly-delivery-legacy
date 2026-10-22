import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AppProviders } from '../components/app-providers'
import { LibraryHub } from '../components/library-hub'
import { getLibraryCatalog, groupLibraryByCategory } from '../lib/fixtures/library-catalog'
import { groupSiteKitCatalog } from '../lib/library/site-kit-catalog-groups'
import { siteKitAtomStoryHref, siteKitCompositionStoryHref } from '../lib/site-kit/storybook-href'

describe('library catalog fixture', () => {
  it('returns curated tags with layers', () => {
    const catalog = getLibraryCatalog()
    expect(catalog.items.length).toBeGreaterThanOrEqual(10)
    expect(catalog.items.some((i) => i.tagName === 'ds-button')).toBe(true)
    expect(catalog.items.find((i) => i.tagName === 'ds-button')?.layer).toBe('atom')
    expect(catalog.items.find((i) => i.tagName === 'ds-tabs')?.layer).toBe('molecule')
  })

  it('groups by category', () => {
    const groups = groupLibraryByCategory(getLibraryCatalog().items)
    expect(groups[0]?.category).toMatch(/^Atoms\//)
    expect(groups.every((g) => g.items.length > 0)).toBe(true)
  })
})

describe('site kit catalog groups', () => {
  it('groups palette atoms for library cards', () => {
    const groups = groupSiteKitCatalog()
    expect(groups.map((g) => g.id)).toEqual(['forms', 'content', 'layout'])
    expect(groups[0]?.items.some((e) => e.id === 'SiteButton')).toBe(true)
    expect(groups[2]?.items.some((e) => e.id === 'SiteStack')).toBe(true)
  })
})

describe('site kit storybook href', () => {
  it('builds atom CSF deep links', () => {
    expect(siteKitAtomStoryHref('https://sb.example', 'Site/Button')).toBe(
      'https://sb.example/?path=/story/site-button--default',
    )
  })

  it('builds nested composition CSF deep links', () => {
    expect(
      siteKitCompositionStoryHref('https://sb.example', 'MarketingHero', 'default', {
        platformProjectId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
      }),
    ).toBe(
      'https://sb.example/?path=/story/compositions-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee-marketing-hero--default',
    )
  })
})

describe('library hub', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({
          compositions: [
            {
              name: 'Marketing Hero',
              exportName: 'MarketingHero',
              storyTitle: 'Compositions/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee/MarketingHero',
              componentId: 'comp-marketing-hero',
              platformProjectId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
              updatedAt: '2026-08-20T12:00:00.000Z',
              previewRoot: {
                type: 'SiteStack',
                props: {},
                children: [
                  { type: 'SiteButton', props: { children: 'Go', variant: 'primary' } },
                ],
              },
            },
          ],
        }),
      }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders starter sections, compositions, and atoms without DS promote', async () => {
    render(
      <AppProviders>
        <LibraryHub
          inAppEditor
          projects={[
            {
              id: 'p1',
              name: 'Demo Collection',
              status: 'active',
              platformProjectId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
              capabilityStatus: 'in_sync',
              lastActivityAt: null,
              compositionCount: 1,
              ownerUserId: null,
            },
          ]}
        />
      </AppProviders>,
    )

    expect(screen.getByTestId('library-site-kit-sections')).toBeInTheDocument()
    expect(screen.getByText('Hero')).toBeInTheDocument()
    expect(screen.getByTestId('library-section-preview-Composition:LandingHero')).toBeInTheDocument()
    expect(screen.getByTestId('library-section-open-kit-LandingHero')).toHaveAttribute(
      'href',
      expect.stringContaining('Composition%3ALandingHero'),
    )

    await waitFor(() => {
      expect(screen.getByText('Marketing Hero')).toBeInTheDocument()
    })

    expect(screen.getByTestId('library-site-kit-compositions')).toBeInTheDocument()
    expect(screen.queryByTestId('library-collection-filter')).toBeNull()
    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toContain(
      'platformProjectId=aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    )
    expect(screen.getByTestId('library-site-kit-atoms')).toBeInTheDocument()
    expect(screen.getByText('SiteButton')).toBeInTheDocument()
    expect(screen.getByTestId('library-atom-preview-SiteButton')).toBeInTheDocument()
    expect(screen.getByTestId('library-atom-open-kit-SiteButton')).toHaveAttribute(
      'href',
      expect.stringContaining('SiteButton'),
    )
    expect(screen.getByTestId('library-atom-open-editor-SiteButton')).toHaveAttribute(
      'href',
      expect.stringContaining('insertType=SiteButton'),
    )
    expect(screen.getByTestId('library-composition-preview-comp-marketing-hero')).toBeInTheDocument()
    expect(screen.getByText('Forms')).toBeInTheDocument()
    expect(screen.queryByText(/DS Promote/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/ds-button/)).not.toBeInTheDocument()
  })
})
