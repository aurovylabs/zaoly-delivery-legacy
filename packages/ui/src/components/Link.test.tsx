import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Link } from './Link'

describe('Link', () => {
  it('renders children', () => {
    render(<Link href="#">Link</Link>)
    expect(screen.getByText('Link')).toBeInTheDocument()
  })
})
