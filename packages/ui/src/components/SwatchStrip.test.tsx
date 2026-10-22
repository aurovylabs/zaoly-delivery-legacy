import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SwatchStrip } from './SwatchStrip'

describe('SwatchStrip', () => {
  it('renders N swatches and label', () => {
    const { container } = render(
      <SwatchStrip swatches={['#0B3D2E', '#C4A35A', '#fff']} label="3 colors" />
    )
    expect(container.querySelectorAll('.ds-swatch-strip__swatch')).toHaveLength(3)
    expect(screen.getByText('3 colors')).toBeInTheDocument()
  })

  it('respects max', () => {
    const { container } = render(
      <SwatchStrip swatches={['#1', '#2', '#3', '#4']} max={2} />
    )
    expect(container.querySelectorAll('.ds-swatch-strip__swatch')).toHaveLength(2)
  })

  it('shows empty state', () => {
    render(<SwatchStrip swatches={[]} />)
    expect(screen.getByText('Empty')).toBeInTheDocument()
  })
})
