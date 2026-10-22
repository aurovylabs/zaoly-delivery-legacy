import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import {
  IconGap,
  IconHeight,
  IconMargin,
  IconPadding,
  IconRadius,
  IconWidth,
} from './UiIconsWave3'

describe('layout length UI icons', () => {
  it('Gap / Padding / Margin / Radius use distinct metaphors', () => {
    const { container: gap } = render(<IconGap />)
    const { container: pad } = render(<IconPadding />)
    const { container: margin } = render(<IconMargin />)
    const { container: radius } = render(<IconRadius />)

    const paths = (root: HTMLElement) =>
      Array.from(root.querySelectorAll('path, rect, circle'))
        .map((p) => p.getAttribute('d') ?? `${p.tagName}:${p.getAttribute('x')}`)
        .join('|')

    expect(paths(gap)).not.toBe(paths(pad))
    expect(paths(pad)).not.toBe(paths(margin))
    expect(paths(pad)).not.toBe(paths(radius))
    expect(paths(margin)).not.toBe(paths(radius))
  })

  it('Padding reads as inner spacing (solid frame + filled inset + inward ticks)', () => {
    const { container } = render(<IconPadding />)
    expect(container.querySelectorAll('.ds-ui-icon__fill--solid').length).toBe(1)
    expect(container.querySelectorAll('.ds-ui-icon__stroke--dashed').length).toBe(0)
    // Four inward ticks as path elements beyond the outer frame stroke
    expect(container.querySelectorAll('path.ds-ui-icon__stroke').length).toBe(4)
  })

  it('Margin reads as outer spacing (dashed ring + hollow content + outward ticks)', () => {
    const { container } = render(<IconMargin />)
    expect(container.querySelectorAll('.ds-ui-icon__stroke--dashed').length).toBe(1)
    expect(container.querySelectorAll('.ds-ui-icon__fill--solid').length).toBe(0)
    expect(container.querySelectorAll('path.ds-ui-icon__stroke').length).toBe(4)
  })
})

describe('size dim UI icons', () => {
  it('Width / Height use axis arrows with soft guides', () => {
    const { container: width } = render(<IconWidth />)
    const { container: height } = render(<IconHeight />)
    expect(width.querySelectorAll('.ds-ui-icon__stroke--soft').length).toBe(2)
    expect(height.querySelectorAll('.ds-ui-icon__stroke--soft').length).toBe(2)
    const w = Array.from(width.querySelectorAll('path'))
      .map((p) => p.getAttribute('d') ?? '')
      .join('|')
    const h = Array.from(height.querySelectorAll('path'))
      .map((p) => p.getAttribute('d') ?? '')
      .join('|')
    expect(w).not.toBe(h)
  })
})
