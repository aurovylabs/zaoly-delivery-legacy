import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import {
  TOKEN_RECENT_STORAGE_KEY,
  loadTokenRecent,
  saveTokenRecent,
} from '../lib/inspect/token-recent'

describe('token-recent (P77)', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  it('round-trips paths via sessionStorage', () => {
    expect(loadTokenRecent()).toEqual([])
    saveTokenRecent(['radius.md', 'space.sm'])
    expect(loadTokenRecent()).toEqual(['radius.md', 'space.sm'])
    expect(sessionStorage.getItem(TOKEN_RECENT_STORAGE_KEY)).toContain('radius.md')
  })

  it('caps at 8 paths', () => {
    saveTokenRecent(Array.from({ length: 12 }, (_, i) => `t.${i}`))
    expect(loadTokenRecent()).toHaveLength(8)
  })
})
