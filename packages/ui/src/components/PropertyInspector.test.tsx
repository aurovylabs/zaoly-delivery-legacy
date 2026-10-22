import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { InspectSection } from './InspectSection'
import { PropertyInspector } from './PropertyInspector'

afterEach(() => {
  cleanup()
})

describe('PropertyInspector', () => {
  it('renders title and empty state', () => {
    render(<PropertyInspector title="Inspector" />)
    expect(screen.getByText('Inspector')).toBeInTheDocument()
    expect(screen.getByText('Select a node')).toBeInTheDocument()
  })

  it('renders section children instead of empty label', () => {
    render(
      <PropertyInspector title="Inspector">
        <InspectSection title="Layout">
          <span>gap</span>
        </InspectSection>
      </PropertyInspector>,
    )
    expect(screen.queryByText('Select a node')).toBeNull()
    expect(screen.getByRole('heading', { name: 'Layout' })).toBeInTheDocument()
    expect(screen.getByText('gap')).toBeInTheDocument()
  })

  it('exposes ds-inspect-density for shared Field chrome', () => {
    const { container } = render(<PropertyInspector title="Inspector" />)
    expect(container.querySelector('.ds-property-inspector.ds-inspect-density')).toBeTruthy()
  })
})
