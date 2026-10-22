/**
 * Collection Team panel — compact inline add, roster render, unbound empty state.
 * Spec: specs/domain/project-team.md
 */

import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ProjectTeamPanel } from '../components/project-team-panel'
import { UserPrefsProvider } from '../lib/user-prefs'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}))

const BOUND_COLLECTION = 'a1b2c3d4-e5f6-4789-a012-3456789abcde'

function renderTeam(ui: React.ReactElement) {
  return render(<UserPrefsProvider>{ui}</UserPrefsProvider>)
}

describe('ProjectTeamPanel', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/members')) {
        return new Response(
          JSON.stringify({
            items: [
              { id: 'u-owner', email: 'owner@example.com', role: 'admin', status: 'owner' },
              { id: 'u-2', email: 'member@example.com', role: 'member', status: 'active' },
            ],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        )
      }
      return new Response(JSON.stringify({ error: 'unexpected' }), { status: 500 })
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the Plexon roster as numbered magazine rows', async () => {
    renderTeam(<ProjectTeamPanel projectId="proj-1" platformProjectId={BOUND_COLLECTION} />)

    await waitFor(() => {
      expect(screen.getByText('owner@example.com')).toBeTruthy()
    })
    expect(screen.getByText('member@example.com')).toBeTruthy()
    expect(document.querySelectorAll('.creation-magazine-list-num').length).toBeGreaterThan(1)
    expect(fetchMock).toHaveBeenCalledWith('/api/projects/proj-1/members', {
      cache: 'no-store',
    })
  })

  it('uses a magazine add-row draft instead of a persistent Field input', async () => {
    renderTeam(<ProjectTeamPanel projectId="proj-1" platformProjectId={BOUND_COLLECTION} />)

    await waitFor(() => {
      expect(screen.getByText('owner@example.com')).toBeTruthy()
    })

    expect(document.querySelector('.ds-field')).toBeNull()
    expect(screen.queryByRole('textbox')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /add member/i }))

    const emailInput = await screen.findByRole('textbox', { name: /add member/i })
    expect(emailInput.className).toContain('creation-project-team__input')
    expect(emailInput.getAttribute('placeholder')).toMatch(/@/)
  })

  it('posts the drafted email on Enter', async () => {
    renderTeam(<ProjectTeamPanel projectId="proj-1" platformProjectId={BOUND_COLLECTION} />)
    await waitFor(() => {
      expect(screen.getByText('owner@example.com')).toBeTruthy()
    })

    fireEvent.click(screen.getByRole('button', { name: /add member/i }))
    const emailInput = await screen.findByRole('textbox', { name: /add member/i })
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } })
    fireEvent.keyDown(emailInput, { key: 'Enter' })

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([, init]) =>
            (init as RequestInit | undefined)?.method === 'POST' &&
            String((init as RequestInit | undefined)?.body).includes('new@example.com'),
        ),
      ).toBe(true)
    })
  })

  it('shows the Collection sync empty state when unbound', () => {
    renderTeam(<ProjectTeamPanel projectId="proj-1" platformProjectId="plx-local-1" />)
    expect(screen.getByText(/Set a platform project ID on this project to manage team members/i)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /add member/i })).toBeNull()
    expect(
      fetchMock.mock.calls.some(([input]) => String(input).includes('/members')),
    ).toBe(false)
  })
})
