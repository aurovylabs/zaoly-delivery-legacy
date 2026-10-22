import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from '../components/Button'
import { PromotedTokenBindingsApplier } from './promotedTokenBindings'
import { Text } from '../components/Text'

describe('promotedTokenBindings (runtime bridge)', () => {
  it('maps Button tokenBindings.color → --accent override and tokenBindings.radius → borderRadius', () => {
    const { container } = render(
      <PromotedTokenBindingsApplier
        tokenBindings={{
          color: 'color.muted',
          radius: 'radius.pill',
        }}
      >
        <Button variant="primary" shape="rounded">
          Go
        </Button>
      </PromotedTokenBindingsApplier>,
    )

    const btn = container.querySelector('button.ds-btn') as HTMLButtonElement | null
    expect(btn).toBeTruthy()
    expect(btn!.style.getPropertyValue('--accent')).toBe('var(--muted)')
    expect(btn!.style.borderRadius).toBe('var(--radius-pill)')
  })

  it('maps promoted Text tokenBindings.typography.heading.h1 → inline overrides', () => {
    const { getByText } = render(
      <PromotedTokenBindingsApplier
        tokenBindings={{
          fontFamily: 'typography.heading.h1',
          fontSize: 'typography.heading.h1',
          fontWeight: 'typography.heading.h1',
          letterSpacing: 'typography.heading.h1',
          lineHeight: 'typography.heading.h1',
          color: 'color.neutral.700',
        }}
      >
        <Text role="headline">Trust</Text>
      </PromotedTokenBindingsApplier>,
    )

    const el = getByText('Trust') as HTMLElement
    expect(el.style.fontFamily).toBe('var(--font-display)')
    expect(el.style.fontSize).toBe('var(--type-display)')
    expect(el.style.fontWeight).toBe('var(--weight-bold)')
    expect(el.style.letterSpacing).toBe('var(--track-display)')
    expect(el.style.color).toBe('var(--ink)')
  })
})

