// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RegisterPage } from '../components/register-page'
import { paths } from '../lib/paths'

vi.mock('../lib/user-prefs', () => ({
  useUserPrefs: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

describe('RegisterPage', () => {
  it('renders signup form when public signup is on', () => {
    const { container } = render(<RegisterPage signupEnabled googleEnabled={false} />)
    expect(screen.getByLabelText('login.email')).toBeInTheDocument()
    expect(screen.getByLabelText('login.password')).toBeInTheDocument()
    expect(screen.getByLabelText('register.name')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'common.signIn' })).toHaveAttribute(
      'href',
      paths.routes.login,
    )
    expect(container.querySelector('.creation-login--landscape')).toBeTruthy()
    expect(container.querySelector('.creation-login__landscape')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
    expect(container.querySelector('.section-chrome-meta')).toBeNull()
    expect(container.querySelector('.section-chrome-title')).toBeTruthy()
  })

  it('shows Google when configured', () => {
    render(<RegisterPage signupEnabled googleEnabled />)
    expect(screen.getByText('login.continueWithGoogle')).toBeInTheDocument()
  })

  it('explains when signup is disabled', () => {
    render(<RegisterPage signupEnabled={false} googleEnabled={false} />)
    expect(screen.getByText('register.disabled')).toBeInTheDocument()
  })
})
