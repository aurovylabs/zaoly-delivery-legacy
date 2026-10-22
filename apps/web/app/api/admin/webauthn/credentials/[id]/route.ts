import { NextResponse } from 'next/server'
import { voidRecordAdminAudit } from '../../../../../../lib/users/admin-audit'
import { deleteWebAuthnCredential } from '../../../../../../lib/users/webauthn-store'
import {
  isAdminUser,
  requirePlatformAdminUserNotImpersonating,
} from '../../../../../../lib/users/require-admin'


export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const admin = await requirePlatformAdminUserNotImpersonating()
  if (!isAdminUser(admin)) return admin
  const { id } = await ctx.params
  const ok = await deleteWebAuthnCredential(admin.user.id, id)
  if (!ok) return NextResponse.json({ error: 'not-found' }, { status: 404 })
  voidRecordAdminAudit({
    actorUserId: admin.user.id,
    actorEmail: admin.user.email,
    action: 'user.webauthn_delete',
    targetUserId: admin.user.id,
    meta: { id },
  })
  return NextResponse.json({ ok: true })
}
