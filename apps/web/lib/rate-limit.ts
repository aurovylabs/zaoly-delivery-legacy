/**
 * In-process sliding-window rate limiter (single node).
 * Spec: `knowledge/zaoly-admin-hardening.md`
 */

type Bucket = {
  /** Timestamps of recent hits (ms). */
  hits: number[]
}

const buckets = new Map<string, Bucket>()

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number }

/** Test helper — clears all buckets. */
export function resetRateLimitBucketsForTests(): void {
  buckets.clear()
}

export function clientIpFromHeaders(headers: Headers): string {
  const xf = headers.get('x-forwarded-for')
  if (xf) {
    const first = xf.split(',')[0]?.trim()
    if (first) return first
  }
  const real = headers.get('x-real-ip')?.trim()
  if (real) return real
  return 'unknown'
}

export function takeRateLimit(
  key: string,
  max: number,
  windowMs: number,
  nowMs: number = Date.now(),
): RateLimitResult {
  const windowStart = nowMs - windowMs
  let bucket = buckets.get(key)
  if (!bucket) {
    bucket = { hits: [] }
    buckets.set(key, bucket)
  }
  bucket.hits = bucket.hits.filter((t) => t > windowStart)
  if (bucket.hits.length >= max) {
    const oldest = bucket.hits[0] ?? nowMs
    const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - nowMs) / 1000))
    return { ok: false, retryAfterSec }
  }
  bucket.hits.push(nowMs)
  return { ok: true }
}

export function rateLimitResponse(retryAfterSec: number): Response {
  return Response.json(
    { error: 'rate_limited', retryAfterSec },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfterSec) },
    },
  )
}
