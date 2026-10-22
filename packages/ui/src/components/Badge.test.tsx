import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Badge } from './Badge'

describe('Badge', () => {
  it('renders children with neutral face by default', () => {
    render(<Badge>Badge</Badge>)
    const el = screen.getByText('Badge')
    expect(el.className).toContain('ds-badge')
    expect(el.className).toContain('ds-badge--neutral')
  })

  it.each([
    ['success', 'ds-badge--success'],
    ['warning', 'ds-badge--warning'],
    ['danger', 'ds-badge--danger'],
    ['accent', 'ds-badge--accent'],
  ] as const)('applies tone %s', (tone, className) => {
    render(<Badge tone={tone}>{tone}</Badge>)
    expect(screen.getByText(tone).className).toContain(className)
  })
})
