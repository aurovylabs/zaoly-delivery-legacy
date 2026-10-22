/**
 * Browser client for Site Kit direct write (no GitHub).
 * Spec: `specs/api/site-kit-write.md` · site-kit.md §5b (Publish)
 */
import { compositionComponentId, compositionStoryTitle } from '@zaoly/site-kit/composition-codegen'
import type { SceneBreakpointId, SceneMaster, SceneNode } from '@zaoly/contracts'
import type { InspectTokenOption } from '../inspect/token-catalog'
import { paths } from '../paths'
import { resolveMasterDefinitionRoot } from '../scene/master-variants'
import { isSiteKitInsertableType } from '../scene/site-kit-palette'
import { prepareSiteKitCompositionSavePayload } from './save-composition-root'
import {
  masterForKitSave,
  serializeMasterNamedVariantsForKit,
} from './master-kit-export'
import { collectPublishableMasters } from './publish-collect'
import { collectPullableMasters } from './pull-merge'
import {
  parseStorybookRedeployResult,
  type StorybookRedeployResult,
} from './storybook-redeploy'
import {
  serializeSiteKitComposition,
  siteKitArgsFromNode,
} from './sync-tree'

export {
  siteKitArgsFromNode,
  resolveSiteKitSyncRoot,
  serializeSiteKitComposition,
} from './sync-tree'

export { collectPublishableMasters } from './publish-collect'
export { collectPullableMasters } from './pull-merge'

export type SiteKitWriteClientOptions = {
  breakpoint?: SceneBreakpointId
  /** Wave H — OP-9 cascade base for serialize. */
  primaryBreakpoint?: Exclude<SceneBreakpointId, 'print'>
  tokenCatalog?: InspectTokenOption[]
  /** Scene Masters — when selection is Instance / Master-Edit, export named variants. */
  masters?: SceneMaster[]
  masterEditId?: string | null
  /** Collection bind for Pattern scope. */
  platformProjectId?: string | null
}

function writePayloadFromMaster(
  master: SceneMaster,
  options?: Pick<
    SiteKitWriteClientOptions,
    'breakpoint' | 'primaryBreakpoint' | 'tokenCatalog' | 'platformProjectId'
  > & { publishLane?: 'seed' | 'fork' },
) {
  const serializeOpts = {
    breakpoint: options?.breakpoint,
    primaryBreakpoint: options?.primaryBreakpoint,
    tokenCatalog: options?.tokenCatalog,
  }
  const root = resolveMasterDefinitionRoot(master)
  const composition = serializeSiteKitComposition(root, serializeOpts)
  const named = serializeMasterNamedVariantsForKit(master, serializeOpts)
  return {
    componentId: root.type,
    args: siteKitArgsFromNode(root),
    tokenBindings: composition.tokenBindings ?? {},
    composition,
    publishLane: options?.publishLane,
    platformProjectId: options?.platformProjectId ?? null,
    ...(named
      ? {
          variants: named.variants,
          defaultVariantId: named.defaultVariantId,
          ...(named.axes?.length ? { axes: named.axes } : {}),
        }
      : {}),
  }
}

/** Atom / layout Write — syncs the selected node only (atoms-first). No Storybook rebuild. */
export async function requestSiteKitWrite(
  node: SceneNode,
  options?: SiteKitWriteClientOptions & { publishLane?: 'seed' | 'fork' },
): Promise<
  | { ok: true; wrote: string[]; componentId: string; variantCount?: number }
  | { ok: false; error: string }
