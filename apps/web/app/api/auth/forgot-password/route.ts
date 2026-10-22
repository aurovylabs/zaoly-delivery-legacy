import { NextResponse } from 'next/server'
import { resolveMailLocale } from '../../../../lib/mail/mail-locale'
import { sendPasswordResetEmail, voidSystemMail } from '../../../../lib/mail/system-mail'
import { paths } from '../../../../lib/paths'
import {
  clientIpFromHeaders,
  rateLimitResponse,
  takeRateLimit,
} from '../../../../lib/rate-limit'
import { isZaolyDatabaseConfigured } from '../../../../lib/runtime-config'
import {
  createPasswordReset,
  isZaolyUserStoreAvailable,
} from '../../../../lib/users/user-store'


/** Opaque forgot-password · Spec `zaoly-system-mail.md`. */
export async function POST(req: Request) {
  const limited = takeRateLimit(
    `forgot:${clientIpFromHeaders(req.headers)}`,
    paths.rateLimitAuthForgotMax,
    paths.rateLimitAuthForgotWindowMs,
  )
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec)

  if (!isZaolyDatabaseConfigured() || !isZaolyUserStoreAvailable()) {
    return NextResponse.json({ error: 'auth_not_configured' }, { status: 503 })
  }
  let body: { email?: unknown; locale?: unknown }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 })
  }
  const locale = resolveMailLocale(typeof body.locale === 'string' ? body.locale : 'en')
  try {
    const reset = await createPasswordReset({ email })
    if (reset) {
      voidSystemMail(
        sendPasswordResetEmail({
          to: reset.email,
          resetUrl: reset.resetUrl,
          locale,
        }),
      )
    }
  } catch {
    // Still opaque — never leak store errors to callers.
  }
  return NextResponse.json({ ok: true })
}
