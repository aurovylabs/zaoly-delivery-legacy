import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { InspectSection } from './InspectSection'

afterEach(() => {
  cleanup()
})

describe('InspectSection', () => {
  it('renders title and children with inspect chrome class', () => {
    render(
      <InspectSection title="Auto layout" titleId="sec-layout">
        <span>gap field</span>
      </InspectSection>,
    )
    expect(screen.getByRole('heading', { level: 3, name: 'Auto layout' })).toHaveAttribute(
      'id',
      'sec-layout',
    )
    expect(screen.getByText('gap field')).toBeInTheDocument()
    expect(screen.getByTestId('inspect-section').className).toContain('ds-inspect-section')
  })
})
