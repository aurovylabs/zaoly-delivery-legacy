import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Avatar } from './Avatar'

describe('Avatar', () => {
  it('defaults to square magazine shape with initials', () => {
    render(<Avatar name="Ada Lovelace" />)
    const el = screen.getByRole('img', { name: 'Ada Lovelace' })
    expect(el.className).toContain('ds-avatar--square')
    expect(el).toHaveAttribute('data-shape', 'square')
    expect(el.textContent).toBe('AL')
  })

  it('supports round shape for dense lists', () => {
    render(<Avatar name="List Mark" shape="round" size="sm" />)
    const el = screen.getByRole('img', { name: 'List Mark' })
    expect(el.className).toContain('ds-avatar--round')
    expect(el).toHaveAttribute('data-shape', 'round')
  })

  it('renders image when src is set', () => {
    render(<Avatar name="MSQ" src="https://example.com/a.png" alt="Portrait" />)
    const img = screen.getByRole('img', { name: 'Portrait' })
    expect(img).toHaveAttribute('src', 'https://example.com/a.png')
    expect(img.className).toContain('ds-avatar-img')
  })

  it('applies accent class for initials', () => {
    render(<Avatar name="Ada" accent="#00ca55" accentContrast="#000" />)
    const el = screen.getByRole('img', { name: 'Ada' })
    expect(el.className).toContain('ds-avatar--accented')
  })
})
