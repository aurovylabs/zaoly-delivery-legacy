import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { AppProviders } from '../components/app-providers'
import {
  HomeMagazine,
  buildHomeRecentCompositions,
  buildHomeRecentLibrary,
  buildHomeRecentProjects,
} from '../components/home-magazine'
import type { CompositionSummary, ProjectSummary } from '@zaoly/contracts'

const emptyProps = {
  projects: [] as ProjectSummary[],
  compositions: [] as CompositionSummary[],
  libraryItems: [],
}

describe('HomeMagazine', () => {
  it('renders cover wordmark, three launch tiles, and three recent columns', () => {
    render(
      <AppProviders>
        <HomeMagazine {...emptyProps} />
      </AppProviders>,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'CREATION' })).toBeInTheDocument()
    expect(document.querySelector('[data-section="home-magazine"]')).toBeTruthy()

    const launch = screen.getByLabelText('Launch actions')
    const ctaHrefs = [...launch.querySelectorAll('a.creation-home-cta')].map((a) =>
      a.getAttribute('href'),
    )
    expect(ctaHrefs).toEqual(['/projects', '/compositions', '/library'])

    expect(screen.getByLabelText(/Recent projects, compositions, and library/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Recent projects')).toBeInTheDocument()
    expect(screen.getByLabelText('Recent compositions')).toBeInTheDocument()
    expect(screen.getByLabelText('Recent library items')).toBeInTheDocument()
  })

  it('shows EmptyState CTAs when columns are empty', () => {
    render(
      <AppProviders>
        <HomeMagazine {...emptyProps} />
      </AppProviders>,
    )
    const projectsCol = screen.getByLabelText('Recent projects')
    expect(within(projectsCol).getByText(/No projects yet/i)).toBeInTheDocument()
    expect(within(projectsCol).getByRole('link', { name: /Open projects/i })).toHaveAttribute(
      'href',
      '/projects',
    )
    expect(
      within(screen.getByLabelText('Recent compositions')).getByText(/No compositions yet/i),
    ).toBeInTheDocument()
    expect(
      within(screen.getByLabelText('Recent library items')).getByText(
        /No library compositions yet/i,
      ),
    ).toBeInTheDocument()
  })

  it('lists recent entities when data is present', () => {
    const projects: ProjectSummary[] = [
      {
        id: 'p1',
        name: 'Alpha Collection',
        status: 'active',
        platformProjectId: 'plx-1',
        capabilityStatus: 'in_sync',
        lastActivityAt: '2026-08-01T00:00:00.000Z',
        compositionCount: 2,
        ownerUserId: null,
      },
    ]
    const compositions: CompositionSummary[] = [
      {
        id: 'c1',
        name: 'Hero Block',
        updatedAt: '2026-08-02T00:00:00.000Z',
        status: 'draft',
        platformProjectId: 'plx-1',
      },
    ]
    render(
      <AppProviders>
        <HomeMagazine
          projects={projects}
          compositions={compositions}
          libraryItems={[
            {
              name: 'Site Kit Card',
              exportName: 'SiteKitCard',
              storyTitle: 'Card / Default',
              updatedAt: '2026-08-03T00:00:00.000Z',
            },
          ]}
        />
      </AppProviders>,
    )
    expect(
      screen
        .getByLabelText('Recent projects')
        .querySelector('a.creation-home-recent-list__title')
        ?.getAttribute('href'),
    ).toBe('/projects/p1')
    expect(
      screen
        .getByLabelText('Recent compositions')
        .querySelector('a.creation-home-recent-list__title')
        ?.getAttribute('href'),
    ).toBe('/editor?sceneId=c1&platformProjectId=plx-1')
    expect(
      screen
        .getByLabelText('Recent library items')
        .querySelector('a.creation-home-recent-list__title')
        ?.getAttribute('href'),
    ).toBe('/library')
  })
})

describe('home recent builders', () => {
  it('sorts and limits projects', () => {
    const projects: ProjectSummary[] = [
      {
        id: 'old',
        name: 'Old',
        status: 'active',
        platformProjectId: 'a',
        capabilityStatus: 'in_sync',
        lastActivityAt: '2020-01-01T00:00:00.000Z',
        compositionCount: 0,
        ownerUserId: null,
      },
      {
        id: 'new',
        name: 'New',
        status: 'active',
        platformProjectId: 'b',
        capabilityStatus: 'in_sync',
        lastActivityAt: '2026-01-01T00:00:00.000Z',
        compositionCount: 0,
        ownerUserId: null,
      },
      {
        id: 'arch',
        name: 'Archived',
        status: 'archived',
        platformProjectId: 'c',
        capabilityStatus: 'in_sync',
        lastActivityAt: '2026-06-01T00:00:00.000Z',
        compositionCount: 0,
        ownerUserId: null,
      },
    ]
    expect(buildHomeRecentProjects(projects, 1).map((p) => p.id)).toEqual(['new'])
  })

  it('sorts compositions and library by updatedAt', () => {
    expect(
      buildHomeRecentCompositions(
        [
          { id: 'a', name: 'A', updatedAt: '2020-01-01T00:00:00.000Z', status: 'draft' },
          { id: 'b', name: 'B', updatedAt: '2026-01-01T00:00:00.000Z', status: 'ready' },
        ],
        1,
      ).map((c) => c.id),
    ).toEqual(['b'])
    expect(
      buildHomeRecentLibrary(
        [
          { name: 'X', exportName: 'X', storyTitle: 'x', updatedAt: null },
          {
            name: 'Y',
            exportName: 'Y',
            storyTitle: 'y',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        1,
      ).map((c) => c.exportName),
    ).toEqual(['Y'])
  })
})
