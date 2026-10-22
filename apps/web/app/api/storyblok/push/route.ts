/**
 * POST /api/storyblok/push — upsert Storyblok components + story from a handoff pack.
 * Spec: specs/api/storyblok-push.md · specs/domain/storyblok-handoff.md
 */
import { NextResponse } from 'next/server'
import { resolveStoryblokPushConfig } from '../../../../lib/codegen/storyblok-config'
import type { StoryblokHandoffPack } from '../../../../lib/codegen/storyblok-handoff'
import { pushStoryblokHandoffPack } from '../../../../lib/codegen/storyblok-push'
import {
  isSceneApiAccess,
  requireSceneApiAccess,
} from '../../../../lib/require-scene-api-access'


/**
 * Whether Storyblok handoff is available (no secrets leaked).
 * Public probe — Export needs this without a session race; POST stays auth-gated.
 */
export async function GET() {
  const resolved = resolveStoryblokPushConfig()
  return NextResponse.json({ configured: resolved.ok })
}

function isPack(value: unknown): value is StoryblokHandoffPack & {
  stories?: StoryblokHandoffPack['story'][]
} {
  if (!value || typeof value !== 'object') return false
  const rec = value as Record<string, unknown>
  const story = rec.story
  const components = rec.components
  if (!story || typeof story !== 'object') return false
  if (!Array.isArray(components) || components.length === 0) return false
  const s = story as Record<string, unknown>
  if (typeof s.name !== 'string' || typeof s.slug !== 'string') return false
  if (!s.content || typeof s.content !== 'object') return false
  return true
}

export async function POST(request: Request) {
  const access = await requireSceneApiAccess(request)
  if (!isSceneApiAccess(access)) return access

  const resolved = resolveStoryblokPushConfig()
  if (!resolved.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Storyblok is not configured on this environment',
        code: resolved.code,
        missing: resolved.missing,
      },
      { status: 503 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON', code: 'invalid_json' }, { status: 400 })
  }

  const rec = body as { pack?: unknown; publish?: unknown }
  if (!isPack(rec.pack)) {
    return NextResponse.json(
      { ok: false, error: 'pack required (story + components)', code: 'invalid_pack' },
      { status: 400 },
    )
  }

  try {
    const result = await pushStoryblokHandoffPack(resolved.config, rec.pack, {
      publish: rec.publish === true,
    })
    return NextResponse.json({
      ok: true,
      ...result,
      spaceId: resolved.config.spaceId,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'push_failed'
    return NextResponse.json(
      { ok: false, error: message, code: 'storyblok_push_failed' },
      { status: 502 },
    )
  }
}
