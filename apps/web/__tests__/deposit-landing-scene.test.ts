import { describe, expect, it } from 'vitest'
import {
  createDepositLandingScene,
  DEPOSIT_CONTACT_PAGE_ID,
  DEPOSIT_LANDING_PAGE_ID,
  DEPOSIT_LANDING_SCENE_ID,
  DEPOSIT_LANDING_SCENE_NAME,
  DEPOSIT_STUDIO_PAGE_ID,
  depositContactPageRoot,
  depositLandingPageRoot,
  depositStudioPageRoot,
  shouldReseedDepositLanding,
} from '../lib/scene/deposit-landing-scene'
import { expandCompositionScene } from '../lib/scene/expand-instances'
import { paths } from '../lib/paths'
import { SITE_KIT_PALETTE_IDS } from '../lib/scene/site-kit-palette'

function collectBindings(node: ReturnType<typeof depositLandingPageRoot>): string[] {
  const out: string[] = []
  const walk = (n: typeof node) => {
    for (const path of Object.values(n.tokenBindings ?? {})) out.push(path)
    for (const ov of Object.values(n.instanceOverrides?.tokenBindings ?? {})) out.push(ov)
    for (const child of n.children ?? []) walk(child)
  }
  walk(node)
  return out
}

describe('deposit landing scene', () => {
  it('seeds Zaoly Deposit Collection with three artboards', () => {
    const scene = createDepositLandingScene()
    expect(scene.id).toBe(DEPOSIT_LANDING_SCENE_ID)
    expect(scene.name).toBe(DEPOSIT_LANDING_SCENE_NAME)
    expect(scene.platformProjectId).toBe(paths.zaolyDepositPlatformProjectId)
    expect(scene.activePageId).toBe(DEPOSIT_LANDING_PAGE_ID)
    expect(scene.masters).toHaveLength(SITE_KIT_PALETTE_IDS.length)
    expect(scene.pages?.map((p) => p.id)).toEqual([
      DEPOSIT_LANDING_PAGE_ID,
      DEPOSIT_STUDIO_PAGE_ID,
      DEPOSIT_CONTACT_PAGE_ID,
    ])
  })

  it('binds deposit semantic tokens (no Geist / neutral fixture paths on page shell)', () => {
    const bindings = [
      ...collectBindings(depositLandingPageRoot()),
      ...collectBindings(depositStudioPageRoot()),
      ...collectBindings(depositContactPageRoot()),
    ]
    expect(bindings).toContain('color.background')
    expect(bindings).toContain('color.surface.elevated')
    expect(bindings).toContain('color.surface.base')
    expect(bindings).toContain('color.action.primary')
    expect(bindings).toContain('color.status.danger')
    expect(bindings).toContain('color.field')
    expect(bindings).toContain('typography.body.family')
    expect(bindings).toContain('typography.heading.h1')
    expect(bindings).toContain('spacing.static.4')
    expect(bindings).not.toContain('color.neutral.100')
    expect(bindings).not.toContain('color.neutral.700')
    expect(bindings).not.toContain('spacing.static.medium')
  })

  it('expands brand + headline Instances for Inspect', () => {
    const scene = createDepositLandingScene()
    const expanded = expandCompositionScene(scene)
    const brand = expanded.children
      ?.find((c) => c.id === 'pattern-deposit-header')
      ?.children?.find((c) => c.id === 'inst-deposit-brand')
    expect(brand?.type).toBe('SiteText')
    expect(brand?.props?.children).toBe('Zaoly')
    expect(brand?.tokenBindings?.fontFamily).toBe('typography.heading.h1')
  })

  it('studio page includes quick-create form atoms', () => {
    const scene = createDepositLandingScene()
    const studioPage = scene.pages?.find((p) => p.id === DEPOSIT_STUDIO_PAGE_ID)
    const input = studioPage?.root.children
      ?.find((c) => c.id === 'pattern-deposit-studio-main')
      ?.children?.find((c) => c.id === 'pattern-deposit-studio-content')
      ?.children?.find((c) => c.id === 'pattern-deposit-quick-create')
      ?.children?.find((c) => c.id === 'inst-deposit-quick-create-name')
    expect(input?.type).toBe('Instance')
    expect(input?.instanceOf).toBe('master-SiteInput')
  })

  it('shouldReseedDepositLanding only for untouched single-page seed', () => {
    const fresh = createDepositLandingScene()
    expect(shouldReseedDepositLanding(fresh)).toBe(false)

    const legacy = {
      ...fresh,
      pages: [fresh.pages![0]!],
    }
    expect(shouldReseedDepositLanding(legacy)).toBe(true)

    const renamed = { ...legacy, name: 'My custom landing' }
    expect(shouldReseedDepositLanding(renamed)).toBe(false)
  })
})
