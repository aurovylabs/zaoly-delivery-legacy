import { NextResponse } from 'next/server'
import { catalogToPackLeaves, mergeTokenPack } from '../../../../lib/tokens/pack-merge'
import {
  diffTokenPackImport,
  leavesForImportApply,
  parseDtcgTokenPack,
} from '../../../../lib/tokens/pack-import'
import {
  listTokenOverrides,
  upsertTokenOverridesBatch,
} from '../../../../lib/tokens/token-pack-store'
import { paths } from '../../../../lib/paths'
import { isAdminUser, requireAdminUser } from '../../../../lib/users/require-admin'


function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).length
}

export async function POST(request: Request) {
  const access = await requireAdminUser()
  if (!isAdminUser(access)) return access

  let body: { json?: unknown; dryRun?: unknown }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const json = typeof body.json === 'string' ? body.json : null
  if (json == null) {
    return NextResponse.json({ error: 'fields_required' }, { status: 400 })
  }
  if (utf8ByteLength(json) > paths.tokenPackMaxImportBytes) {
    return NextResponse.json({ error: 'import_too_large' }, { status: 400 })
  }

  const dryRun = body.dryRun !== false
  const parsed = parseDtcgTokenPack(json)
  if (parsed.invalid.some((row) => row.path === '' && row.error === 'invalid_json')) {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const overrides = await listTokenOverrides()
  const merged = mergeTokenPack(catalogToPackLeaves(), overrides)
  const diff = diffTokenPackImport(parsed.leaves, merged.tokens, parsed.invalid)

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      diff,
      applied: 0,
    })
  }

  const toApply = leavesForImportApply(parsed.leaves, diff).map((leaf) => ({
    ...leaf,
    status: 'active' as const,
  }))
  await upsertTokenOverridesBatch(toApply)

  return NextResponse.json({
    ok: true,
    dryRun: false,
    diff,
    applied: toApply.length,
  })
}
