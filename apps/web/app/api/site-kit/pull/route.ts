import { NextResponse } from 'next/server'
import type { SceneMaster, SceneNode } from '@zaoly/contracts'
import { applySiteKitPull } from '../../../../lib/site-kit/pull'


/** Spec site-kit-kit-pull.md — Pull (schema) or Reset Masters. */
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const rec = body as {
    mode?: string
    masters?: SceneMaster[]
    sceneRoot?: SceneNode
    platformProjectId?: string | null
  }
  const mode = rec.mode === 'reset' ? 'reset' : 'pull'
  if (!Array.isArray(rec.masters) || !rec.masters.length) {
    return NextResponse.json(
      { ok: false, error: 'masters required', code: 'empty' },
      { status: 400 },
    )
  }

  const result = await applySiteKitPull({
    mode,
    masters: rec.masters,
    ...(rec.sceneRoot ? { sceneRoot: rec.sceneRoot } : {}),
    platformProjectId:
      typeof rec.platformProjectId === 'string' ? rec.platformProjectId : null,
  })

  if (!result.ok) {
    const status = result.code === 'empty' ? 400 : 500
    return NextResponse.json(result, { status })
  }
  return NextResponse.json(result)
}
