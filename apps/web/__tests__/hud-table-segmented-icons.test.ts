import { describe, expect, it } from 'vitest'
import { IconDensityCompact } from '../lib/zaoly-ui'
import { inspectEnumIcon, inspectPropIcon } from '../lib/inspect/icons'

describe('Wave C table segmented icons', () => {
  it('exports density icons and maps enum values', () => {
    expect(typeof IconDensityCompact).toBe('function')
    expect(inspectEnumIcon('density', 'compact')).toBeTruthy()
    expect(inspectEnumIcon('density', 'default')).toBeTruthy()
    expect(inspectEnumIcon('density', 'comfortable')).toBeTruthy()
    expect(inspectEnumIcon('borders', 'none')).toBeTruthy()
    expect(inspectEnumIcon('borders', 'row')).toBeTruthy()
    expect(inspectEnumIcon('borders', 'all')).toBeTruthy()
    expect(inspectPropIcon('openAssetLibrary')).toBeTruthy()
    expect(inspectPropIcon('openSvgDeepEdit')).toBeTruthy()
  })
})
