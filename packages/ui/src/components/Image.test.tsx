import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Image } from './Image'

describe('Image', () => {
  it('renders with alt', () => {
    render(<Image src="/x.png" alt="Image" />)
    expect(screen.getByAltText('Image')).toBeInTheDocument()
  })
})
