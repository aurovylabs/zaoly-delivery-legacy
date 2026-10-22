import { NextResponse } from 'next/server'
import { resolveMailLocale } from '../../../../lib/mail/mail-locale'
import { sendPasswordChangedEmail, voidSystemMail } from '../../../../lib/mail/system-mail'
import { isZaolyDatabaseConfigured } from '../../../../lib/runtime-config'
import {
  consumePasswordReset,
  isZaolyUserStoreAvailable,
} from '../../../../lib/users/user-store'


/** Consume password-reset token · Spec `zaoly-system-mail.md`. */
export async function POST(req: Request) {
  if (!isZaolyDatabaseConfigured() || !isZaolyUserStoreAvailable()) {
    return NextResponse.json({ error: 'auth_not_configured' }, { status: 503 })
  }
  let body: { token?: unknown; password?: unknown; locale?: unknown }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  const token = typeof body.token === 'string' ? body.token.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (!token || !password) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }
  const locale = resolveMailLocale(typeof body.locale === 'string' ? body.locale : 'en')
  try {
    const user = await consumePasswordReset({ token, password })
    voidSystemMail(sendPasswordChangedEmail({ to: user.email, locale }))
    return NextResponse.json({ ok: true })
  } catch (err) {
    const code = err instanceof Error ? err.message : 'reset_failed'
    if (code === 'password_too_short') {
      return NextResponse.json({ error: code }, { status: 400 })
    }
    if (code === 'token_expired' || code === 'invalid_token') {
      return NextResponse.json({ error: code }, { status: 410 })
    }
    return NextResponse.json({ error: 'reset_failed' }, { status: 400 })
  }
}
