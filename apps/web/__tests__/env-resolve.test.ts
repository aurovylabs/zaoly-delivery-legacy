import { afterEach, describe, expect, it } from 'vitest'
import { envGet } from '../lib/env-resolve'

describe('envGet', () => {
  afterEach(() => {
    delete process.env.ZAOLY_EDITOR_INAPP
    delete process.env.CREATION_EDITOR_INAPP
    delete process.env.NEXT_PUBLIC_ZAOLY_URL
    delete process.env.NEXT_PUBLIC_CREATION_URL
  })

  it('reads ZAOLY_* keys', () => {
    process.env.ZAOLY_EDITOR_INAPP = '1'
    expect(envGet('ZAOLY_EDITOR_INAPP')).toBe('1')
  })

  it('does not fall back to CREATION_* aliases', () => {
    delete process.env.ZAOLY_EDITOR_INAPP
    process.env.CREATION_EDITOR_INAPP = '1'
    expect(envGet('ZAOLY_EDITOR_INAPP')).toBeUndefined()
  })

  it('does not fall back to NEXT_PUBLIC_CREATION_* aliases', () => {
    delete process.env.NEXT_PUBLIC_ZAOLY_URL
    process.env.NEXT_PUBLIC_CREATION_URL = 'https://example.test'
    expect(envGet('NEXT_PUBLIC_ZAOLY_URL')).toBeUndefined()
  })
})
