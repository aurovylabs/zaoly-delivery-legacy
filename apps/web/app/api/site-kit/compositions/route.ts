import { NextResponse } from 'next/server'
import {
  parseKitAxesWire,
  parseKitVariantsWire,
} from '@zaoly/site-kit/master-variants'
import {
  listSiteKitCompositions,
  saveSiteKitComposition,
} from '../../../../lib/site-kit/composition-write'
import type { SiteKitCompositionNode } from '../../../../lib/site-kit/sync-tree'
import {
  isSceneApiAccess,
  requireSceneApiAccess,
} from '../../../../lib/require-scene-api-access'
import { authorizeSiteKitCompositionList } from '../../../../lib/site-kit/site-kit-read-auth'
import { paths } from '../../../../lib/paths'


const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': `Content-Type, ${paths.siteKitViewTokenHeader}`,
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

/** Spec `specs/api/site-kit-write.md` — list / save named compositions (SK-S1 ACL). */
export async function GET(request: Request) {
  const authz = await authorizeSiteKitCompositionList(request)
  if (!authz.ok) {
    const denied = authz.response
    for (const [k, v] of Object.entries(CORS)) denied.headers.set(k, v)
    denied.headers.set('Cache-Control', 'no-store')
    return denied
  }

  const compositions = await listSiteKitCompositions(authz.filter)
  return NextResponse.json(
    { compositions },
    {
      headers: {
        ...CORS,
        'Cache-Control': 'no-store',
      },
    },
  )
}

export async function POST(request: Request) {
  const access = await requireSceneApiAccess(request)
  if (!isSceneApiAccess(access)) return access

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const rec = body as {
    name?: string
    platformProjectId?: string
    root?: SiteKitCompositionNode
    variants?: unknown
    axes?: unknown
    defaultVariantId?: string
  }
  if (!rec.name || typeof rec.name !== 'string') {
    return NextResponse.json(
      { ok: false, error: 'name required', code: 'invalid-name' },
      { status: 400 },
    )
  }
  if (!rec.root || typeof rec.root !== 'object') {
    return NextResponse.json(
      { ok: false, error: 'root required', code: 'invalid-tree' },
      { status: 400 },
    )
  }

  const parsed = parseKitVariantsWire(rec.variants)
  const variants = parsed
    ? parsed.map((v) => ({
        id: v.id,
        name: v.name,
        composition: v.composition as unknown as SiteKitCompositionNode,
        ...(v.combination ? { combination: v.combination } : {}),
      }))
    : undefined
  const axes = variants ? parseKitAxesWire(rec.axes) : undefined

  if (Array.isArray(rec.variants) && rec.variants.length >= 2) {
    if (!variants || variants.length < 2) {
      return NextResponse.json(
        {
          ok: false,
          error: 'At least two valid named variants required',
          code: 'invalid-variants',
        },
        { status: 400 },
      )
    }
  }

  const result = await saveSiteKitComposition({
    name: rec.name,
    root: rec.root,
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
      result.code === 'disk-unwritable' || result.code === 'path-escape'
        ? 500
        : 400
    return NextResponse.json(result, { status })
  }
  return NextResponse.json(result)
}
