import { NextResponse } from 'next/server'
import { auth } from '../../../auth'
import { isAuthBypassEnabled } from '../../../lib/runtime-config'
import { readImpersonation } from '../../../lib/users/impersonation'
import {
  getUserAccountFlags,
  getUserById,
  isZaolyUserStoreAvailable,
  updateUserName,
} from '../../../lib/users/user-store'


export async function GET() {
  if (isAuthBypassEnabled()) {
    return NextResponse.json({
      id: 'dev-local',
      email: 'dev-local@localhost',
      name: 'Dev Local',
      role: 'platform_admin',
      hasPassword: true,
      emailVerified: true,
    })
  }
  if (!isZaolyUserStoreAvailable()) {
    return NextResponse.json({ error: 'auth_not_configured' }, { status: 503 })
  }
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const user = await getUserById(session.user.id)
  if (!user || user.disabled) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const flags = (await getUserAccountFlags(user.id)) ?? {
    hasPassword: false,
    emailVerified: false,
  }
  const imp = await readImpersonation()
  const actor =
    imp && imp.actorUserId !== user.id ? await getUserById(imp.actorUserId) : null
  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    hasPassword: flags.hasPassword,
    emailVerified: flags.emailVerified,
    ...(imp && actor
      ? {
          impersonating: true,
          impersonatorId: actor.id,
          realRole: actor.role,
        }
      : {}),
  })
}

export async function PATCH(req: Request) {
  if (isAuthBypassEnabled()) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  if (!isZaolyUserStoreAvailable()) {
    return NextResponse.json({ error: 'auth_not_configured' }, { status: 503 })
  }
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  // Don't allow name edits while impersonating — change the real account from Settings after stop.
  const imp = await readImpersonation()
  if (imp) {
    return NextResponse.json({ error: 'impersonating' }, { status: 403 })
  }
  let body: { name?: string }
  try {
    body = (await req.json()) as { name?: string }
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 })
  }
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name || name.length > 80) {
    return NextResponse.json({ error: 'invalid-name' }, { status: 400 })
  }
  const user = await updateUserName(session.user.id, name)
  if (!user) return NextResponse.json({ error: 'not-found' }, { status: 404 })
  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
}
