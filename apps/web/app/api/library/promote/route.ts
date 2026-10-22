import { NextResponse } from 'next/server'
import { applyLibraryPromote } from '../../../../lib/library/promote'
import { requireApiSession } from '../../../../lib/require-api-session'


/** Spec `specs/api/library-promote.md` — opens or updates a PR; never pushes main. */
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
  const result = await applyLibraryPromote(input)
  if (!result.ok) {
    const code = result.issues[0]?.code
    const status = code === 'github-unconfigured' || code === 'github-failed' ? 503 : 400
    return NextResponse.json(result, { status })
  }
  return NextResponse.json(result)
}
