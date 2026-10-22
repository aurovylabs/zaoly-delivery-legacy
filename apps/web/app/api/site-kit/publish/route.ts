import { NextResponse } from 'next/server'
import {
  parseKitAxesWire,
  parseKitVariantsWire,
} from '@zaoly/site-kit/master-variants'
import { requireApiSession } from '../../../../lib/require-api-session'
import { publishSiteKitItems } from '../../../../lib/site-kit/publish'
import type { AtomNamedVariant, SiteKitWriteInput } from '../../../../lib/site-kit/write'


/** Spec `site-kit.md` §5b — batch write + one Storybook rebuild. SK-S4 atom lanes. */
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
    platformProjectId?: string | null
    publishLane?: string
    items?: {
      componentId?: string
      args?: Record<string, unknown>
      tokenBindings?: Record<string, string>
      composition?: Record<string, unknown>
      variants?: unknown
      axes?: unknown
      defaultVariantId?: string
      publishLane?: string
      platformProjectId?: string | null
    }[]
  }

  if (!Array.isArray(rec.items) || rec.items.length === 0) {
    return NextResponse.json(
      { ok: false, error: 'items required', code: 'empty' },
      { status: 400 },
    )
  }

  const batchLane =
    rec.publishLane === 'seed' || rec.publishLane === 'fork' ? rec.publishLane : undefined
  const batchPid =
    typeof rec.platformProjectId === 'string' ? rec.platformProjectId : null

  const items: SiteKitWriteInput[] = []
  for (const raw of rec.items) {
    if (!raw.componentId || typeof raw.componentId !== 'string') continue
    const parsedVariants = parseKitVariantsWire(raw.variants)
    const variants: AtomNamedVariant[] | undefined = parsedVariants
      ? parsedVariants.map((v) => ({
          id: v.id,
          name: v.name,
          composition: v.composition as Record<string, unknown>,
          ...(v.combination ? { combination: v.combination } : {}),
        }))
      : undefined
    const axes = variants ? parseKitAxesWire(raw.axes) : undefined

    const itemLane =
      raw.publishLane === 'seed' || raw.publishLane === 'fork'
        ? raw.publishLane
        : batchLane
    const itemPid =
      typeof raw.platformProjectId === 'string'
        ? raw.platformProjectId
        : batchPid

    items.push({
      componentId: raw.componentId,
      args: raw.args,
      tokenBindings: raw.tokenBindings,
      composition: raw.composition,
      publishLane: itemLane,
      platformProjectId: itemPid,
      ...(variants
        ? {
            variants,
            defaultVariantId:
              typeof raw.defaultVariantId === 'string' ? raw.defaultVariantId : undefined,
            ...(axes ? { axes } : {}),
          }
        : {}),
    })
  }

  if (!items.length) {
    return NextResponse.json(
      { ok: false, error: 'No valid items', code: 'empty' },
      { status: 400 },
    )
  }

  const result = await publishSiteKitItems(items)
  if (!result.ok) {
    const status = result.code === 'empty' ? 400 : 500
    return NextResponse.json(result, { status })
  }
  return NextResponse.json(result)
}
