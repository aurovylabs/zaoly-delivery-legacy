import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { SplitCraftMenu } from './SplitCraftMenu'

afterEach(() => {
  cleanup()
})

describe('SplitCraftMenu', () => {
  it('renders title, left, and right slots as a dialog', () => {
    render(
      <SplitCraftMenu
        title="Style"
        leftLabel="Fonts"
        rightLabel="Properties"
        left={<button type="button">Inter</button>}
        right={<span>Size</span>}
      />,
    )
    expect(screen.getByRole('dialog', { name: 'Style' })).toBeInTheDocument()
    expect(screen.getByTestId('split-craft-menu-left')).toHaveTextContent('Fonts')
    expect(screen.getByTestId('split-craft-menu-left')).toHaveTextContent('Inter')
    expect(screen.getByTestId('split-craft-menu-right')).toHaveTextContent('Size')
    expect(screen.getByTestId('split-craft-menu').getAttribute('style') ?? '').toMatch(/400px/)
  })

  it('renders optional footer and custom header', () => {
    render(
      <SplitCraftMenu
        title="Style"
        header={<button type="button">Token</button>}
        left={<span>L</span>}
        right={<span>R</span>}
        footer={<span>Foot</span>}
      />,
    )
    expect(screen.getByTestId('split-craft-menu-head')).toHaveTextContent('Token')
    expect(screen.getByTestId('split-craft-menu-footer')).toHaveTextContent('Foot')
  })
})
