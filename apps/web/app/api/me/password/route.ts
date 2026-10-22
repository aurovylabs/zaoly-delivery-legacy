import { NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { sendPasswordChangedEmail, voidSystemMail } from '../../../../lib/mail/system-mail'
import { isAuthBypassEnabled } from '../../../../lib/runtime-config'
import { readImpersonation } from '../../../../lib/users/impersonation'
import {
  isZaolyUserStoreAvailable,
  setSessionPassword,
} from '../../../../lib/users/user-store'


/** Set or change password for the signed-in user · Spec `zaoly-user-management.md`. */
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
  const imp = await readImpersonation()
  if (imp) {
    return NextResponse.json({ error: 'impersonating' }, { status: 403 })
  }
  let body: { password?: unknown; currentPassword?: unknown }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  const password = typeof body.password === 'string' ? body.password : ''
  const currentPassword =
    typeof body.currentPassword === 'string' ? body.currentPassword : undefined
  try {
    const user = await setSessionPassword({
      userId: session.user.id,
      password,
      currentPassword,
    })
    voidSystemMail(sendPasswordChangedEmail({ to: user.email }))
    return NextResponse.json({ ok: true, hasPassword: true })
  } catch (err) {
    const code = err instanceof Error ? err.message : 'password_failed'
    if (code === 'password_too_short' || code === 'invalid_current_password') {
      return NextResponse.json({ error: code }, { status: 400 })
    }
    if (code === 'not_found') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'password_failed' }, { status: 500 })
  }
}
