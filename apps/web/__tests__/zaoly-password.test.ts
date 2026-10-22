import { describe, expect, it } from 'vitest'
import {
  assertPasswordPolicy,
  hashPassword,
  verifyPassword,
} from '../lib/users/password'

describe('zaoly password', () => {
  it('enforces min length', () => {
    expect(assertPasswordPolicy('short')).toBe('password_too_short')
    expect(assertPasswordPolicy('long-enough')).toBeNull()
  })

  it('round-trips scrypt hash', () => {
    const hash = hashPassword('correct-horse')
    expect(hash.startsWith('scrypt$')).toBe(true)
    expect(verifyPassword('correct-horse', hash)).toBe(true)
    expect(verifyPassword('wrong-password', hash)).toBe(false)
  })
})
