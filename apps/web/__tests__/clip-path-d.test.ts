import { describe, expect, it } from 'vitest'
import {
  clipPathFromPathD,
  parseClipPathD,
} from '../lib/inspect/clip-path-d'
import { resolveClipPathFromSceneProps } from '../lib/inspect/clip-insets'
import { clipPropsFromCssPolygon } from '../lib/scene/clip-path-import'
import { defaultChildForType } from '../lib/scene/ops'

describe('clipPathD Phase D', () => {
  it('parses path() wrapper and raw d', () => {
    expect(parseClipPathD("path('M0 0 L10 0 Z')")).toBe('M0 0 L10 0 Z')
    expect(parseClipPathD('M0 0 L10 0 Z')).toBe('M0 0 L10 0 Z')
    expect(clipPathFromPathD('M0 0 L10 0 Z')).toBe("path('M0 0 L10 0 Z')")
  })

  it('resolveClipPath prefers clipPathD over polygon and insets', () => {
    const resolved = resolveClipPathFromSceneProps({
      clipPathD: 'M0 0 L100 0 L50 100 Z',
      clipPolygon: '0 0, 100% 0, 100% 100%, 0 100%',
      clipInsetBottomLeftY: '12%',
    })
    expect(resolved).toBe("path('M0 0 L100 0 L50 100 Z')")
  })

  it('HTML path() maps to clipPathD', () => {
    expect(clipPropsFromCssPolygon("path('M0 0 L1 0 Z')")).toEqual({
      clipPathD: 'M0 0 L1 0 Z',
    })
  })

  it('defaultChildForType SiteShape seeds path leaf', () => {
    const node = defaultChildForType('SiteShape')
    expect(node.type).toBe('SiteShape')
    expect(String(node.props?.d ?? '')).toContain('M24')
    expect(node.tokenBindings?.color).toBeTruthy()
  })
})
