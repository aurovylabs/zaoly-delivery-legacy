/**
 * Starter named Master variants — soft-seed on Kit Master Prefill.
 * Spec: `zaoly-starter-token-pack.md` wave 7 · `composition-masters.md` Prefill
 */
import type { SceneMaster, SceneMasterVariant, SceneNode, SceneStateId, SceneStateOverride } from '@zaoly/contracts'
import {
  DEFAULT_SITE_BADGE_BINDINGS,
  DEFAULT_SITE_BUTTON_BINDINGS,
  defaultSiteKitInteractiveStates,
} from '../inspect/token-catalog'
import { DEFAULT_VARIANT_NAME } from './master-variants'
import { cloneSceneNodeWithDeterministicIds } from './scene-clone'
import { defaultChildForType } from './scene-insert-defaults'

type InteractiveStateKey = Exclude<SceneStateId, 'default'>

export type StarterMasterVariantSeed = {
  name: string
  slug: string
  tokenBindings: Record<string, string>
  states?: Partial<Record<InteractiveStateKey, SceneStateOverride>>
  props?: Record<string, unknown>
}

/** Soft-added named variants (Default stays Master.root). */
export function starterMasterVariantSeeds(sourceKey: string): StarterMasterVariantSeed[] {
  switch (sourceKey) {
    case 'SiteButton':
      return [
        {
          name: 'Secondary',
          slug: 'secondary',
          tokenBindings: {
            ...DEFAULT_SITE_BUTTON_BINDINGS,
            background: 'color.action.secondary',
            color: 'color.action.secondaryForeground',
          },
          states: {
            hover: { tokenBindings: { background: 'color.action.secondaryHover' } },
            focus: { tokenBindings: { borderColor: 'color.ring' } },
            active: { tokenBindings: { background: 'color.action.secondaryHover' } },
            disabled: {
              tokenBindings: {
                background: 'color.action.primaryDisabled',
                color: 'color.action.primaryDisabledForeground',
              },
            },
          },
          props: { children: 'Secondary' },
        },
        {
          name: 'Accent',
          slug: 'accent',
          tokenBindings: {
            ...DEFAULT_SITE_BUTTON_BINDINGS,
            background: 'color.action.accent',
            color: 'color.action.accentForeground',
          },
          states: {
            hover: { tokenBindings: { background: 'color.action.live' } },
            focus: { tokenBindings: { borderColor: 'color.ring' } },
            disabled: {
              tokenBindings: {
                background: 'color.surface.muted',
                color: 'color.inkMuted',
              },
            },
          },
          props: { children: 'Accent' },
        },
        {
          name: 'Destructive',
          slug: 'destructive',
          tokenBindings: {
            ...DEFAULT_SITE_BUTTON_BINDINGS,
            background: 'color.action.destructive',
            color: 'color.action.destructiveForeground',
          },
          states: {
            hover: { tokenBindings: { background: 'color.status.danger' } },
            focus: { tokenBindings: { borderColor: 'color.ring' } },
            disabled: {
              tokenBindings: {
                background: 'color.action.primaryDisabled',
                color: 'color.action.primaryDisabledForeground',
              },
            },
          },
          props: { children: 'Delete' },
        },
      ]
    case 'SiteBadge':
      return [
        {
          name: 'Ok',
          slug: 'ok',
          tokenBindings: {
            ...DEFAULT_SITE_BADGE_BINDINGS,
            background: 'color.status.ok',
            color: 'color.status.okForeground',
          },
          props: { children: 'Ok' },
        },
        {
          name: 'Warn',
          slug: 'warn',
          tokenBindings: {
            ...DEFAULT_SITE_BADGE_BINDINGS,
            background: 'color.status.warn',
            color: 'color.status.warnForeground',
          },
          props: { children: 'Warn' },
        },
        {
          name: 'Danger',
          slug: 'danger',
          tokenBindings: {
            ...DEFAULT_SITE_BADGE_BINDINGS,
            background: 'color.status.danger',
            color: 'color.status.dangerForeground',
          },
          props: { children: 'Danger' },
        },
      ]
    default:
      return []
  }
}

function starterVariantRoot(sourceKey: string, seed: StarterMasterVariantSeed): SceneNode {
  const base = defaultChildForType(sourceKey)
  const interactive = defaultSiteKitInteractiveStates(sourceKey)
  return cloneSceneNodeWithDeterministicIds(
    {
      ...base,
      props: { ...base.props, ...seed.props },
      tokenBindings: seed.tokenBindings,
      states: seed.states ?? interactive,
    },
    `mroot-${sourceKey}-${seed.slug}`,
  )
}

/**
 * Soft-append starter named variants. Existing names win; Phase-3 axes skip.
 * Deterministic ids for SSR hydration.
 */
export function softFillStarterMasterVariants(master: SceneMaster): SceneMaster {
  const sourceKey = master.sourceKey?.trim() ?? ''
  if (!sourceKey) return master
  if (master.axes?.length) return master

  const seeds = starterMasterVariantSeeds(sourceKey)
  if (!seeds.length) return master

  let variants: SceneMasterVariant[] = master.variants ? [...master.variants] : []
  let defaultVariantId = master.defaultVariantId
  let changed = false

  if (!variants.length) {
    const defaultId = `mvar-${sourceKey}-default`
    variants = [
      {
        id: defaultId,
        name: DEFAULT_VARIANT_NAME,
        root: structuredClone(master.root),
      },
    ]
    defaultVariantId = defaultId
    changed = true
  }

  const existingNames = new Set(variants.map((v) => v.name.trim().toLowerCase()))
  for (const seed of seeds) {
    if (existingNames.has(seed.name.toLowerCase())) continue
    variants.push({
      id: `mvar-${sourceKey}-${seed.slug}`,
      name: seed.name,
      root: starterVariantRoot(sourceKey, seed),
    })
    existingNames.add(seed.name.toLowerCase())
    changed = true
  }

  if (!changed) return master
  return {
    ...master,
    defaultVariantId: defaultVariantId ?? variants[0]?.id,
    variants,
  }
}
