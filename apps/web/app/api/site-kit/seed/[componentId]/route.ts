import { NextResponse } from 'next/server'
import { resolveSiteKitSeed } from '../../../../../lib/site-kit/seed'


/** Spec site-kit-kit-pull.md — seed for Pull/Reset. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ componentId: string }> },
) {
  const { componentId } = await context.params
  const seed = await resolveSiteKitSeed(decodeURIComponent(componentId))
  if ('ok' in seed && seed.ok === false) {
    const status = seed.code === 'unknown-component' ? 404 : 400
    return NextResponse.json(seed, { status })
  }
  return NextResponse.json({ ok: true, seed })
}
