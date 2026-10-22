import { NextResponse } from 'next/server'
import { readAtomPackageSource } from '../../../../lib/site-kit/atom-package-source'
import { isAllowedOverrideId } from '../../../../lib/site-kit/override-ids'
import { paths } from '../../../../lib/paths'


/** Read-only package atom implementation for `/kit` Handoff (SK-V18). Never writes. */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const componentId = url.searchParams.get(paths.kitComponentQueryParam)?.trim() ?? ''
  if (!componentId || !isAllowedOverrideId(componentId)) {
    return NextResponse.json(
      { ok: false, error: 'unknown-component' },
      { status: 404, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const result = await readAtomPackageSource(componentId)
  if (!result.ok) {
    const status = result.code === 'not-atom' ? 400 : 404
    return NextResponse.json(
      { ok: false, error: result.code },
      { status, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  return NextResponse.json(
    {
      ok: true,
      componentId: result.componentId,
      catalogId: result.catalogId,
      exportName: result.exportName,
      packageName: result.packageName,
      relPath: result.relPath,
      source: result.source,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
