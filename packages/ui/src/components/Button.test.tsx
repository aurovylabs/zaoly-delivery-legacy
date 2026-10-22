import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button, buttonClassName } from './Button'

describe('Button', () => {
  it('defaults to primary md square magazine chrome', () => {
    render(<Button>Save</Button>)
    const btn = screen.getByRole('button', { name: 'Save' })
    expect(btn.className).toContain('ds-btn')
    expect(btn.className).toContain('ds-btn--primary')
    expect(btn.className).toContain('ds-btn--md')
    expect(btn.className).toContain('ds-btn--square')
  })

  it('applies variant size shape and block', () => {
    render(
      <Button variant="ghost" size="sm" shape="pill" block>
        More
      </Button>,
    )
    const btn = screen.getByRole('button', { name: 'More' })
    expect(btn.className).toContain('ds-btn--ghost')
    expect(btn.className).toContain('ds-btn--sm')
    expect(btn.className).toContain('ds-btn--pill')
    expect(btn.className).toContain('ds-btn--block')
    expect(btn.className).not.toContain('ds-btn--square')
  })

  it('maps legacy shape default to square', () => {
    render(
      <Button shape="default" variant="ghost">
        Open
      </Button>,
    )
    expect(screen.getByRole('button', { name: 'Open' }).className).toContain('ds-btn--square')
  })

  it('supports rounded soft shape', () => {
    render(
      <Button shape="rounded" variant="subtle">
        Soft
      </Button>,
    )
    expect(screen.getByRole('button', { name: 'Soft' }).className).toContain('ds-btn--rounded')
  })

  it('renders anchor when href is set', () => {
    render(
      <Button href="/scan" variant="primary" size="lg">
        New scan
      </Button>,
    )
    const link = screen.getByRole('link', { name: 'New scan' })
    expect(link.tagName).toBe('A')
    expect(link).toHaveAttribute('href', '/scan')
    expect(link.className).toContain('ds-btn--lg')
    expect(link.className).toContain('ds-btn--square')
  })

  it('forwards aria-label and data-testid onto href anchors', () => {
    render(
      <Button href="/compositions" variant="ghost" size="sm" aria-label="Back" data-testid="editor-back" />,
    )
    const link = screen.getByTestId('editor-back')
    expect(link.tagName).toBe('A')
    expect(link).toHaveAttribute('href', '/compositions')
    expect(link).toHaveAttribute('aria-label', 'Back')
  })

  it('buttonClassName matches Button defaults', () => {
    expect(buttonClassName()).toContain('ds-btn--primary')
    expect(buttonClassName()).toContain('ds-btn--md')
    expect(buttonClassName()).toContain('ds-btn--square')
    expect(buttonClassName({ variant: 'ghost', size: 'lg' })).toBe(
      'ds-btn ds-btn--ghost ds-btn--lg ds-btn--square',
    )
  })

  it('supports disabled and custom type', () => {
    render(
      <Button type="submit" disabled>
        Go
      </Button>,
    )
    const btn = screen.getByRole('button', { name: 'Go' })
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute('type', 'submit')
  })
})
