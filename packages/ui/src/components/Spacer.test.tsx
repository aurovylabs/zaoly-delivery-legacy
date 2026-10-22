import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Spacer } from './Spacer'

describe('Spacer', () => {
  it('renders spacer element', () => {
    const { container } = render(<Spacer />)
    expect(container.querySelector('.ds-spacer')).toBeTruthy()
  })
})
