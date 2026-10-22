/**
 * Site Kit → CREATION Master hydrate (Pull / Reset).
 * Spec: site-kit-kit-pull.md — client-safe (no node:fs).
 */
import type {
  CompositionScene,
  SceneMaster,
  SceneMasterVariant,
  SceneNode,
  SceneNodeId,
} from '@zaoly/contracts'
import { createSceneNodeId, softFillInteractiveStates, softFillTokenBindings } from '../scene/ops'
import { listMasterVariants } from '../scene/master-variants'
import { persistActivePageRoot } from '../scene/scene-pages'
import { isSiteKitInsertableType } from '../scene/site-kit-palette'
import {
  deserializeSiteKitComposition,
  type SiteKitCompositionNode,
} from './sync-tree'
import {
  compositionComponentId,
  atomForkComponentId,
} from '@zaoly/site-kit/composition-codegen'

export type KitSeedPayload = {
  componentId: string
  kitRevision: string
  root: SceneNode
  variants?: SceneMasterVariant[]
  defaultVariantId?: string
}

export type PullMode = 'pull' | 'reset'

export type VariantRemap = {
  masterId: string
  fromVariantId: string
  toVariantId: string
  byName: boolean
}

export type PullMasterResult = {
  master: SceneMaster
  changed: boolean
  addedProps: string[]
  remaps: VariantRemap[]
}

function softFillProps(
  target: Record<string, unknown> | undefined,
  seed: Record<string, unknown> | undefined,
): { props: Record<string, unknown>; added: string[] } {
  const base = { ...(target ?? {}) }
  const added: string[] = []
  for (const [k, v] of Object.entries(seed ?? {})) {
    if (!(k in base)) {
      base[k] = v
      added.push(k)
    }
  }
  return { props: base, added }
}

function softFillStyle(
  target: SceneNode['style'] | undefined,
  seed: SceneNode['style'] | undefined,
): { style?: SceneNode['style']; added: string[] } {
  if (!seed || !Object.keys(seed).length) {
    return { style: target, added: [] }
  }
  const base = { ...(target ?? {}) }
  const added: string[] = []
  for (const [k, v] of Object.entries(seed)) {
    if (!(k in base)) {
      ;(base as Record<string, string | number>)[k] = v
      added.push(k)
    }
  }
  return { style: base, added }
}

/** Schema-safe merge: designer values win; missing keys from seed. */
export function softFillSchemaFromSeed(
  target: SceneNode,
  seed: SceneNode,
): { node: SceneNode; addedProps: string[] } {
  const propsFill = softFillProps(target.props, seed.props)
  const styleFill = softFillStyle(target.style, seed.style)
  let node: SceneNode = {
    ...target,
    props: propsFill.props,
    ...(styleFill.style ? { style: styleFill.style } : {}),
  }
  const withBindings = softFillTokenBindings(node, seed.tokenBindings ?? {})
  node = softFillInteractiveStates(withBindings, seed.states ?? {})

  if ((!node.children || node.children.length === 0) && seed.children?.length) {
    node = {
      ...node,
      children: seed.children.map((c) => ({
        ...c,
        id: createSceneNodeId(c.type.toLowerCase()),
      })),
    }
  }

  const addedProps = [
    ...propsFill.added,
    ...styleFill.added.map((k) => `style.${k}`),
  ]
  if (withBindings !== target && seed.tokenBindings) {
    for (const k of Object.keys(seed.tokenBindings)) {
      if (!(k in (target.tokenBindings ?? {}))) addedProps.push(`token.${k}`)
    }
  }
  return { node, addedProps }
}

export function kitComponentIdForMaster(
  master: SceneMaster,
  platformProjectId?: string | null,
): string | null {
  const key = master.sourceKey?.trim()
  if (key?.startsWith('Composition:')) {
    const exportName = key.slice('Composition:'.length)
    return compositionComponentId(exportName, platformProjectId)
  }
  const atomType =
    key && isSiteKitInsertableType(key)
      ? key
      : isSiteKitInsertableType(master.root.type)
        ? master.root.type
        : null
  if (!atomType) return null
  const pid = platformProjectId?.trim()
  // SK-S4: prefer Collection fork id; resolveSiteKitSeed falls back to global seed.
  if (pid) return atomForkComponentId(atomType, pid)
  return atomType
}

export function collectPullableMasters(masters: SceneMaster[]): SceneMaster[] {
  return masters.filter((m) => kitComponentIdForMaster(m) != null)
}

function stampMaster(
  master: SceneMaster,
  kitRevision: string,
  patch: Partial<SceneMaster>,
): SceneMaster {
  return {
    ...master,
    ...patch,
    pulledAt: new Date().toISOString(),
    kitRevision,
  }
}

/** Mode A — schema pull. */
export function pullMasterSchema(
  master: SceneMaster,
  seed: KitSeedPayload,
): PullMasterResult {
  const addedProps: string[] = []
  let rootResult = softFillSchemaFromSeed(master.root, seed.root)
  addedProps.push(...rootResult.addedProps)
  let root = rootResult.node
  let variants = master.variants
  let changed =
    root !== master.root ||
    addedProps.length > 0 ||
    master.kitRevision !== seed.kitRevision

  if (variants?.length) {
    const nextVariants = variants.map((v) => {
      const filled = softFillSchemaFromSeed(v.root, seed.root)
      if (filled.addedProps.length) {
        addedProps.push(...filled.addedProps.map((p) => `${v.name}:${p}`))
        changed = true
      }
      return filled.node === v.root ? v : { ...v, root: filled.node }
    })
    variants = nextVariants
  }

  if (!changed && master.kitRevision === seed.kitRevision) {
    return { master, changed: false, addedProps: [], remaps: [] }
  }

  return {
    master: stampMaster(master, seed.kitRevision, {
      root,
      ...(variants ? { variants } : {}),
    }),
    changed: true,
    addedProps,
    remaps: [],
  }
}

