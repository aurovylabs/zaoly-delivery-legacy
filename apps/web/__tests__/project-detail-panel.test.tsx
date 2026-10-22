import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppProviders } from '../components/app-providers'
import { ProjectDetailPanel } from '../components/project-detail-panel'
import type { CompositionSummary, ProjectDetail } from '@zaoly/contracts'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

const project: ProjectDetail = {
  id: 'proj-1',
  name: 'North',
  status: 'active',
  platformProjectId: 'plx-1',
  capabilityStatus: 'in_sync',
  lastActivityAt: null,
  compositionCount: 1,
  ownerUserId: null,
  description: 'Test project',
}

const compositions: CompositionSummary[] = [
  {
    id: 'scene-1',
    name: 'Landing',
    updatedAt: '2026-08-10T12:00:00.000Z',
    status: 'draft',
    platformProjectId: 'plx-1',
  },
]

describe('project detail panel', () => {
  it('lists compositions with sceneId open href', () => {
    render(
      <AppProviders>
        <ProjectDetailPanel project={project} compositions={compositions} inAppEditor />
      </AppProviders>,
    )
    expect(screen.getByText('Landing')).toBeInTheDocument()
    const links = screen.getAllByRole('link', { name: /^Zaoly Editor$/i })
    const sceneLink = links.find((a) => a.getAttribute('href')?.includes('sceneId=scene-1'))
    expect(sceneLink).toHaveAttribute(
      'href',
      '/editor?sceneId=scene-1&platformProjectId=plx-1',
    )
  })

  it('shows empty state when no compositions', () => {
    render(
      <AppProviders>
        <ProjectDetailPanel project={project} compositions={[]} inAppEditor />
      </AppProviders>,
    )
    expect(screen.getByText(/No compositions in this project yet/i)).toBeInTheDocument()
  })

  it('exposes Edit and Archive actions', () => {
    render(
      <AppProviders>
        <ProjectDetailPanel project={project} compositions={[]} inAppEditor />
      </AppProviders>,
    )
    expect(screen.getByRole('button', { name: /^edit$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^archive$/i })).toBeInTheDocument()
  })
})
