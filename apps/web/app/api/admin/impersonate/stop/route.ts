import { NextResponse } from 'next/server'
import { voidRecordAdminAudit } from '../../../../../lib/users/admin-audit'
import {
  clearImpersonationCookie,
  readImpersonation,
} from '../../../../../lib/users/impersonation'
import {
  isAdminUser,
  requireAdminUser,
} from '../../../../../lib/users/require-admin'


export async function POST() {
  const admin = await requireAdminUser()
  if (!isAdminUser(admin)) return admin
  const imp = await readImpersonation()
  await clearImpersonationCookie()
  if (imp) {
    voidRecordAdminAudit({
      actorUserId: admin.user.id,
      actorEmail: admin.user.email,
      action: 'user.impersonate_stop',
      targetUserId: imp.targetUserId,
    })
  }
  return NextResponse.json({ ok: true })
}