function cloneSeedRoot(seedRoot: SceneNode): SceneNode {
  const walk = (n: SceneNode): SceneNode => ({
    ...n,
    id: createSceneNodeId(n.type.toLowerCase()),
    ...(n.children?.length ? { children: n.children.map(walk) } : {}),
  })
  return walk(seedRoot)
}

/** Mode B — Reset; remaps Instance variants by name. */
export function resetMasterFromSeed(
  master: SceneMaster,
  seed: KitSeedPayload,
): PullMasterResult {
  const remaps: VariantRemap[] = []
  const oldVariants = listMasterVariants(master)
  const newRoot = cloneSeedRoot(seed.root)

  let variants: SceneMasterVariant[] | undefined
  let defaultVariantId: string | undefined

  if (seed.variants && seed.variants.length >= 2) {
    variants = seed.variants.map((v) => ({
      id: createSceneNodeId('mvar'),
      name: v.name,
      root: cloneSeedRoot(v.root),
    }))
    const defaultName =
      seed.variants.find((v) => v.id === seed.defaultVariantId)?.name ??
      seed.variants[0]!.name
    defaultVariantId =
      variants.find((v) => v.name === defaultName)?.id ?? variants[0]!.id

    for (const old of oldVariants) {
      const byName = variants.find(
        (v) => v.name.trim().toLowerCase() === old.name.trim().toLowerCase(),
      )
      const to = byName ?? variants.find((v) => v.id === defaultVariantId)!
      remaps.push({
        masterId: master.id,
        fromVariantId: old.id,
        toVariantId: to.id,
        byName: Boolean(byName),
      })
    }
  } else {
    for (const old of oldVariants) {
      remaps.push({
        masterId: master.id,
        fromVariantId: old.id,
        toVariantId: '',
        byName: false,
      })
    }
  }

  const next: SceneMaster = {
    id: master.id,
    name: master.name,
    ...(master.sourceKey ? { sourceKey: master.sourceKey } : {}),
    root: variants
      ? variants.find((v) => v.id === defaultVariantId)?.root ?? newRoot
      : newRoot,
    pulledAt: new Date().toISOString(),
    kitRevision: seed.kitRevision,
    ...(variants ? { variants, defaultVariantId } : {}),
  }

  return { master: next, changed: true, addedProps: [], remaps }
}

/** Remap Instance `instanceVariantId` after Reset. */
export function applyVariantRemapsToSceneRoot(
  root: SceneNode,
  remaps: VariantRemap[],
): SceneNode {
  if (!remaps.length) return root
  const byMaster = new Map<string, VariantRemap[]>()
  for (const r of remaps) {
    const list = byMaster.get(r.masterId) ?? []
    list.push(r)
    byMaster.set(r.masterId, list)
  }

  const walk = (node: SceneNode): SceneNode => {
    let next = node
    if (node.instanceOf && byMaster.has(node.instanceOf)) {
      const list = byMaster.get(node.instanceOf)!
      if (node.instanceVariantId) {
        const hit = list.find((r) => r.fromVariantId === node.instanceVariantId)
        if (hit) {
          if (!hit.toVariantId) {
            const { instanceVariantId: _drop, ...rest } = node
            next = rest
          } else if (hit.toVariantId !== node.instanceVariantId) {
            next = { ...node, instanceVariantId: hit.toVariantId }
          }
        } else {
          const fallback =
            list.find((r) => r.byName === false && r.toVariantId)?.toVariantId ||
            list.find((r) => r.toVariantId)?.toVariantId ||
            ''
          if (!fallback) {
            const { instanceVariantId: _drop, ...rest } = node
            next = rest
          } else {
            next = { ...node, instanceVariantId: fallback }
          }
        }
      }
    }
    if (!next.children?.length) return next
    let changed = next !== node
    const children = next.children.map((c) => {
      const c2 = walk(c)
      if (c2 !== c) changed = true
      return c2
    })
    return changed ? { ...next, children } : next
  }

  return walk(root)
}

/** @deprecated use applyVariantRemapsToSceneRoot */
export function applyVariantRemapsToScene(
  scene: CompositionScene,
  remaps: VariantRemap[],
): CompositionScene {
  const root = applyVariantRemapsToSceneRoot(scene.root, remaps)
  if (root === scene.root) return scene
  return { ...scene, root, updatedAt: new Date().toISOString() }
}

export function seedRootFromComposition(
  composition: SiteKitCompositionNode,
): SceneNode {
  return deserializeSiteKitComposition(composition, createSceneNodeId)
}

/**
 * Apply a successful pull/reset payload onto a scene.
 * When `sceneRoot` is present (Reset remaps), write it through `persistActivePageRoot`
 * so multi-page boards do not drift active `pages[].root` from `scene.root`.
 * Client-safe — do not import via `pull.ts` (that pulls Postgres override/seed).
 */
export function mergeSiteKitPullIntoScene(
  scene: CompositionScene,
  pull: { masters: SceneMaster[]; sceneRoot?: CompositionScene['root'] },
): CompositionScene {
  const next: CompositionScene = {
    ...scene,
    masters: pull.masters,
    ...(pull.sceneRoot ? { root: pull.sceneRoot } : {}),
    updatedAt: new Date().toISOString(),
  }
  return pull.sceneRoot ? persistActivePageRoot(next) : next
}

export type { SceneNodeId }
