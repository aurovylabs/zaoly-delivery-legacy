import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Grid } from './Grid'

describe('Grid', () => {
  it('renders children', () => {
    render(<Grid>Grid</Grid>)
    expect(screen.getByText('Grid')).toBeInTheDocument()
  })
})
