import { NextResponse } from 'next/server'
import { paths } from '../../../../lib/paths'
import {
  clientIpFromHeaders,
  rateLimitResponse,
  takeRateLimit,
} from '../../../../lib/rate-limit'
import { isZaolyDatabaseConfigured } from '../../../../lib/runtime-config'
import {
  consumeEmailVerification,
  isZaolyUserStoreAvailable,
} from '../../../../lib/users/user-store'


/** Consume soft email-verify token · Spec `zaoly-user-management.md`. */
export async function POST(req: Request) {
  const limited = takeRateLimit(
    `verify-email:${clientIpFromHeaders(req.headers)}`,
    paths.rateLimitAuthForgotMax,
    paths.rateLimitAuthForgotWindowMs,
  )
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec)

  if (!isZaolyDatabaseConfigured() || !isZaolyUserStoreAvailable()) {
    return NextResponse.json({ error: 'auth_not_configured' }, { status: 503 })
  }
  let body: { token?: unknown }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  const token = typeof body.token === 'string' ? body.token.trim() : ''
  if (!token) {
    return NextResponse.json({ error: 'invalid_token' }, { status: 400 })
  }
  try {
    await consumeEmailVerification(token)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const code = err instanceof Error ? err.message : 'invalid_token'
    if (code === 'token_expired') {
      return NextResponse.json({ error: code }, { status: 410 })
    }
    return NextResponse.json({ error: 'invalid_token' }, { status: 400 })
  }
}
