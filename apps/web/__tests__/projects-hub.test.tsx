import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppProviders } from '../components/app-providers'
import { ProjectsHub } from '../components/projects-hub'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

describe('projects hub', () => {
  it('renders Collection hub without freeform create or federation sync', () => {
    render(
      <AppProviders>
        <ProjectsHub projects={[]} />
      </AppProviders>,
    )
    expect(screen.queryByText('Wave 3')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /create project/i })).not.toBeInTheDocument()
    expect(screen.queryByTestId('collection-picker')).toBeNull()
    expect(screen.queryByRole('button', { name: /sync/i })).toBeNull()
    expect(document.body).not.toHaveTextContent(/Plexon/i)
  })

  it('lists projects with open link', () => {
    render(
      <AppProviders>
        <ProjectsHub
          projects={[
            {
              id: 'proj-1',
              name: 'Demo Collection',
              status: 'active',
              platformProjectId: 'plx-local-demo',
              capabilityStatus: 'pending',
              lastActivityAt: null,
              compositionCount: 0,
            },
          ]}
        />
      </AppProviders>,
    )
    expect(screen.getByText('Demo Collection')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /open/i })).toHaveAttribute('href', '/projects/proj-1')
    expect(screen.getByRole('button', { name: /^edit$/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /sync/i })).toBeNull()
  })
})
