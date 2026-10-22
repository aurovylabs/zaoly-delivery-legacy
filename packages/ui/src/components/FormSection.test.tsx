import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FormSection } from './FormSection'

describe('FormSection', () => {
  it('renders title and children', () => {
    render(
      <FormSection title="Identity" titleId="fs-id">
        <span>Path field</span>
      </FormSection>
    )
    expect(screen.getByRole('heading', { name: 'Identity' })).toHaveAttribute('id', 'fs-id')
    expect(screen.getByText('Path field')).toBeInTheDocument()
    expect(screen.getByText('Identity').closest('section')?.className).toContain('ds-form-section')
  })

  it('applies advanced tone class', () => {
    const { container } = render(
      <FormSection title="Lab" tone="advanced">
        raw
      </FormSection>
    )
    expect(container.querySelector('.ds-form-section--advanced')).toBeTruthy()
  })
})
