import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ScrollArea } from './ScrollArea'

describe('ScrollArea', () => {
  it('applies ds-scroll and orientation class', () => {
    const { container } = render(
      <ScrollArea orientation="horizontal">content</ScrollArea>,
    )
    const el = container.firstElementChild
    expect(el).toHaveClass('ds-scroll')
    expect(el).toHaveClass('ds-scroll-area--x')
  })
})
