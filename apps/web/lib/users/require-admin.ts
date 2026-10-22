import { NextResponse } from 'next/server'
import { auth } from '../../auth'
import { isAuthBypassEnabled } from '../runtime-config'
import { voidRecordAdminAudit } from './admin-audit'
import { forbidIfImpersonating, readImpersonation } from './impersonation'
import {
  getUserById,
  isPlatformAdminRole,
  isStaffRole,
  isZaolyUserStoreAvailable,
  type ZaolyUser,
} from './user-store'

function voidDenied(
  user: ZaolyUser,
  reason: 'forbidden' | 'platform_admin_required' | 'impersonating',
  gate: string,
): void {
  voidRecordAdminAudit({
    actorUserId: user.id,
    actorEmail: user.email,
    action: 'auth.denied',
    meta: { reason, gate },
  })
}

async function sessionUserId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id ?? null
}

/** Real staff actor — ignores impersonation overlay for admin gates. */
async function resolveRealActor(): Promise<ZaolyUser | null> {
  const imp = await readImpersonation()
  const sessionId = await sessionUserId()
  const realId = imp?.actorUserId ?? sessionId
  if (!realId) return null
  const user = await getUserById(realId)
  if (!user || user.disabled) return null
  return user
}

/** Effective product actor — target while impersonating. */
async function resolveEffectiveUser(): Promise<ZaolyUser | null> {
  const sessionId = await sessionUserId()
  if (!sessionId) return null
  const user = await getUserById(sessionId)
  if (!user || user.disabled) return null
  return user
}

export async function requireAdminUser(): Promise<
  { user: ZaolyUser } | NextResponse
> {
  if (isAuthBypassEnabled()) {
    return {
      user: {
        id: 'dev-local',
        email: 'dev-local@localhost',
        name: 'Dev Local',
        role: 'platform_admin',
        disabled: false,
        createdAt: new Date(0).toISOString(),
        lastLoginAt: null,
      },
    }
  }
  if (!isZaolyUserStoreAvailable()) {
    return NextResponse.json({ error: 'auth_not_configured' }, { status: 503 })
  }
  const user = await resolveRealActor()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (!isStaffRole(user.role)) {
    voidDenied(user, 'forbidden', 'admin')
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  return { user }
}

export async function requirePlatformAdminUser(): Promise<
  { user: ZaolyUser } | NextResponse
> {
  const admin = await requireAdminUser()
  if (!isAdminUser(admin)) return admin
  if (!isPlatformAdminRole(admin.user.role)) {
    voidDenied(admin.user, 'platform_admin_required', 'platform_admin')
    return NextResponse.json({ error: 'platform_admin_required' }, { status: 403 })
  }
  return admin
}

/** Staff admin for mutations that must not run during view-as. */
export async function requireAdminUserNotImpersonating(): Promise<
  { user: ZaolyUser } | NextResponse
> {
  const blocked = await forbidIfImpersonating()
  if (blocked) {
    const actor = await resolveRealActor()
    if (actor) voidDenied(actor, 'impersonating', 'mutation_lock')
    return blocked
  }
  return requireAdminUser()
}

export async function requirePlatformAdminUserNotImpersonating(): Promise<
  { user: ZaolyUser } | NextResponse
> {
  const blocked = await forbidIfImpersonating()
  if (blocked) {
    const actor = await resolveRealActor()
    if (actor) voidDenied(actor, 'impersonating', 'mutation_lock')
    return blocked
  }
  return requirePlatformAdminUser()
}

export function isAdminUser(
  value: { user: ZaolyUser } | NextResponse,
): value is { user: ZaolyUser } {
  return 'user' in value
}

/** Signed-in viewer (effective user). Auth bypass counts as elevated admin. */
export async function requireSessionUser(): Promise<
  { user: ZaolyUser } | NextResponse
> {
  if (isAuthBypassEnabled()) {
    return requireAdminUser()
  }
  if (!isZaolyUserStoreAvailable()) {
    return NextResponse.json({ error: 'auth_not_configured' }, { status: 503 })
  }
  const user = await resolveEffectiveUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  return { user }
}
