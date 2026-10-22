// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ForgotPasswordPage } from '../components/forgot-password-page'
import { paths } from '../lib/paths'

vi.mock('../lib/user-prefs', () => ({
  useUserPrefs: () => ({
    t: (key: string) => key,
    locale: 'en',
  }),
}))

describe('ForgotPasswordPage', () => {
  it('renders email form and sign-in link', () => {
    render(<ForgotPasswordPage authConfigured />)
    expect(screen.getByLabelText('login.email')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'common.signIn' })).toHaveAttribute(
      'href',
      paths.routes.login,
    )
  })
})
