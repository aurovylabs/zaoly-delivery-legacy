/**
 * QA helper: inject / clear a schema gap on a Site Kit override for Pull tests.
 * Does NOT schedule Storybook rebuild. Spec: site-kit-kit-pull.md
 * Operator: knowledge/site-kit-pull-test-scenario.md
 */
import { defaultChildForType } from '../scene/ops'
import { isAllowedOverrideId } from './override-ids'
import {
  readSiteKitOverride,
  writeSiteKitOverride,
  type SiteKitOverrideBody,
} from './override-store'
import {
  serializeSiteKitComposition,
  type SiteKitCompositionNode,
} from './sync-tree'
import { resolveSiteKitSeed } from './seed'
import type { KitSeedPayload } from './pull-merge'

export const PULL_PROBE_PROP = 'pullProbe'

function asComposition(raw: unknown): SiteKitCompositionNode | null {
  if (!raw || typeof raw !== 'object') return null
  if (typeof (raw as { type?: unknown }).type !== 'string') return null
  return raw as SiteKitCompositionNode
}

function withProbe(comp: SiteKitCompositionNode, on: boolean): SiteKitCompositionNode {
  const props = { ...(comp.props ?? {}) }
  if (on) props[PULL_PROBE_PROP] = true
  else delete props[PULL_PROBE_PROP]
  return { ...comp, props }
}

function isSeedOk(
  seed: KitSeedPayload | { ok: false; error: string; code: string },
): seed is KitSeedPayload {
  return !('ok' in seed && seed.ok === false)
}

export async function injectPullFixtureGap(componentId: string): Promise<
  | { ok: true; componentId: string; kitRevision: string; probeKey: string }
  | { ok: false; code: string; error: string }
> {
  const id = componentId.trim()
  if (!isAllowedOverrideId(id)) {
    return { ok: false, code: 'unknown-component', error: `Unknown id: ${id}` }
  }

  const existing = await readSiteKitOverride(id)
  let composition: SiteKitCompositionNode

  const fromOverride = existing?.composition
    ? asComposition(existing.composition)
    : null
  if (fromOverride) {
    composition = withProbe(fromOverride, true)
  } else {
    const seed = await resolveSiteKitSeed(id)
    if (!isSeedOk(seed)) {
      return { ok: false, code: seed.code, error: seed.error }
    }
    composition = withProbe(serializeSiteKitComposition(seed.root), true)
  }

  const body: SiteKitOverrideBody = {
    ...(existing ?? { componentId: id }),
    componentId: id,
    composition: composition as unknown as Record<string, unknown>,
    updatedAt: new Date().toISOString(),
  }

  if (body.variants?.length) {
    body.variants = body.variants.map((v) => {
      const c = asComposition(v.composition)
      return {
        ...v,
        composition: (c
          ? withProbe(c, true)
          : composition) as unknown as Record<string, unknown>,
      }
    })
  }

  const wrote = await writeSiteKitOverride(body)
  if (!wrote.ok) return wrote

  return {
    ok: true,
    componentId: id,
    kitRevision: `override:${body.updatedAt}`,
    probeKey: PULL_PROBE_PROP,
  }
}

export async function clearPullFixtureProbe(componentId: string): Promise<
  | { ok: true; componentId: string; cleared: boolean }
  | { ok: false; code: string; error: string }
> {
  const id = componentId.trim()
  const existing = await readSiteKitOverride(id)
  if (!existing?.composition) {
    return { ok: true, componentId: id, cleared: false }
  }
  const c = asComposition(existing.composition)
  if (!c || !(PULL_PROBE_PROP in (c.props ?? {}))) {
    return { ok: true, componentId: id, cleared: false }
  }

  const body: SiteKitOverrideBody = {
    ...existing,
    composition: withProbe(c, false) as unknown as Record<string, unknown>,
    updatedAt: new Date().toISOString(),
  }
  if (body.variants?.length) {
    body.variants = body.variants.map((v) => {
      const vc = asComposition(v.composition)
      return {
        ...v,
        composition: (vc
          ? withProbe(vc, false)
          : v.composition) as unknown as Record<string, unknown>,
      }
    })
  }
  const wrote = await writeSiteKitOverride(body)
  if (!wrote.ok) return wrote
  return { ok: true, componentId: id, cleared: true }
}

export function catalogCompositionFor(componentId: string): SiteKitCompositionNode {
  return serializeSiteKitComposition(defaultChildForType(componentId))
}
