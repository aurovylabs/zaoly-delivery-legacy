import { NextResponse } from 'next/server'
import { isStudioEditableType, isValidStudioTokenPath } from '../../../lib/inspect/digital-edit'
import { catalogToPackLeaves, mergeTokenPack } from '../../../lib/tokens/pack-merge'
import {
  buildResolveCssFromLeaves,
  validateStudioLeafWrite,
} from '../../../lib/tokens/pack-validate'
import {
  deleteTokenOverride,
  listTokenOverrides,
  loadMergedLocalPack,
  renameTokenOverride,
  upsertTokenOverride,
} from '../../../lib/tokens/token-pack-store'
import { paths } from '../../../lib/paths'
import {
  isAdminUser,
  requireAdminUser,
  requireSessionUser,
} from '../../../lib/users/require-admin'


export async function GET() {
  const access = await requireSessionUser()
  if (!('user' in access)) return access

  const merged = await loadMergedLocalPack()
  return NextResponse.json({
    source: 'local',
    tokens: merged.tokens,
    origins: merged.origins,
    canWrite: access.user.role === 'admin' || access.user.role === 'platform_admin',
  })
}

export async function PATCH(request: Request) {
  const access = await requireAdminUser()
  if (!isAdminUser(access)) return access

  let body: { path?: unknown; type?: unknown; value?: unknown; fromPath?: unknown }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const tokenPath = typeof body.path === 'string' ? body.path.trim() : ''
  const fromPath = typeof body.fromPath === 'string' ? body.fromPath.trim() : ''
  const type = typeof body.type === 'string' ? body.type.trim() : ''
  const value = typeof body.value === 'string' ? body.value : null
  if (!tokenPath || !type || value == null) {
    return NextResponse.json({ error: 'fields_required' }, { status: 400 })
  }
  if (!isStudioEditableType(type)) {
    return NextResponse.json({ error: 'invalid_type' }, { status: 400 })
  }
  if (!isValidStudioTokenPath(tokenPath, type)) {
    return NextResponse.json({ error: 'invalid_path' }, { status: 400 })
  }
  if (fromPath && !/^[a-z][a-z0-9]*(\.[a-zA-Z0-9_-]+)+$/.test(fromPath)) {
    return NextResponse.json({ error: 'invalid_path' }, { status: 400 })
  }

  const overrides = await listTokenOverrides()
  const merged = mergeTokenPack(catalogToPackLeaves(), overrides)
  const resolveCss = buildResolveCssFromLeaves(merged.tokens)
  const validated = validateStudioLeafWrite({
    path: tokenPath,
    type,
    value,
    resolveCss,
    maxValueBytes: paths.tokenPackMaxValueBytes,
  })
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 })
  }

  const leaf = {
    path: tokenPath,
    type,
    value,
    status: 'active' as const,
  }

  if (fromPath && fromPath !== tokenPath) {
    const taken = merged.tokens.some((row) => row.path === tokenPath)
    if (taken) {
      return NextResponse.json({ error: 'path_exists' }, { status: 409 })
    }
    const renamed = await renameTokenOverride({ fromPath, leaf })
    return NextResponse.json({
      ok: true,
      token: renamed.token,
      renamedFrom: fromPath,
      rewritten: renamed.rewritten,
    })
  }

  const token = await upsertTokenOverride(leaf)
  return NextResponse.json({ ok: true, token })
}

export async function DELETE(request: Request) {
  const access = await requireAdminUser()
  if (!isAdminUser(access)) return access

  const url = new URL(request.url)
  const tokenPath = url.searchParams.get(paths.tokenPackPathQueryKey)?.trim() ?? ''
  if (!tokenPath) {
    return NextResponse.json({ error: 'fields_required' }, { status: 400 })
  }
  await deleteTokenOverride(tokenPath)
  return NextResponse.json({ ok: true, path: tokenPath })
}
