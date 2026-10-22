import { NextResponse } from 'next/server'
import { resolveMailLocale } from '../../../../../../lib/mail/mail-locale'
import { sendPasswordResetEmail } from '../../../../../../lib/mail/system-mail'
import { voidRecordAdminAudit } from '../../../../../../lib/users/admin-audit'
import {
  isAdminUser,
  requireAdminUserNotImpersonating,
} from '../../../../../../lib/users/require-admin'
import {
  createPasswordReset,
  getUserById,
  isZaolyUserStoreAvailable,
} from '../../../../../../lib/users/user-store'


export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdminUserNotImpersonating()
  if (!isAdminUser(admin)) return admin
  if (!isZaolyUserStoreAvailable()) {
    return NextResponse.json({ error: 'auth_not_configured' }, { status: 503 })
  }
  const { id } = await ctx.params
  const target = await getUserById(id)
  if (!target) return NextResponse.json({ error: 'not-found' }, { status: 404 })
  if (target.disabled) {
    return NextResponse.json({ error: 'user_disabled' }, { status: 400 })
  }

  let localeRaw: string | undefined
  try {
    const body = (await req.json()) as { locale?: unknown }
    if (typeof body.locale === 'string') localeRaw = body.locale
  } catch {
    /* empty body ok */
  }
  const locale = resolveMailLocale(localeRaw ?? 'en')

  const reset = await createPasswordReset({ email: target.email })
  if (!reset) {
    return NextResponse.json({ error: 'reset_failed' }, { status: 400 })
  }

  let emailSent = false
  let emailError: string | undefined
  const mailed = await sendPasswordResetEmail({
    to: reset.email,
    resetUrl: reset.resetUrl,
    locale,
  })
  if (mailed.ok) {
    emailSent = true
  } else if (mailed.error !== 'smtp_not_configured') {
    emailError = mailed.error
  }

  voidRecordAdminAudit({
    actorUserId: admin.user.id,
    actorEmail: admin.user.email,
    action: 'user.force_password_reset',
    targetUserId: target.id,
    meta: { emailSent },
  })

  return NextResponse.json({
    ok: true,
    emailSent,
    ...(emailError ? { emailError } : {}),
    expiresAt: reset.expiresAt,
  })
}
