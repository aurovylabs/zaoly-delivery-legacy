import { NextResponse } from 'next/server'
import { paths } from '../../../../../lib/paths'
import {
  clientIpFromHeaders,
  rateLimitResponse,
  takeRateLimit,
} from '../../../../../lib/rate-limit'
import { isZaolyDatabaseConfigured } from '../../../../../lib/runtime-config'
import { isMfaEnabledForUser } from '../../../../../lib/users/mfa-store'
import {
  isZaolyUserStoreAvailable,
  validateLocalCredentials,
} from '../../../../../lib/users/user-store'


/** Opaque MFA prepare · Spec `zaoly-platform-admin-mfa.md`. */
export async function POST(req: Request) {
  const limited = takeRateLimit(
    `login:${clientIpFromHeaders(req.headers)}`,
    paths.rateLimitAuthLoginMax,
    paths.rateLimitAuthLoginWindowMs,
  )
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec)

  if (!isZaolyDatabaseConfigured() || !isZaolyUserStoreAvailable()) {
    return NextResponse.json({ error: 'auth_not_configured' }, { status: 503 })
  }

  let body: { email?: unknown; password?: unknown }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ ok: false })
  }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (!email || !password) return NextResponse.json({ ok: false })

  const user = await validateLocalCredentials(email, password)
  if (!user) return NextResponse.json({ ok: false })
  const mfaRequired = await isMfaEnabledForUser(user.id)
  return NextResponse.json({ ok: true, mfaRequired })
}
