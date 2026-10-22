import { NextResponse } from 'next/server'
import { paths } from '../../../../lib/paths'
import { isAdminUser, requireAdminUser } from '../../../../lib/users/require-admin'
import {
  isZaolyUserStoreAvailable,
  listUsersPage,
  parseAppRole,
} from '../../../../lib/users/user-store'


function parseDisabled(raw: string | null): boolean | undefined {
  if (raw == null || raw === '') return undefined
  const v = raw.trim().toLowerCase()
  if (v === 'true' || v === '1' || v === 'yes') return true
  if (v === 'false' || v === '0' || v === 'no') return false
  return undefined
}

export async function GET(req: Request) {
  const admin = await requireAdminUser()
  if (!isAdminUser(admin)) return admin
  if (!isZaolyUserStoreAvailable()) {
    return NextResponse.json({ error: 'auth_not_configured' }, { status: 503 })
  }

  const url = new URL(req.url)
  const q = url.searchParams.get('q') ?? undefined
  const role = parseAppRole(url.searchParams.get('role')) ?? undefined
  const disabled = parseDisabled(url.searchParams.get('disabled'))
  const cursor = url.searchParams.get('cursor') ?? undefined
  const limitRaw = url.searchParams.get('limit')
  const limit =
    limitRaw != null && limitRaw !== ''
      ? Number.parseInt(limitRaw, 10) || paths.adminUsersPageSizeDefault
      : undefined

  const page = await listUsersPage({ q, role, disabled, cursor, limit })
  return NextResponse.json({
    users: page.users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      disabled: u.disabled,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      hasPassword: u.hasPassword,
      hasGoogle: u.hasGoogle,
      ownedSceneCount: u.ownedSceneCount,
    })),
    nextCursor: page.nextCursor,
  })
}
