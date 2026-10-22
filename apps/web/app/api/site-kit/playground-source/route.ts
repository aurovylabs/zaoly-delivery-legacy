import { NextResponse } from 'next/server'
import { SITE_KIT_CATALOG } from '../../../../lib/site-kit/site-kit-catalog'
import {
  exportNameFromCompositionId,
  isAllowedOverrideId,
  isCompositionOverrideId,
  isNamespacedAtomOverrideId,
} from '../../../../lib/site-kit/override-ids'
import { readSiteKitOverride } from '../../../../lib/site-kit/override-store'
import { authorizeSiteKitPatternOverrideRead } from '../../../../lib/site-kit/site-kit-read-auth'
import {
  buildAtomPlaygroundSeed,
  buildPatternPlaygroundSeed,
} from '../../../../lib/site-kit/playground-source'
import {
  buildStarterSectionPlaygroundSeed,
  isZaolyStarterSectionComponentId,
} from '../../../../lib/site-kit/zaoly-starter-sections'
import type { SiteKitCompositionNode } from '@zaoly/site-kit'
import { paths } from '../../../../lib/paths'


/** Read-only playground seed — never writes. Spec: site-kit-playground.md */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const componentId = url.searchParams.get(paths.kitComponentQueryParam)?.trim() ?? ''
  if (!componentId || !isAllowedOverrideId(componentId)) {
    return NextResponse.json(
      { ok: false, error: 'unknown-component' },
      { status: 404, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  // SK-V22: starter landing section Masters (not Kit SSOT / no Collection ACL).
  if (isZaolyStarterSectionComponentId(componentId)) {
    const seed = buildStarterSectionPlaygroundSeed(componentId)
    if (!seed) {
      return NextResponse.json(
        { ok: false, error: 'no-preview' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } },
      )
    }
    return NextResponse.json(seed, { headers: { 'Cache-Control': 'no-store' } })
  }

  const catalogHit = SITE_KIT_CATALOG.find((e) => e.id === componentId)
  const isPattern = isCompositionOverrideId(componentId)
  const isAtomFork = isNamespacedAtomOverrideId(componentId)

  if (catalogHit && !isPattern && !isAtomFork) {
    const override = await readSiteKitOverride(componentId)
    const seed = buildAtomPlaygroundSeed(componentId, override)
    if (!seed) {
      return NextResponse.json(
        { ok: false, error: 'no-preview' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } },
      )
    }
    return NextResponse.json(seed, { headers: { 'Cache-Control': 'no-store' } })
  }

  if (isPattern || isAtomFork) {
    const body = await readSiteKitOverride(componentId)
    const owner =
      typeof body?.platformProjectId === 'string' ? body.platformProjectId : null
    const allowed = await authorizeSiteKitPatternOverrideRead(request, owner)
    if (!allowed) {
      return NextResponse.json(
        { ok: false, error: 'not-found' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } },
      )
    }
    if (!body?.composition || typeof body.composition !== 'object') {
      return NextResponse.json(
        { ok: false, error: 'no-composition' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } },
      )
    }
    const exportName =
      (typeof body.exportName === 'string' && body.exportName) ||
      exportNameFromCompositionId(componentId) ||
      'Pattern'
    const seed = buildPatternPlaygroundSeed({
      componentId,
      exportName,
      composition: body.composition as SiteKitCompositionNode,
      platformProjectId: owner,
      updatedAt: typeof body.updatedAt === 'string' ? body.updatedAt : null,
      storyTitle: typeof body.storyTitle === 'string' ? body.storyTitle : null,
      variants: body.variants,
      defaultVariantId:
        typeof body.defaultVariantId === 'string' ? body.defaultVariantId : null,
      axes: body.axes,
    })
    return NextResponse.json(seed, { headers: { 'Cache-Control': 'no-store' } })
  }

  return NextResponse.json(
    { ok: false, error: 'unknown-component' },
    { status: 404, headers: { 'Cache-Control': 'no-store' } },
  )
}
