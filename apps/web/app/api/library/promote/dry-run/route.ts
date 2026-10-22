import { NextResponse } from 'next/server'
import { dryRunLibraryPromote } from '../../../../../lib/library/promote-dry-run'
import { requireApiSession } from '../../../../../lib/require-api-session'


/** Spec `specs/api/library-promote.md` — never writes git. */
export async function POST(req: Request) {
  const denied = await requireApiSession()
  if (denied) return denied
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON', issues: [{ code: 'invalid-kind', message: 'Invalid JSON' }] },
      { status: 400 },
    )
  }
  const input = (body ?? {}) as {
    kind?: unknown
    scene?: unknown
    nodeId?: unknown
    zaolyUiSource?: unknown
  }
  const result = dryRunLibraryPromote(input)
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 })
  }
  return NextResponse.json(result)
}
