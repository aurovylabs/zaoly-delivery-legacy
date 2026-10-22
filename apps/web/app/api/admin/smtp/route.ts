import { NextResponse } from 'next/server'
import {
  isAdminUser,
  requireAdminUser,
  requireAdminUserNotImpersonating,
} from '../../../../lib/users/require-admin'
import { isZaolyUserStoreAvailable } from '../../../../lib/users/user-store'
import { getSmtpStatus } from '../../../../lib/mail/system-mail'
import { saveSmtpDbSettings } from '../../../../lib/mail/smtp-store'
import {
  isSmtpManagedByHost,
  resolveSmtpConfig,
  toSmtpPublicStatus,
} from '../../../../lib/mail/smtp-config'
import { isSmtpTlsMode, isValidSmtpEmail } from '../../../../lib/mail/smtp-types'


export async function GET() {
  const admin = await requireAdminUser()
  if (!isAdminUser(admin)) return admin
  if (!isZaolyUserStoreAvailable()) {
    return NextResponse.json({ error: 'auth_not_configured' }, { status: 503 })
  }
  return NextResponse.json(await getSmtpStatus())
}

export async function PUT(req: Request) {
  const admin = await requireAdminUserNotImpersonating()
  if (!isAdminUser(admin)) return admin
  if (!isZaolyUserStoreAvailable()) {
    return NextResponse.json({ error: 'auth_not_configured' }, { status: 503 })
  }
  if (isSmtpManagedByHost()) {
    return NextResponse.json({ error: 'smtp_managed_by_host' }, { status: 403 })
  }
  let body: {
    enabled?: boolean
    host?: string
    port?: number
    user?: string
    pass?: string | null
    from?: string
    fromName?: string
    tls?: string
  }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 })
  }
  if (typeof body.enabled !== 'boolean') {
    return NextResponse.json({ error: 'enabled_required' }, { status: 400 })
  }
  if (body.enabled) {
    const host = typeof body.host === 'string' ? body.host.trim() : ''
    const from = typeof body.from === 'string' ? body.from.trim() : ''
    if (!host) return NextResponse.json({ error: 'smtp_host_required' }, { status: 400 })
    if (!isValidSmtpEmail(from)) {
      return NextResponse.json({ error: 'smtp_from_invalid' }, { status: 400 })
    }
  }
  if (body.tls != null && !isSmtpTlsMode(body.tls)) {
    return NextResponse.json({ error: 'smtp_tls_invalid' }, { status: 400 })
  }
  try {
    const saved = await saveSmtpDbSettings({
      enabled: body.enabled,
      host: typeof body.host === 'string' ? body.host : undefined,
      port: typeof body.port === 'number' ? body.port : undefined,
      user: typeof body.user === 'string' ? body.user : undefined,
      pass: body.pass === undefined ? undefined : body.pass,
      from: typeof body.from === 'string' ? body.from : undefined,
      fromName: typeof body.fromName === 'string' ? body.fromName : undefined,
      tls: body.tls && isSmtpTlsMode(body.tls) ? body.tls : undefined,
      updatedBy: admin.user.id,
    })
    const status = toSmtpPublicStatus(saved, resolveSmtpConfig(saved))
    return NextResponse.json({ ok: true, ...status })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'smtp_save_failed'
    if (msg === 'auth_not_configured') {
      return NextResponse.json({ error: msg }, { status: 503 })
    }
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