> {
  if (!isSiteKitInsertableType(node.type)) {
    return { ok: false, error: `Not a Site Kit type: ${node.type}` }
  }
  const serializeOpts = {
    breakpoint: options?.breakpoint,
    primaryBreakpoint: options?.primaryBreakpoint,
    tokenCatalog: options?.tokenCatalog,
  }
  const composition = serializeSiteKitComposition(node, serializeOpts)
  const master = masterForKitSave(options?.masters, node, options?.masterEditId)
  const named = master
    ? serializeMasterNamedVariantsForKit(master, serializeOpts)
    : null

  const res = await fetch(paths.routes.apiSiteKitWrite, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      componentId: node.type,
      args: siteKitArgsFromNode(node),
      tokenBindings: composition.tokenBindings ?? {},
      composition,
      publishLane: options?.publishLane,
      platformProjectId: options?.platformProjectId ?? null,
      ...(named
        ? {
            variants: named.variants,
            defaultVariantId: named.defaultVariantId,
            ...(named.axes?.length ? { axes: named.axes } : {}),
          }
        : {}),
    }),
  })
  const body = (await res.json()) as {
    ok?: boolean
    wrote?: string[]
    error?: string
    variantCount?: number
    axisCount?: number
    componentId?: string
  }
  if (!body.ok) return { ok: false, error: body.error || 'Write failed' }
  return {
    ok: true,
    wrote: body.wrote ?? [],
    componentId: body.componentId || node.type,
    ...(typeof body.variantCount === 'number' ? { variantCount: body.variantCount } : {}),
  }
}

/** Publish all Site Kit Masters in the scene + one Storybook rebuild. */
export async function requestSiteKitPublishAll(options: {
  masters: SceneMaster[]
  breakpoint?: SceneBreakpointId
  primaryBreakpoint?: Exclude<SceneBreakpointId, 'print'>
  tokenCatalog?: InspectTokenOption[]
  platformProjectId?: string | null
  /** Default: Collection fork when platformProjectId set; seed requires shared-lane env. */
  publishLane?: 'seed' | 'fork'
}): Promise<
  | {
      ok: true
      published: number
      componentIds: string[]
      wrote: string[]
      failures?: { componentId: string; error: string }[]
      storybookRedeploy?: StorybookRedeployResult
    }
  | { ok: false; error: string }
> {
  const publishable = collectPublishableMasters(options.masters)
  if (!publishable.length) {
    return { ok: false, error: 'No Site Kit masters to publish' }
  }
  const items = publishable.map((m) =>
    writePayloadFromMaster(m, {
      breakpoint: options.breakpoint,
      primaryBreakpoint: options.primaryBreakpoint,
      tokenCatalog: options.tokenCatalog,
      platformProjectId: options.platformProjectId,
      publishLane: options.publishLane,
    }),
  )
  const res = await fetch(paths.routes.apiSiteKitPublish, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      items,
      platformProjectId: options.platformProjectId ?? null,
      publishLane: options.publishLane,
    }),
  })
  const body = (await res.json()) as {
    ok?: boolean
    published?: number
    componentIds?: string[]
    wrote?: string[]
    failures?: { componentId: string; error: string }[]
    storybookRedeploy?: { status?: string; reason?: string }
    error?: string
  }
  if (!body.ok) return { ok: false, error: body.error || 'Publish failed' }
  const storybookRedeploy = parseStorybookRedeployResult(body.storybookRedeploy)
  return {
    ok: true,
    published: body.published ?? items.length,
    componentIds: body.componentIds ?? items.map((i) => i.componentId),
    wrote: body.wrote ?? [],
    ...(body.failures?.length ? { failures: body.failures } : {}),
    ...(storybookRedeploy ? { storybookRedeploy } : {}),
  }
}

/** Pull (schema) or Reset Site Kit Masters from kit seed. Spec: site-kit-kit-pull.md */
export async function requestSiteKitPull(options: {
  masters: SceneMaster[]
  mode?: 'pull' | 'reset'
  sceneRoot?: SceneNode
  platformProjectId?: string | null
}): Promise<
  | {
      ok: true
      masters: SceneMaster[]
      sceneRoot?: SceneNode
      updated: number
      unchanged: number
      reset: number
      remaps: { masterId: string; fromVariantId: string; toVariantId: string; byName: boolean }[]
    }
  | { ok: false; error: string }
