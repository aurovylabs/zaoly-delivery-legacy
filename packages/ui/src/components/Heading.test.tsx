import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Heading } from './Heading'

describe('Heading', () => {
  it('renders children', () => {
    render(<Heading>Heading</Heading>)
    expect(screen.getByText('Heading')).toBeInTheDocument()
  })
})
