import { NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { requireApiSession } from '../../../../lib/require-api-session'
import { isAuthBypassEnabled, isServiceAuthConfigured } from '../../../../lib/runtime-config'
import { viewerMayAccessCollection } from '../../../../lib/site-kit/site-kit-read-auth'
import { mintSiteKitViewToken } from '../../../../lib/site-kit/storybook-view-token'


/**
 * Mint Collection-scoped Storybook Live credential (SK-S1).
 * Spec: specs/api/site-kit-write.md · site-kit-collection-scope.md
 */
export async function POST(request: Request) {
  const denied = await requireApiSession()
  if (denied) return denied

  let userId: string | null = null
  if (!isServiceAuthConfigured() && isAuthBypassEnabled()) {
    userId = 'dev-local'
  } else {
    const session = await auth()
    userId = session?.user?.id?.trim() || null
  }
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const platformProjectId =
    typeof (body as { platformProjectId?: unknown })?.platformProjectId === 'string'
      ? (body as { platformProjectId: string }).platformProjectId.trim()
      : ''
  if (!platformProjectId) {
    return NextResponse.json(
      { ok: false, error: 'platformProjectId required', code: 'missing-platform-project-id' },
      { status: 400 },
    )
  }

  const allowed = await viewerMayAccessCollection(userId, platformProjectId)
  if (!allowed) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  try {
    const minted = mintSiteKitViewToken({
      platformProjectId,
      userId,
    })
    return NextResponse.json({
      ok: true,
      viewToken: minted.viewToken,
      expiresAt: minted.expiresAt,
      platformProjectId: minted.claims.platformProjectId,
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'mint-failed' }, { status: 500 })
  }
}