> {
  const mode = options.mode === 'reset' ? 'reset' : 'pull'
  if (!collectPullableMasters(options.masters).length) {
    return { ok: false, error: 'No Site Kit masters to pull' }
  }
  const res = await fetch(paths.routes.apiSiteKitPull, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      mode,
      masters: options.masters,
      ...(options.sceneRoot && mode === 'reset' ? { sceneRoot: options.sceneRoot } : {}),
      ...(options.platformProjectId
        ? { platformProjectId: options.platformProjectId }
        : {}),
    }),
  })
  const body = (await res.json()) as {
    ok?: boolean
    masters?: SceneMaster[]
    sceneRoot?: SceneNode
    updated?: number
    unchanged?: number
    reset?: number
    remaps?: {
      masterId: string
      fromVariantId: string
      toVariantId: string
      byName: boolean
    }[]
    error?: string
  }
  if (!body.ok || !body.masters) {
    return { ok: false, error: body.error || 'Pull failed' }
  }
  return {
    ok: true,
    masters: body.masters,
    ...(body.sceneRoot ? { sceneRoot: body.sceneRoot } : {}),
    updated: body.updated ?? 0,
    unchanged: body.unchanged ?? 0,
    reset: body.reset ?? 0,
    remaps: body.remaps ?? [],
  }
}

export async function requestSiteKitSaveComposition(
  name: string,
  selected: SceneNode,
  options?: SiteKitWriteClientOptions & {
    /** Persisted page / master-edit node (not expanded inspect subject). */
    persisted?: SceneNode | null
  },
): Promise<
  | {
      ok: true
      exportName: string
      masterId: string
      wrote: string[]
      storyTitle: string
      componentId: string
      variantCount?: number
      warning?: string
      storybookRedeploy?: StorybookRedeployResult
    }
  | { ok: false; error: string; code?: string }
> {
  const prepared = prepareSiteKitCompositionSavePayload({
    name,
    selected,
    persisted: options?.persisted ?? null,
    masterEditId: options?.masterEditId ?? null,
    masters: options?.masters,
    breakpoint: options?.breakpoint,
    tokenCatalog: options?.tokenCatalog,
  })
  if (!prepared.ok) {
    return { ok: false, error: prepared.error, code: prepared.code }
  }

  const res = await fetch(paths.routes.apiSiteKitCompositions, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      name,
      platformProjectId: options?.platformProjectId ?? null,
      root: prepared.root,
      ...(prepared.named
        ? {
            variants: prepared.named.variants,
            defaultVariantId: prepared.named.defaultVariantId,
          }
        : {}),
    }),
  })
  let body: {
    ok?: boolean
    exportName?: string
    wrote?: string[]
    storyTitle?: string
    componentId?: string
    platformProjectId?: string
    variantCount?: number
    warning?: string
    storybookRedeploy?: { status?: string; reason?: string }
    error?: string
    code?: string
  }
  try {
    body = (await res.json()) as typeof body
  } catch {
    return {
      ok: false,
      error: res.ok ? 'Invalid response from server' : `Save failed (${res.status})`,
    }
  }
  if (!res.ok || !body.ok) {
    return {
      ok: false,
      error: body.error || `Save failed (${res.status})`,
      code: body.code,
    }
  }
  const exportName = body.exportName || prepared.exportName
  const storybookRedeploy = parseStorybookRedeployResult(body.storybookRedeploy)
  return {
    ok: true,
    exportName,
    masterId: prepared.masterId,
    wrote: body.wrote ?? [],
    storyTitle:
      body.storyTitle || compositionStoryTitle(exportName, options?.platformProjectId),
    componentId:
      body.componentId ||
      compositionComponentId(exportName, options?.platformProjectId),
    ...(typeof body.variantCount === 'number' ? { variantCount: body.variantCount } : {}),
    ...(body.warning ? { warning: body.warning } : {}),
    ...(storybookRedeploy ? { storybookRedeploy } : {}),
  }
}
