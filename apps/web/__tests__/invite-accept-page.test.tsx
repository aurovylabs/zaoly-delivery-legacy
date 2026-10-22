// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InviteAcceptClient } from '../app/invite/[token]/invite-accept-client'

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}))

describe('InviteAcceptClient', () => {
  it('renders name and password fields for invite-only signup', () => {
    render(<InviteAcceptClient token="invite-token" />)
    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument()
  })
})
