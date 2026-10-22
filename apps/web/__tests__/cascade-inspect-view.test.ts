import { describe, expect, it } from 'vitest'
import type { SceneNode } from '@zaoly/contracts'
import { cascadeInspectView } from '../lib/inspect/cascade-inspect-view'

describe('cascadeInspectView', () => {
  const node: SceneNode = {
    id: 'n1',
    type: 'Button',
    props: { bg: '#0066cc', label: 'Base' },
    tokenBindings: { color: 'color.ink' },
    breakpoints: {
      mobile: {
        props: { bg: '#00aa00' },
        tokenBindings: { color: 'color.mobile' },
      },
    },
    states: {
      hover: {
        props: { bg: '#ff0000' },
        tokenBindings: { color: 'color.hover' },
      },
    },
  }

  it('returns breakpoint cascade when state is default', () => {
    const view = cascadeInspectView(node, 'mobile', 'default')
    expect(view.props.bg).toBe('#00aa00')
    expect(view.tokenBindings.color).toBe('color.mobile')
    expect(view.overrideKeys.has('bg')).toBe(true)
    expect(view.overrideKeys.has('color')).toBe(true)
  })

  it('applies interactive state on top of breakpoint', () => {
    const view = cascadeInspectView(node, 'mobile', 'hover')
    expect(view.props.bg).toBe('#ff0000')
    expect(view.tokenBindings.color).toBe('color.hover')
    expect(view.overrideKeys.has('bg')).toBe(true)
    expect(view.overrideKeys.has('color')).toBe(true)
  })

  it('uses desktop base then hover when no BP override', () => {
    const view = cascadeInspectView(node, 'desktop', 'hover')
    expect(view.props.bg).toBe('#ff0000')
    expect(view.props.label).toBe('Base')
    expect(view.tokenBindings.color).toBe('color.hover')
  })
})
