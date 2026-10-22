import { describe, expect, it } from 'vitest'
import { readLeftTab, LEFT_TAB_KEY } from '../components/editor/editor-boot'

describe('readLeftTab / hydration default', () => {
  it('returns components when session is empty', () => {
    sessionStorage.removeItem(LEFT_TAB_KEY)
    expect(readLeftTab()).toBe('components')
  })

  it('restores tokens from sessionStorage after mount (client-only)', () => {
    sessionStorage.setItem(LEFT_TAB_KEY, 'tokens')
    expect(readLeftTab()).toBe('tokens')
    sessionStorage.removeItem(LEFT_TAB_KEY)
  })
})
