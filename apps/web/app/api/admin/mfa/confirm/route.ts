import { NextResponse } from 'next/server'
import { voidRecordAdminAudit } from '../../../../../lib/users/admin-audit'
import { confirmMfaSetup } from '../../../../../lib/users/mfa-store'
import {
  isAdminUser,
  requirePlatformAdminUserNotImpersonating,
} from '../../../../../lib/users/require-admin'


export async function POST(req: Request) {
  const admin = await requirePlatformAdminUserNotImpersonating()
  if (!isAdminUser(admin)) return admin
  let body: { code?: unknown }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 })
  }
  const code = typeof body.code === 'string' ? body.code.trim() : ''
  if (!code) return NextResponse.json({ error: 'code_required' }, { status: 400 })
  try {
    const { recoveryCodes } = await confirmMfaSetup(admin.user.id, code)
    voidRecordAdminAudit({
      actorUserId: admin.user.id,
      actorEmail: admin.user.email,
      action: 'user.mfa_enable',
      targetUserId: admin.user.id,
    })
    return NextResponse.json({ ok: true, recoveryCodes })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'mfa_confirm_failed'
    const status = msg === 'mfa_invalid_code' ? 400 : 400
    return NextResponse.json({ error: msg }, { status })
  }
}
