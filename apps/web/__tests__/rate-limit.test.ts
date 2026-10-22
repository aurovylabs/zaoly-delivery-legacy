import { beforeEach, describe, expect, it } from 'vitest'
import {
  clientIpFromHeaders,
  rateLimitResponse,
  resetRateLimitBucketsForTests,
  takeRateLimit,
} from '../lib/rate-limit'
import { paths } from '../lib/paths'

describe('rate-limit', () => {
  beforeEach(() => {
    resetRateLimitBucketsForTests()
  })

  it('allows up to max hits then returns 429 metadata', () => {
    const key = 't:ip'
    const max = 3
    const windowMs = 60_000
    const t0 = 1_000_000
    expect(takeRateLimit(key, max, windowMs, t0)).toEqual({ ok: true })
    expect(takeRateLimit(key, max, windowMs, t0 + 1)).toEqual({ ok: true })
    expect(takeRateLimit(key, max, windowMs, t0 + 2)).toEqual({ ok: true })
    const blocked = takeRateLimit(key, max, windowMs, t0 + 3)
    expect(blocked.ok).toBe(false)
    if (!blocked.ok) {
      expect(blocked.retryAfterSec).toBeGreaterThanOrEqual(1)
    }
  })

  it('slides the window after expiry', () => {
    const key = 'slide'
    const max = 2
    const windowMs = 1000
    expect(takeRateLimit(key, max, windowMs, 0).ok).toBe(true)
    expect(takeRateLimit(key, max, windowMs, 1).ok).toBe(true)
    expect(takeRateLimit(key, max, windowMs, 2).ok).toBe(false)
    expect(takeRateLimit(key, max, windowMs, 1001).ok).toBe(true)
  })

  it('parses client IP from x-forwarded-for', () => {
    const h = new Headers({ 'x-forwarded-for': '203.0.113.9, 10.0.0.1' })
    expect(clientIpFromHeaders(h)).toBe('203.0.113.9')
  })

  it('rateLimitResponse is 429 with Retry-After', async () => {
    const res = rateLimitResponse(42)
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBe('42')
    await expect(res.json()).resolves.toEqual({
      error: 'rate_limited',
      retryAfterSec: 42,
    })
  })

  it('exposes auth rate-limit constants on paths', () => {
    expect(paths.rateLimitAuthLoginMax).toBeGreaterThan(0)
    expect(paths.rateLimitAuthRegisterMax).toBeGreaterThan(0)
    expect(paths.rateLimitAuthForgotMax).toBeGreaterThan(0)
    expect(paths.rateLimitAuthInviteMax).toBeGreaterThan(0)
    expect(paths.impersonationTtlSeconds).toBe(30 * 60)
    expect(paths.impersonationReasonMinLength).toBe(8)
  })
})
