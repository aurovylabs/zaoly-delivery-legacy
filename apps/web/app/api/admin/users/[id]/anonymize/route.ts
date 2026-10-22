import { NextResponse } from 'next/server'
import { voidRecordAdminAudit } from '../../../../../../lib/users/admin-audit'
import {
  isAdminUser,
  requirePlatformAdminUserNotImpersonating,
} from '../../../../../../lib/users/require-admin'
import {
  anonymizeUser,
  isZaolyUserStoreAvailable,
} from '../../../../../../lib/users/user-store'


export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const admin = await requirePlatformAdminUserNotImpersonating()
  if (!isAdminUser(admin)) return admin
  if (!isZaolyUserStoreAvailable()) {
    return NextResponse.json({ error: 'auth_not_configured' }, { status: 503 })
  }
  const { id } = await ctx.params
  try {
    const user = await anonymizeUser(id, admin.user.id)
    voidRecordAdminAudit({
      actorUserId: admin.user.id,
      actorEmail: admin.user.email,
      action: 'user.anonymize',
      targetUserId: user.id,
      meta: { email: user.email },
    })
    return NextResponse.json({
      ok: true,
      id: user.id,
      email: user.email,
      disabled: user.disabled,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'anonymize_failed'
    if (msg === 'not_found') {
      return NextResponse.json({ error: 'not-found' }, { status: 404 })
    }
    if (msg === 'last_admin' || msg === 'cannot_anonymize_self') {
      return NextResponse.json({ error: msg }, { status: 400 })
    }
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
