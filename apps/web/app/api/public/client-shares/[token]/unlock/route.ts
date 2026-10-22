/**
 * POST /api/public/client-shares/:token/unlock
 * Password or email-allowlist unlock.
 */
import { NextResponse } from 'next/server'
import { emailOnAllowlist } from '../../../../../../lib/client-page-share/email'
import { emitClientShareAuditEvent } from '../../../../../../lib/client-page-share/events'
import { verifyClientSharePassword } from '../../../../../../lib/client-page-share/password'
import {
  getClientPageShareByToken,
  isClientShareActive,
} from '../../../../../../lib/client-page-share/store'
import { isClientPageShareTokenShape } from '../../../../../../lib/client-page-share/token'
import {
  clientShareUnlockCookieOptions,
  mintClientShareUnlockToken,
} from '../../../../../../lib/client-page-share/unlock'
import { isClientPageShareEnabled } from '../../../../../../lib/runtime-config'

function unlockFailed(
  record: { id: string; platformProjectId: string; accessMode: string },
  reason: string,
) {
  emitClientShareAuditEvent({
    platformProjectId: record.platformProjectId,
    shareId: record.id,
    eventType: 'client_share.unlock_failed',
    meta: { reason, accessMode: record.accessMode },
  })
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  if (!isClientPageShareEnabled()) {
    return NextResponse.json({ error: 'not-found' }, { status: 404 })
  }

  const { token: raw } = await ctx.params
  const token = decodeURIComponent(raw)
  if (!isClientPageShareTokenShape(token)) {
    return NextResponse.json({ error: 'not-found' }, { status: 404 })
  }

  const record = await getClientPageShareByToken(token)
  if (!record || !isClientShareActive(record)) {
    return NextResponse.json({ error: 'not-found' }, { status: 404 })
  }

  if (record.accessMode === 'link') {
    return NextResponse.json({ ok: true, accessMode: record.accessMode })
  }

  const body = (await req.json().catch(() => ({}))) as {
    password?: unknown
    email?: unknown
    sso?: unknown
  }

  if (body.sso === true) {
    const { trySsoClientShareAccess } = await import(
      '../../../../../../lib/client-page-share/gate'
    )
    if (!(await trySsoClientShareAccess(record))) {
      unlockFailed(record, 'sso_denied')
      return NextResponse.json({ error: 'sso_denied' }, { status: 401 })
    }
  } else if (record.accessMode === 'password') {
    if (!record.passwordHash) {
      return NextResponse.json({ error: 'not-found' }, { status: 404 })
    }
    const password = typeof body.password === 'string' ? body.password : ''
    const ok = await verifyClientSharePassword(password, record.passwordHash)
    if (!ok) {
      unlockFailed(record, 'invalid_password')
      return NextResponse.json({ error: 'invalid_password' }, { status: 401 })
    }
  } else if (record.accessMode === 'email_allowlist') {
    const email = typeof body.email === 'string' ? body.email : ''
    if (!emailOnAllowlist(email, record.emailAllowlist)) {
      unlockFailed(record, 'email_not_allowed')
      return NextResponse.json({ error: 'email_not_allowed' }, { status: 401 })
    }
  } else {
    return NextResponse.json({ error: 'not-found' }, { status: 404 })
  }

  const unlock = mintClientShareUnlockToken(record.id)
  const cookie = clientShareUnlockCookieOptions()
  const res = NextResponse.json({ ok: true, accessMode: record.accessMode })
  res.cookies.set(cookie.name, unlock, cookie)
  return res
}
