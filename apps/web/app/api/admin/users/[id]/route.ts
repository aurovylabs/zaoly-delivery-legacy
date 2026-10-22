import { NextResponse } from 'next/server'
import {
  sendAccountDisabledEmail,
  sendAccountEnabledEmail,
  sendRoleChangedEmail,
  voidSystemMail,
} from '../../../../../lib/mail/system-mail'
import { voidRecordAdminAudit } from '../../../../../lib/users/admin-audit'
import {
  isAdminUser,
  requireAdminUserNotImpersonating,
} from '../../../../../lib/users/require-admin'
import {
  getUserById,
  patchAdminUser,
  parseAppRole,
  type AppRole,
} from '../../../../../lib/users/user-store'


export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdminUserNotImpersonating()
  if (!isAdminUser(admin)) return admin
  const { id } = await ctx.params
  let body: { disabled?: boolean; role?: string }
  try {
    body = (await req.json()) as { disabled?: boolean; role?: string }
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 })
  }
  if (id === admin.user.id && body.disabled === true) {
    return NextResponse.json({ error: 'cannot_disable_self' }, { status: 400 })
  }
  const patch: { disabled?: boolean; role?: AppRole } = {}
  if (typeof body.disabled === 'boolean') patch.disabled = body.disabled
  const nextRole = parseAppRole(typeof body.role === 'string' ? body.role : null)
  if (nextRole) patch.role = nextRole
  if (patch.disabled === undefined && patch.role === undefined) {
    return NextResponse.json({ error: 'empty_patch' }, { status: 400 })
  }
  try {
    const before = await getUserById(id)
    const user = await patchAdminUser(id, patch)
    if (!user) return NextResponse.json({ error: 'not-found' }, { status: 404 })
    if (before && patch.disabled === true && !before.disabled && user.disabled) {
      voidSystemMail(sendAccountDisabledEmail({ to: user.email }))
    } else if (before && patch.disabled === false && before.disabled && !user.disabled) {
      voidSystemMail(sendAccountEnabledEmail({ to: user.email }))
    }
    if (before && patch.role && before.role !== user.role) {
      voidSystemMail(sendRoleChangedEmail({ to: user.email, role: user.role }))
    }
    voidRecordAdminAudit({
      actorUserId: admin.user.id,
      actorEmail: admin.user.email,
      action: 'user.patch',
      targetUserId: user.id,
      meta: {
        before: before
          ? { role: before.role, disabled: before.disabled }
          : null,
        after: { role: user.role, disabled: user.disabled },
      },
    })
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      disabled: user.disabled,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    })
  } catch (e) {
    if (e instanceof Error && e.message === 'last_admin') {
      return NextResponse.json({ error: 'last_admin' }, { status: 400 })
    }
    return NextResponse.json({ error: 'patch_failed' }, { status: 400 })
  }
}
