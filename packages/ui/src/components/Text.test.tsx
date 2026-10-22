import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Text } from './Text'

describe('Text', () => {
  it('applies body role by default', () => {
    render(<Text>Hello</Text>)
    expect(screen.getByText('Hello').className).toContain('ds-text-body')
  })

  it('maps roles and size modifiers', () => {
    render(
      <Text role="hint" size="2xs">
        path
      </Text>,
    )
    const el = screen.getByText('path')
    expect(el.className).toContain('ds-text-hint')
    expect(el.className).toContain('ds-text--2xs')
  })

  it('allows custom element via as', () => {
    render(
      <Text role="title" as="h3">
        Section
      </Text>,
    )
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Section')
  })

  it('maps headline role for Signals-scale titles', () => {
    render(<Text role="headline">Big signal title</Text>)
    const el = screen.getByRole('heading', { level: 2 })
    expect(el.className).toContain('ds-text-headline')
  })
})
