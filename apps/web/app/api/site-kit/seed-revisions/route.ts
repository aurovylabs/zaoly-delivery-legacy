import { NextResponse } from 'next/server'
import { resolveSiteKitSeedRevision } from '../../../../lib/site-kit/seed'


const MAX_IDS = 40

/** Spec site-kit-kit-pull.md — batch kitRevision for Kit drift banner. */
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON', code: 'invalid-json' },
      { status: 400 },
    )
  }
  const raw = (body as { componentIds?: unknown })?.componentIds
  if (!Array.isArray(raw)) {
    return NextResponse.json(
      { ok: false, error: 'componentIds required', code: 'missing-ids' },
      { status: 400 },
    )
  }
  const ids = [
    ...new Set(
      raw
        .filter((v): v is string => typeof v === 'string')
        .map((v) => v.trim())
        .filter(Boolean),
    ),
  ].slice(0, MAX_IDS)

  const revisions: { componentId: string; kitRevision: string }[] = []
  for (const id of ids) {
    const result = await resolveSiteKitSeedRevision(id)
    if ('ok' in result && result.ok === false) continue
    if ('kitRevision' in result) {
      // Keep the *requested* id so Collection forks map back to Masters.
      revisions.push({
        componentId: id,
        kitRevision: result.kitRevision,
      })
    }
  }

  return NextResponse.json({ ok: true, revisions })
}
