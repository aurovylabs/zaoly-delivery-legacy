import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { TokenPreview } from './TokenPreview'

afterEach(() => {
  cleanup()
})

describe('TokenPreview', () => {
  it('renders a color swatch from value', () => {
    const { container } = render(<TokenPreview kind="color" value="#224455" />)
    const el = container.querySelector('.ds-token-preview--color') as HTMLElement
    expect(el).toBeTruthy()
    expect(el.style.background).toBe('rgb(34, 68, 85)')
  })

  it('renders a spacing bar', () => {
    const { container } = render(<TokenPreview kind="space" value="16px" />)
    expect(container.querySelector('.ds-token-preview__bar')).toBeTruthy()
  })

  it('renders type sample text', () => {
    const { container } = render(<TokenPreview kind="type" value="16px" />)
    expect(container.textContent).toContain('Ag')
  })
})
