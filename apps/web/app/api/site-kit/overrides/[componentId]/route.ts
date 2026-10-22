import { NextResponse } from 'next/server'
import {
  isAllowedOverrideId,
  isCompositionOverrideId,
  isNamespacedAtomOverrideId,
} from '../../../../../lib/site-kit/override-ids'
import { readSiteKitOverride } from '../../../../../lib/site-kit/override-store'
import { authorizeSiteKitPatternOverrideRead } from '../../../../../lib/site-kit/site-kit-read-auth'
import { paths } from '../../../../../lib/paths'


type Ctx = { params: Promise<{ componentId: string }> }

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': `Content-Type, ${paths.siteKitViewTokenHeader}`,
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

/** Live override JSON. SK-S1 Patterns + SK-S4 Atom forks Collection-gated; seed atoms public. */
export async function GET(request: Request, ctx: Ctx) {
  const { componentId } = await ctx.params
  if (!isAllowedOverrideId(componentId)) {
    return NextResponse.json(
      { ok: false, error: 'unknown-component' },
      { status: 404, headers: CORS },
    )
  }

  const body = await readSiteKitOverride(componentId)

  if (isCompositionOverrideId(componentId) || isNamespacedAtomOverrideId(componentId)) {
    const owner =
      typeof body?.platformProjectId === 'string' ? body.platformProjectId : null
    const allowed = await authorizeSiteKitPatternOverrideRead(request, owner)
    if (!allowed) {
      return NextResponse.json(
        { ok: false, error: 'not-found' },
        { status: 404, headers: { ...CORS, 'Cache-Control': 'no-store' } },
      )
    }
  }

  if (!body) {
    return NextResponse.json(
      {
        componentId,
        args: {},
        tokenBindings: {},
        updatedAt: null,
      },
      {
        headers: {
          ...CORS,
          'Cache-Control': 'no-store',
        },
      },
    )
  }

  return NextResponse.json(body, {
    headers: {
      ...CORS,
      'Cache-Control': 'no-store',
    },
  })
}
