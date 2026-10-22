import { NextResponse } from 'next/server'
import { paths } from '../../../../lib/paths'
import { voidRecordAdminAudit } from '../../../../lib/users/admin-audit'
import {
  isImpersonationEnabled,
  readImpersonation,
  writeImpersonationCookie,
} from '../../../../lib/users/impersonation'
import {
  isAdminUser,
  requirePlatformAdminUserNotImpersonating,
} from '../../../../lib/users/require-admin'
import {
  getUserById,
  isStaffRole,
  isZaolyUserStoreAvailable,
} from '../../../../lib/users/user-store'


export async function POST(req: Request) {
  const admin = await requirePlatformAdminUserNotImpersonating()
  if (!isAdminUser(admin)) return admin
  if (!isZaolyUserStoreAvailable()) {
    return NextResponse.json({ error: 'auth_not_configured' }, { status: 503 })
  }
  if (!isImpersonationEnabled()) {
    return NextResponse.json({ error: 'impersonation_disabled' }, { status: 403 })
  }
  if (await readImpersonation()) {
    return NextResponse.json({ error: 'already_impersonating' }, { status: 403 })
  }

  let body: { userId?: unknown; reason?: unknown }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 })
  }
  const userId = typeof body.userId === 'string' ? body.userId.trim() : ''
  const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
  if (!userId) {
    return NextResponse.json({ error: 'user_id_required' }, { status: 400 })
  }
  if (reason.length < paths.impersonationReasonMinLength) {
    return NextResponse.json({ error: 'reason_required' }, { status: 400 })
  }
  if (userId === admin.user.id) {
    return NextResponse.json({ error: 'cannot_impersonate_self' }, { status: 400 })
  }
  const target = await getUserById(userId)
  if (!target) return NextResponse.json({ error: 'not-found' }, { status: 404 })
  if (target.disabled) {
    return NextResponse.json({ error: 'user_disabled' }, { status: 400 })
  }
  if (isStaffRole(target.role)) {
    return NextResponse.json({ error: 'cannot_impersonate_staff' }, { status: 400 })
  }

  const expiresAt = new Date(Date.now() + paths.impersonationTtlSeconds * 1000)
  await writeImpersonationCookie({
    targetUserId: target.id,
    actorUserId: admin.user.id,
    exp: Math.floor(expiresAt.getTime() / 1000),
    reason,
  })

  voidRecordAdminAudit({
    actorUserId: admin.user.id,
    actorEmail: admin.user.email,
    action: 'user.impersonate_start',
    targetUserId: target.id,
    meta: { targetEmail: target.email, reason },
  })

  return NextResponse.json({
    ok: true,
    targetUserId: target.id,
    expiresAt: expiresAt.toISOString(),
  })
}
