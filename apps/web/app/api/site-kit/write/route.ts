import { NextResponse } from 'next/server'
import {
  parseKitAxesWire,
  parseKitVariantsWire,
} from '@zaoly/site-kit/master-variants'
import { requireApiSession } from '../../../../lib/require-api-session'
import { writeSiteKitStory, type AtomNamedVariant } from '../../../../lib/site-kit/write'


/** Spec `specs/api/site-kit-write.md` — direct kit write, never GitHub. SK-S4 lanes. */
export async function POST(request: Request) {
  const denied = await requireApiSession()
  if (denied) return denied
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const rec = body as {
    componentId?: string
    args?: Record<string, unknown>
    tokenBindings?: Record<string, string>
    composition?: Record<string, unknown>
    variants?: unknown
    axes?: unknown
    defaultVariantId?: string
    publishLane?: string
    platformProjectId?: string | null
  }
  if (!rec.componentId || typeof rec.componentId !== 'string') {
    return NextResponse.json(
      { ok: false, error: 'componentId required', code: 'unknown-component' },
      { status: 400 },
    )
  }

  const parsedVariants = parseKitVariantsWire(rec.variants)
  const variants: AtomNamedVariant[] | undefined = parsedVariants
    ? parsedVariants.map((v) => ({
        id: v.id,
        name: v.name,
        composition: v.composition as Record<string, unknown>,
        ...(v.combination ? { combination: v.combination } : {}),
      }))
    : undefined
  const axes = variants ? parseKitAxesWire(rec.axes) : undefined

  const result = await writeSiteKitStory({
    componentId: rec.componentId,
    args: rec.args,
    tokenBindings: rec.tokenBindings,
    composition: rec.composition,
    publishLane:
      rec.publishLane === 'seed' || rec.publishLane === 'fork'
        ? rec.publishLane
        : undefined,
    platformProjectId:
      typeof rec.platformProjectId === 'string' ? rec.platformProjectId : null,
    ...(variants
      ? {
          variants,
          defaultVariantId:
            typeof rec.defaultVariantId === 'string' ? rec.defaultVariantId : undefined,
          ...(axes ? { axes } : {}),
        }
      : {}),
  })

  if (!result.ok) {
    const status =
      result.code === 'unknown-component' ||
      result.code === 'missing-platform-project-id' ||
      result.code === 'seed-lane-conflict' ||
      result.code === 'scope-mismatch' ||
      result.code === 'invalid-axes' ||
      result.code === 'invalid-variants'
        ? 400
        : result.code === 'seed-write-forbidden'
          ? 403
          : 500
    return NextResponse.json(result, { status })
  }

  return NextResponse.json(result)
}
