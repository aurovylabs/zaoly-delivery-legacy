import { NextResponse } from 'next/server'
import {
  sendEmailVerifyEmail,
  sendWelcomeEmail,
  voidSystemMail,
} from '../../../lib/mail/system-mail'
import { paths } from '../../../lib/paths'
import {
  clientIpFromHeaders,
  rateLimitResponse,
  takeRateLimit,
} from '../../../lib/rate-limit'
import {
  isGoogleAuthConfigured,
  isPublicSignupEnabled,
  isZaolyDatabaseConfigured,
} from '../../../lib/runtime-config'
import { voidEnsureStarterLandingForUser } from '../../../lib/scene/user-starter-scene'
import {
  createEmailVerification,
  registerLocalMember,
} from '../../../lib/users/user-store'


/** Public email/password signup · Spec `zaoly-user-management.md`. */
export async function POST(req: Request) {
  const limited = takeRateLimit(
    `register:${clientIpFromHeaders(req.headers)}`,
    paths.rateLimitAuthRegisterMax,
    paths.rateLimitAuthRegisterWindowMs,
  )
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec)

  if (!isZaolyDatabaseConfigured()) {
    return NextResponse.json({ error: 'auth_not_configured' }, { status: 503 })
  }
  if (!isPublicSignupEnabled()) {
    return NextResponse.json({ error: 'signup_disabled' }, { status: 403 })
  }

  let body: { email?: unknown; password?: unknown; name?: unknown }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const name = typeof body.name === 'string' ? body.name : undefined

  try {
    const user = await registerLocalMember({ email, password, name })
    voidEnsureStarterLandingForUser(user.id)
    voidSystemMail(sendWelcomeEmail({ to: user.email, name: user.name }))
    voidSystemMail(
      (async () => {
        const minted = await createEmailVerification({ userId: user.id })
        if (!minted) return { ok: false as const, error: 'smtp_not_configured' }
        return sendEmailVerifyEmail({
          to: minted.email,
          verifyUrl: minted.verifyUrl,
        })
      })(),
    )
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })
  } catch (err) {
    const code = err instanceof Error ? err.message : 'register_failed'
    if (code === 'already_exists') {
      return NextResponse.json({ error: code }, { status: 409 })
    }
    if (code === 'password_too_short' || code === 'invalid_email') {
      return NextResponse.json({ error: code }, { status: 400 })
    }
    return NextResponse.json({ error: 'register_failed' }, { status: 500 })
  }
}

export function GET() {
  return NextResponse.json({
    signup: isPublicSignupEnabled(),
    google: isGoogleAuthConfigured(),
  })
}
