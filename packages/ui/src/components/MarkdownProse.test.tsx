import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MarkdownProse } from './MarkdownProse'

describe('MarkdownProse', () => {
  it('renders GFM headings, lists, and tables', () => {
    const md = `## Vertragshändler

In **Remseck** findest du:

| Marke | Standort |
| --- | --- |
| VW | Ludwigsburg |

- BMW in Asperg
- [Mehr Infos](https://example.com)
`

    render(<MarkdownProse>{md}</MarkdownProse>)

    expect(screen.getByRole('heading', { level: 2, name: 'Vertragshändler' })).toBeTruthy()
    expect(screen.getByText('Remseck')).toBeTruthy()
    expect(screen.getByRole('table')).toBeTruthy()
    expect(screen.getByRole('columnheader', { name: 'Marke' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Mehr Infos' })).toHaveAttribute('href', 'https://example.com')
    expect(screen.getByText('BMW in Asperg')).toBeTruthy()
  })

  it('strips raw HTML via sanitize', () => {
    const { container } = render(<MarkdownProse>{'Hello<script>alert(1)</script>'}</MarkdownProse>)
    expect(container.querySelector('script')).toBeNull()
    expect(container.textContent).toContain('Hello')
  })
})
