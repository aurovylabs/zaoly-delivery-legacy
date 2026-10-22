/**
 * Wave H — OP-9 primary breakpoint resolve + rematerialize.
 * Spec: specs/domain/responsive-breakpoint-set-primary.md
 */
import type {
  CompositionScene,
  SceneBreakpointId,
  SceneBreakpointOverride,
  SceneMaster,
  SceneNode,
  ScenePage,
} from '@zaoly/contracts'
import { cascadeNodeForBreakpoint } from './cascade'

export type DigitalPrimaryBreakpoint = Exclude<SceneBreakpointId, 'print'>

const DIGITAL_BPS: readonly DigitalPrimaryBreakpoint[] = [
  'desktop',
  'tablet',
  'mobile',
]

const ALL_CASCADE_BPS: readonly SceneBreakpointId[] = [
  'desktop',
  'tablet',
  'mobile',
  'print',
]

export function resolvePrimaryBreakpoint(
  scene: Pick<CompositionScene, 'primaryBreakpoint'> | null | undefined,
): DigitalPrimaryBreakpoint {
  const p = scene?.primaryBreakpoint
  if (p === 'tablet' || p === 'mobile' || p === 'desktop') return p
  return 'desktop'
}

export function isDigitalPrimaryBreakpoint(
  bp: SceneBreakpointId,
): bp is DigitalPrimaryBreakpoint {
  return bp === 'desktop' || bp === 'tablet' || bp === 'mobile'
}

type EffectiveView = {
  props: Record<string, unknown>
  tokenBindings: Record<string, string>
  dataBindings: Record<string, string>
  hidden: boolean
}

function effectiveAt(
  node: SceneNode,
  bp: SceneBreakpointId,
  primary: DigitalPrimaryBreakpoint,
): EffectiveView {
  const cascaded = cascadeNodeForBreakpoint(node, bp, primary)
  const hidden =
    bp === primary
      ? Boolean(node.hidden)
      : typeof node.breakpoints?.[bp]?.hidden === 'boolean'
        ? Boolean(node.breakpoints[bp]?.hidden)
        : Boolean(node.hidden)
  return {
    props: cascaded.props,
    tokenBindings: cascaded.tokenBindings,
    dataBindings: cascaded.dataBindings,
    hidden,
  }
}

function sparseDelta(
  effective: EffectiveView,
  base: EffectiveView,
): SceneBreakpointOverride | null {
  const props: Record<string, unknown> = {}
  const tokenBindings: Record<string, string> = {}
  const dataBindings: Record<string, string> = {}
  for (const [k, v] of Object.entries(effective.props)) {
    if (!Object.is(base.props[k], v)) props[k] = v
  }
  for (const [k, v] of Object.entries(effective.tokenBindings)) {
    if (base.tokenBindings[k] !== v) tokenBindings[k] = v
  }
  for (const [k, v] of Object.entries(effective.dataBindings)) {
    if (base.dataBindings[k] !== v) dataBindings[k] = v
  }
  const out: SceneBreakpointOverride = {}
  if (Object.keys(props).length) out.props = props
  if (Object.keys(tokenBindings).length) out.tokenBindings = tokenBindings
  if (Object.keys(dataBindings).length) out.dataBindings = dataBindings
  if (effective.hidden !== base.hidden) out.hidden = effective.hidden
  return Object.keys(out).length ? out : null
}

/** Rematerialize one node so `newPrimary` becomes the base lane. */
export function rematerializeNodePrimary(
  node: SceneNode,
  oldPrimary: DigitalPrimaryBreakpoint,
  newPrimary: DigitalPrimaryBreakpoint,
): SceneNode {
  if (oldPrimary === newPrimary) return node
  const effectives = new Map<SceneBreakpointId, EffectiveView>()
  for (const bp of ALL_CASCADE_BPS) {
    effectives.set(bp, effectiveAt(node, bp, oldPrimary))
  }
  const newBase = effectives.get(newPrimary)!
  const breakpoints: NonNullable<SceneNode['breakpoints']> = {}
  for (const bp of ALL_CASCADE_BPS) {
    if (bp === newPrimary) continue
    const delta = sparseDelta(effectives.get(bp)!, newBase)
    if (delta) breakpoints[bp] = delta
  }
  const next: SceneNode = {
    ...node,
    props: { ...newBase.props },
    tokenBindings: Object.keys(newBase.tokenBindings).length
      ? { ...newBase.tokenBindings }
      : undefined,
    dataBindings: Object.keys(newBase.dataBindings).length
      ? { ...newBase.dataBindings }
      : undefined,
    hidden: newBase.hidden || undefined,
    breakpoints: Object.keys(breakpoints).length ? breakpoints : undefined,
  }
  if (node.children?.length) {
    next.children = node.children.map((c) =>
      rematerializeNodePrimary(c, oldPrimary, newPrimary),
    )
  }
  return next
}

function rematerializeRoot(
  root: SceneNode,
  oldPrimary: DigitalPrimaryBreakpoint,
  newPrimary: DigitalPrimaryBreakpoint,
): SceneNode {
  return rematerializeNodePrimary(root, oldPrimary, newPrimary)
}

function rematerializeMasters(
  masters: SceneMaster[] | undefined,
  oldPrimary: DigitalPrimaryBreakpoint,
  newPrimary: DigitalPrimaryBreakpoint,
): SceneMaster[] | undefined {
  if (!masters?.length) return masters
  return masters.map((m) => ({
    ...m,
    variants: (m.variants ?? []).map((v) => ({
      ...v,
      root: rematerializeRoot(v.root, oldPrimary, newPrimary),
    })),
  }))
}

function rematerializePages(
  pages: ScenePage[] | undefined,
  root: SceneNode,
  oldPrimary: DigitalPrimaryBreakpoint,
  newPrimary: DigitalPrimaryBreakpoint,
): { pages?: ScenePage[]; root: SceneNode } {
  if (!pages?.length) {
    return { root: rematerializeRoot(root, oldPrimary, newPrimary) }
  }
  return {
    root: rematerializeRoot(root, oldPrimary, newPrimary),
    pages: pages.map((p) => ({
      ...p,
      root: rematerializeRoot(p.root, oldPrimary, newPrimary),
    })),
  }
}

/** Apply Wave H rematerialize across the scene document. */
export function rematerializeScenePrimary(
  scene: CompositionScene,
  newPrimary: DigitalPrimaryBreakpoint,
): CompositionScene {
  const oldPrimary = resolvePrimaryBreakpoint(scene)
  if (oldPrimary === newPrimary) {
    return scene.primaryBreakpoint === newPrimary
      ? scene
      : { ...scene, primaryBreakpoint: newPrimary }
  }
  const { root, pages } = rematerializePages(
    scene.pages,
    scene.root,
    oldPrimary,
    newPrimary,
  )
  return {
    ...scene,
    primaryBreakpoint: newPrimary,
    root,
    pages,
    masters: rematerializeMasters(scene.masters, oldPrimary, newPrimary),
  }
}

export { DIGITAL_BPS as PRIMARY_DIGITAL_BPS }
