import { describe, expect, it } from 'vitest'
import {
  RECOMMENDED_RESPONSIVE_OVERRIDE_KEYS,
  fluidGridMinTrack,
  fluidGridTemplateFromColumns,
} from './layout-fluid'

describe('layout-fluid (Wave C)', () => {
  it('maps column counts to auto-fit minmax templates', () => {
    expect(fluidGridTemplateFromColumns(2)).toBe(
      'repeat(auto-fit, minmax(min(100%, 16rem), 1fr))',
    )
    expect(fluidGridTemplateFromColumns('3')).toBe(
      'repeat(auto-fit, minmax(min(100%, 14rem), 1fr))',
    )
    expect(fluidGridMinTrack(4)).toBe('12rem')
  })

  it('passes through explicit templates', () => {
    expect(fluidGridTemplateFromColumns('repeat(2, 1fr)')).toBe('repeat(2, 1fr)')
  })

  it('documents recommended OP-9 override keys', () => {
    expect(RECOMMENDED_RESPONSIVE_OVERRIDE_KEYS).toContain('direction')
    expect(RECOMMENDED_RESPONSIVE_OVERRIDE_KEYS).toContain('columns')
    expect(RECOMMENDED_RESPONSIVE_OVERRIDE_KEYS).toContain('hidden')
  })
})
