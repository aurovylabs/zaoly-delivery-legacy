import { NextResponse } from 'next/server'
import { paths } from '../../../../lib/paths'
import { listAdminAudit } from '../../../../lib/users/admin-audit'
import { isAdminUser, requireAdminUser } from '../../../../lib/users/require-admin'
import { isZaolyUserStoreAvailable } from '../../../../lib/users/user-store'


export async function GET(req: Request) {
  const admin = await requireAdminUser()
  if (!isAdminUser(admin)) return admin
  if (!isZaolyUserStoreAvailable()) {
    return NextResponse.json({ error: 'auth_not_configured' }, { status: 503 })
  }
  const url = new URL(req.url)
  const cursor = url.searchParams.get('cursor') ?? undefined
  const limitRaw = url.searchParams.get('limit')
  const limit =
    limitRaw != null && limitRaw !== ''
      ? Number.parseInt(limitRaw, 10) || paths.adminAuditPageSizeDefault
      : paths.adminAuditPageSizeDefault

  const page = await listAdminAudit({ limit, cursor })
  return NextResponse.json({
    events: page.events,
    nextCursor: page.nextCursor,
  })
}
