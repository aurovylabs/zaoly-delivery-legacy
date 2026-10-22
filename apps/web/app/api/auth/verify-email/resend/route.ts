import { NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { resolveMailLocale } from '../../../../../lib/mail/mail-locale'
import { sendEmailVerifyEmail, voidSystemMail } from '../../../../../lib/mail/system-mail'
import { isAuthBypassEnabled } from '../../../../../lib/runtime-config'
import { readImpersonation } from '../../../../../lib/users/impersonation'
import {
  createEmailVerification,
  getUserAccountFlags,
  isZaolyUserStoreAvailable,
} from '../../../../../lib/users/user-store'


/** Resend soft email-verify · Spec `zaoly-user-management.md`. */
export async function POST(req: Request) {
  if (isAuthBypassEnabled()) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  if (!isZaolyUserStoreAvailable()) {
    return NextResponse.json({ error: 'auth_not_configured' }, { status: 503 })
  }
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const imp = await readImpersonation()
  if (imp) {
    return NextResponse.json({ error: 'impersonating' }, { status: 403 })
  }
  const flags = await getUserAccountFlags(session.user.id)
  if (!flags) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (flags.emailVerified) {
    return NextResponse.json({ ok: true, emailSent: false, already_verified: true })
  }
  let locale: string | undefined
  try {
    const body = (await req.json()) as { locale?: unknown }
    if (typeof body.locale === 'string') locale = body.locale
  } catch {
    // empty body ok
  }
  const minted = await createEmailVerification({ userId: session.user.id })
  if (!minted) {
    return NextResponse.json({ ok: true, emailSent: false, already_verified: true })
  }
  const result = await sendEmailVerifyEmail({
    to: minted.email,
    verifyUrl: minted.verifyUrl,
    locale: resolveMailLocale(locale),
  })
  if (!result.ok) {
    voidSystemMail(Promise.resolve(result))
    return NextResponse.json({ ok: true, emailSent: false })
  }
  return NextResponse.json({ ok: true, emailSent: true })
}
