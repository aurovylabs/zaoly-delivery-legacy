import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from './index'
import { SectionChrome } from './SectionChrome'

describe('SectionChrome', () => {
  it('renders title with ds-text-title + section-chrome classes', () => {
    render(<SectionChrome title="Research" meta="n=12" />)
    const title = screen.getByRole('heading', { name: 'Research', level: 2 })
    expect(title.className).toContain('section-chrome-title')
    expect(title.className).toContain('ds-text-title')
    const meta = screen.getByText('n=12')
    expect(meta.className).toContain('section-chrome-meta')
    expect(meta.className).toContain('ds-text-meta')
  })

  it('supports quiet h3 without icon slot', () => {
    const { container } = render(
      <SectionChrome
        title="Categories"
        quiet
        as="h3"
        icon={<span data-testid="icon">i</span>}
      />,
    )
    expect(container.querySelector('.section-chrome-quiet')).toBeTruthy()
    expect(screen.getByRole('heading', { level: 3, name: 'Categories' })).toBeTruthy()
    expect(screen.queryByTestId('icon')).toBeNull()
  })

  it('supports accent meta tone for counts', () => {
    render(<SectionChrome title="Project knowledge" meta="4" metaTone="accent" quiet as="h3" />)
    const meta = screen.getByText('4')
    expect(meta.className).toContain('section-chrome-meta--accent')
  })

  it('renders action and panel role class', () => {
    const { container } = render(
      <SectionChrome
        title="Signals"
        role="signals"
        action={
          <Button variant="ghost" size="sm">
            Open
          </Button>
        }
      />,
    )
    expect(container.querySelector('.panel-role-signals')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Open' })).toBeTruthy()
  })
})
