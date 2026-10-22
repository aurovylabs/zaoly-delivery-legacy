import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi, afterEach } from 'vitest'
import { SettingsShell } from './SettingsShell'
import {
  applyThemePreference,
  migrateLegacyThemeId,
  resolveThemeId,
} from '../themePreference'

afterEach(() => {
  document.documentElement.removeAttribute('data-theme')
})

describe('SettingsShell', () => {
  it('renders core bands in magazine order', () => {
    render(
      <SettingsShell
        labels={{
          account: 'Account',
          profile: 'Profile',
          appearance: 'Appearance',
          language: 'Language',
        }}
        lede={<p>Lead</p>}
        account={<span>A</span>}
        profile={<span>P</span>}
        appearance={<span>Th</span>}
        language={<span>L</span>}
        extras={<span>X</span>}
      />,
    )
    expect(screen.getByTestId('settings-shell')).toBeInTheDocument()
    expect(screen.getByTestId('settings-band-account')).toBeInTheDocument()
    expect(screen.getByTestId('settings-band-profile')).toBeInTheDocument()
    expect(screen.getByTestId('settings-band-appearance')).toBeInTheDocument()
    expect(screen.getByTestId('settings-band-language')).toBeInTheDocument()
    expect(screen.getByText('Lead')).toBeInTheDocument()
    expect(screen.getByText('X')).toBeInTheDocument()
  })
})

describe('themePreference', () => {
  it('migrates legacy theme ids', () => {
    expect(migrateLegacyThemeId('zaoly')).toBe('light')
    expect(migrateLegacyThemeId('zaoly-dark')).toBe('dark')
    expect(migrateLegacyThemeId('zaoly-v2')).toBe('light')
    expect(migrateLegacyThemeId('zaoly-v2-dark')).toBe('dark')
    expect(migrateLegacyThemeId('auto')).toBe('auto')
    expect(migrateLegacyThemeId(null)).toBe('dark')
  })

  it('resolves light and dark', () => {
    expect(resolveThemeId('light')).toBe('zaoly')
    expect(resolveThemeId('dark')).toBe('zaoly-dark')
    expect(resolveThemeId('auto', true)).toBe('zaoly-dark')
    expect(resolveThemeId('auto', false)).toBe('zaoly')
  })

  it('applies preference to documentElement', () => {
    applyThemePreference('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('zaoly')
    applyThemePreference('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('zaoly-dark')
  })

  it('installs matchMedia listener for auto', () => {
    const listeners: Array<() => void> = []
    const mq = {
      matches: true,
      media: '(prefers-color-scheme: dark)',
      addEventListener: (_: string, cb: () => void) => {
        listeners.push(cb)
      },
      removeEventListener: vi.fn(),
    }
    const original = window.matchMedia
    window.matchMedia = (() => mq) as typeof window.matchMedia
    try {
      const cleanup = applyThemePreference('auto')
      expect(document.documentElement.getAttribute('data-theme')).toBe('zaoly-dark')
      mq.matches = false
      listeners.forEach((cb) => cb())
      expect(document.documentElement.getAttribute('data-theme')).toBe('zaoly')
      cleanup()
      expect(mq.removeEventListener).toHaveBeenCalled()
    } finally {
      window.matchMedia = original
    }
  })
})
