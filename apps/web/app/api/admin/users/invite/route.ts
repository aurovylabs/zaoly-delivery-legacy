import { NextResponse } from 'next/server'
import { sendInviteEmail } from '../../../../../lib/mail/system-mail'
import { paths } from '../../../../../lib/paths'
import {
  clientIpFromHeaders,
  rateLimitResponse,
  takeRateLimit,
} from '../../../../../lib/rate-limit'
import { voidRecordAdminAudit } from '../../../../../lib/users/admin-audit'
import {
  isAdminUser,
  requireAdminUserNotImpersonating,
} from '../../../../../lib/users/require-admin'
import { createInvite, type AppRole } from '../../../../../lib/users/user-store'


export async function POST(req: Request) {
  const limited = takeRateLimit(
    `invite:${clientIpFromHeaders(req.headers)}`,
    paths.rateLimitAuthInviteMax,
    paths.rateLimitAuthInviteWindowMs,
  )
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec)

  const admin = await requireAdminUserNotImpersonating()
  if (!isAdminUser(admin)) return admin
  let body: { email?: string; role?: string }
  try {
    body = (await req.json()) as { email?: string; role?: string }
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 })
  }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'invalid-email' }, { status: 400 })
  }
  const role: AppRole = body.role === 'admin' ? 'admin' : 'member'
  try {
    const invite = await createInvite({
      email,
      role,
      invitedBy: admin.user.id,
    })
    let emailSent = false
    let emailError: string | undefined
    const mailed = await sendInviteEmail({
      to: invite.email,
      inviteUrl: invite.inviteUrl,
      role: invite.role,
    })
    if (mailed.ok) {
      emailSent = true
    } else if (mailed.error !== 'smtp_not_configured') {
      emailError = mailed.error
    }
    voidRecordAdminAudit({
      actorUserId: admin.user.id,
      actorEmail: admin.user.email,
      action: 'user.invite',
      meta: { email: invite.email, role: invite.role, emailSent },
    })
    return NextResponse.json({
      inviteId: invite.inviteId,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
      inviteUrl: invite.inviteUrl,
      emailSent,
      ...(emailError ? { emailError } : {}),
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'invite_failed'
    if (msg === 'already_exists') {
      return NextResponse.json({ error: 'already_exists' }, { status: 409 })
    }
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
