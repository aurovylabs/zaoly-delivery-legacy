import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AccentSwatchGroup } from './AccentSwatchGroup'
import {
  applyAccentPreference,
  migrateLegacyAccent,
  resolveAccentOption,
} from '../accentPreference'

describe('AccentSwatchGroup', () => {
  it('fires onChange for a swatch', () => {
    const onChange = vi.fn()
    render(<AccentSwatchGroup value="green" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'purple' }))
    expect(onChange).toHaveBeenCalledWith('purple')
  })
})

describe('accentPreference', () => {
  it('migrates legacy CSS vars', () => {
    expect(migrateLegacyAccent('--color-secondary-dx-purple')).toBe('purple')
    expect(migrateLegacyAccent('--audion-light-border-color')).toBe('ink')
    expect(migrateLegacyAccent('blue')).toBe('blue')
    expect(migrateLegacyAccent(null)).toBe('green')
  })

  it('applies --accent on documentElement', () => {
    applyAccentPreference('orange')
    expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#ff6a3b')
    expect(document.documentElement.getAttribute('data-accent')).toBe('orange')
    expect(resolveAccentOption('orange').textColor).toBe('#ffffff')
  })
})
