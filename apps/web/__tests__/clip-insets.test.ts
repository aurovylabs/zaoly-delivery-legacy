import { describe, expect, it } from 'vitest'
import {
  CLIP_INSET_PROP_KEYS,
  resolveClipPathFromSceneProps,
} from '../lib/inspect/clip-insets'
import { resolveNodePaintStyle } from '../lib/inspect/resolve-bindings'
import { inspectFieldsForType } from '../lib/inspect/field-catalog'

describe('clip insets (Wave 16 / CL1–CL3)', () => {
  it('registry exposes eight clipInset* props on Stack/Card', () => {
    for (const type of ['Stack', 'Card', 'SiteStack']) {
      const fields = inspectFieldsForType(type)
      for (const name of CLIP_INSET_PROP_KEYS) {
        expect(
          fields.some((f) => f.name === name && f.kind === 'token' && f.tokenGroup === 'space'),
          `${type}.${name}`,
        ).toBe(true)
      }
    }
  })

  it('returns undefined clip-path when insets are empty', () => {
    expect(resolveClipPathFromSceneProps({})).toBeUndefined()
    expect(
      resolveClipPathFromSceneProps({ clipInsetBottomLeftY: '0%' }),
    ).toBeUndefined()
  })

  it('builds bottom-slant polygon from clipInsetBottomLeftY', () => {
    expect(
      resolveClipPathFromSceneProps({ clipInsetBottomLeftY: '12%' }),
    ).toBe('polygon(0 0, 100% 0, 100% 100%, 0 calc(100% - 12%))')
  })

  it('resolveNodePaintStyle sets clipPath', () => {
    const style = resolveNodePaintStyle({
      background: '#fafafa',
      clipInsetBottomLeftY: '12%',
    })
    expect(style.clipPath).toBe('polygon(0 0, 100% 0, 100% 100%, 0 calc(100% - 12%))')
    expect(style.backgroundColor).toBe('#fafafa')
  })
})
