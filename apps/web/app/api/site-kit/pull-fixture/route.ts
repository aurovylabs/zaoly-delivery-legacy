import { NextResponse } from 'next/server'
import {
  clearPullFixtureProbe,
  injectPullFixtureGap,
} from '../../../../lib/site-kit/pull-fixture'


/**
 * QA only — inject/clear pullProbe on override (no Storybook rebuild).
 * knowledge/site-kit-pull-test-scenario.md
 */
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const rec = body as { action?: string; componentId?: string }
  const componentId =
    typeof rec.componentId === 'string' && rec.componentId.trim()
      ? rec.componentId.trim()
      : 'SiteButton'

  if (rec.action === 'inject-gap') {
    const result = await injectPullFixtureGap(componentId)
    return NextResponse.json(result, { status: result.ok ? 200 : 400 })
  }
  if (rec.action === 'clear-probe') {
    const result = await clearPullFixtureProbe(componentId)
    return NextResponse.json(result, { status: result.ok ? 200 : 400 })
  }

  return NextResponse.json(
    {
      ok: false,
      error: 'action must be inject-gap | clear-probe',
      code: 'bad-action',
    },
    { status: 400 },
  )
}
