import { NextResponse } from 'next/server'
import { isAdminUser, requireAdminUser } from '../../../../../lib/users/require-admin'
import { isZaolyUserStoreAvailable } from '../../../../../lib/users/user-store'
import { sendSmtpTestEmail } from '../../../../../lib/mail/system-mail'
import { isValidSmtpEmail } from '../../../../../lib/mail/smtp-types'


export async function POST(req: Request) {
  const admin = await requireAdminUser()
  if (!isAdminUser(admin)) return admin
  if (!isZaolyUserStoreAvailable()) {
    return NextResponse.json({ error: 'auth_not_configured' }, { status: 503 })
  }
  let to = admin.user.email
  try {
    const body = (await req.json()) as { to?: string }
    if (typeof body.to === 'string' && body.to.trim()) {
      to = body.to.trim().toLowerCase()
    }
  } catch {
    // empty body ok — use session email
  }
  if (!isValidSmtpEmail(to)) {
    return NextResponse.json({ ok: false, error: 'invalid-email' }, { status: 400 })
  }
  const result = await sendSmtpTestEmail({ to })
  if (!result.ok) {
    const status = result.error === 'smtp_not_configured' ? 400 : 502
    return NextResponse.json({ ok: false, error: result.error }, { status })
  }
  return NextResponse.json({ ok: true })
}
