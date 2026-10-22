import { NextResponse } from 'next/server'
import { sendWelcomeEmail, voidSystemMail } from '../../../../lib/mail/system-mail'
import { voidEnsureStarterLandingForUser } from '../../../../lib/scene/user-starter-scene'
import {
  acceptInvite,
  isZaolyUserStoreAvailable,
} from '../../../../lib/users/user-store'


export async function POST(req: Request) {
  if (!isZaolyUserStoreAvailable()) {
    return NextResponse.json({ error: 'auth_not_configured' }, { status: 503 })
  }
  let body: { token?: string; password?: string; name?: string }
  try {
    body = (await req.json()) as { token?: string; password?: string; name?: string }
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 })
  }
  const token = typeof body.token === 'string' ? body.token.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (!token || !password) {
    return NextResponse.json({ error: 'invalid-body' }, { status: 400 })
  }
  try {
    const user = await acceptInvite({
      token,
      password,
      name: typeof body.name === 'string' ? body.name : undefined,
    })
    voidEnsureStarterLandingForUser(user.id)
    voidSystemMail(sendWelcomeEmail({ to: user.email, name: user.name }))
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'accept_failed'
    if (msg === 'invite_expired') {
      return NextResponse.json({ error: 'invite_expired' }, { status: 410 })
    }
    if (msg === 'invite_used') {
      return NextResponse.json({ error: 'invite_used' }, { status: 410 })
    }
    if (msg === 'already_exists') {
      return NextResponse.json({ error: 'already_exists' }, { status: 409 })
    }
    if (msg === 'password_too_short') {
      return NextResponse.json({ error: 'password_too_short' }, { status: 400 })
    }
    if (msg === 'invite_not_found') {
      return NextResponse.json({ error: 'not-found' }, { status: 404 })
    }
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
