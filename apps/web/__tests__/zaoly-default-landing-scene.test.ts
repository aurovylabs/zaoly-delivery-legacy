import { describe, expect, it } from 'vitest'
import { expandCompositionScene, findNodeInTree, resolveInspectSubject } from '../lib/scene/expand-instances'
import { INSTANCE_EXPAND_SEP } from '../lib/scene/instance-descendants'
import { applyMasterEditOp, applySceneOp, findMasterBySourceKey } from '../lib/scene/ops'
import { SITE_KIT_PALETTE_IDS, paletteMasterId } from '../lib/scene/site-kit-palette'
import { zaolyLandingSectionPaletteItems } from '../lib/scene/zaoly-landing-section-catalog'
import {
  createZaolyDefaultLandingScene,
  seedZaolyLandingSectionMasters,
  shouldReseedZaolyDefaultLanding,
  ZAOLY_DEFAULT_LANDING_HERO_ART_ID,
  ZAOLY_DEFAULT_LANDING_HERO_STAGE_ID,
  ZAOLY_DEFAULT_LANDING_NAV_ID,
  ZAOLY_DEFAULT_LANDING_PAGE_ID,
  ZAOLY_DEFAULT_LANDING_SCENE_NAME,
  ZAOLY_LANDING_CARD_VARIANT_IDS,
  ZAOLY_LANDING_SECTION_EXPORT_NAMES,
  zaolyDefaultLandingPageRoot,
  zaolyLandingSectionSourceKey,
} from '../lib/scene/zaoly-default-landing-scene'
import { landingSectionPaletteItems } from '../lib/scene/catalog-palette'
import { seedEditorPrefillMasters } from '../lib/scene/editor-master-prefill'
import { createEmptyArtboardScene } from '../lib/scene/demo-scene'
import { paths } from '../lib/paths'
import { DEFAULT_SITE_LAYOUT_BINDINGS } from '../lib/inspect/token-catalog'
import { resolveTokenBindingsToStyle } from '../lib/inspect/resolve-bindings'

const PAINT_STYLE_KEYS = new Set([
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'paddingBlock',
  'paddingInline',
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'marginBlock',
  'marginInline',
  'gap',
  'borderWidth',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'maxWidth',
  'minWidth',
  'height',
  'minHeight',
  'maxHeight',
  'borderRadius',
  'backgroundColor',
  'boxShadow',
  'color',
])

function walkTypes(node: { type: string; children?: unknown[] }): string[] {
  const out = [node.type]
  for (const child of node.children ?? []) {
    if (child && typeof child === 'object' && 'type' in child) {
      out.push(...walkTypes(child as { type: string; children?: unknown[] }))
    }
  }
  return out
}

function walkTokenPaths(node: {
  tokenBindings?: Record<string, string>
  instanceOverrides?: { tokenBindings?: Record<string, string> }
  children?: unknown[]
}): string[] {
  const out: string[] = []
  for (const path of Object.values(node.tokenBindings ?? {})) out.push(path)
  for (const path of Object.values(node.instanceOverrides?.tokenBindings ?? {})) out.push(path)
  for (const child of node.children ?? []) {
    if (child && typeof child === 'object') {
      out.push(...walkTokenPaths(child as Parameters<typeof walkTokenPaths>[0]))
    }
  }
  return out
}

function walkPaintStyleLeaks(node: {
  style?: Record<string, unknown>
  instanceOverrides?: { style?: Record<string, unknown> }
  children?: unknown[]
}): string[] {
  const leaks: string[] = []
  const styles = [node.style, node.instanceOverrides?.style]
  for (const style of styles) {
    if (!style) continue
    for (const [key, value] of Object.entries(style)) {
      if (!PAINT_STYLE_KEYS.has(key)) continue
      // % / auto stay structural; rem/px/em paint must be tokenBindings.
      if (typeof value === 'string' && /(rem|px|em)\b/.test(value)) {
        leaks.push(`${key}=${value}`)
      }
    }
  }
  for (const child of node.children ?? []) {
    if (child && typeof child === 'object') {
      leaks.push(...walkPaintStyleLeaks(child as Parameters<typeof walkPaintStyleLeaks>[0]))
    }
  }
  return leaks
}

describe('zaoly default landing composition', () => {
  it('builds a landing page from Site Kit layout + Instances with palette masters', () => {
    const scene = createZaolyDefaultLandingScene()
    expect(scene.name).toBe(ZAOLY_DEFAULT_LANDING_SCENE_NAME)
    expect(scene.pages).toHaveLength(1)
    expect(scene.pages?.[0]?.id).toBe(ZAOLY_DEFAULT_LANDING_PAGE_ID)
    expect(scene.pages?.[0]?.name).toBe('Landing')
    expect(scene.masters?.map((m) => m.sourceKey).sort()).toEqual(
      [
        ...SITE_KIT_PALETTE_IDS,
        ...ZAOLY_LANDING_SECTION_EXPORT_NAMES.map((name) => zaolyLandingSectionSourceKey(name)),
      ].sort(),
    )

    const root = zaolyDefaultLandingPageRoot()
    expect(root.id).toBe('page-zaoly-landing-root')
    expect(root.type).toBe('SiteStack')
    expect(root.children?.map((c) => c.id)).toEqual([
      ZAOLY_DEFAULT_LANDING_NAV_ID,
      ZAOLY_DEFAULT_LANDING_HERO_STAGE_ID,
      'pattern-zaoly-landing-showcase',
      'pattern-zaoly-landing-features',
      'pattern-zaoly-landing-kit-band',
      'pattern-zaoly-landing-cta',
      'pattern-zaoly-landing-footer',
    ])
    expect(root.children?.every((c) => c.type === 'Instance')).toBe(true)
    expect(root.children?.[0]?.instanceOf).toBe(
      paletteMasterId(zaolyLandingSectionSourceKey('LandingNav')),
    )

    const expanded = expandCompositionScene(scene)
    const types = walkTypes(expanded)
    expect(types).toContain('SiteStack')
    expect(types).toContain('SiteContainer')
    expect(types).toContain('SiteGrid')
    expect(types).not.toContain('Text')
    expect(types).not.toContain('Button')
    expect(types).not.toContain('Stack')
  })

  it('binds starter-pack token paths only (no hex / rgba brand fills)', () => {
    const scene = createZaolyDefaultLandingScene()
    const tokenPaths = (scene.masters ?? []).flatMap((m) => {
      const fromRoot = walkTokenPaths(m.root)
      const fromVariants = (m.variants ?? []).flatMap((v) => walkTokenPaths(v.root))
      return [...fromRoot, ...fromVariants]
    })
    expect(tokenPaths.length).toBeGreaterThan(10)
    expect(tokenPaths).toContain('color.brand.primary')
    expect(tokenPaths).toContain('color.action.primary')
    expect(tokenPaths).toContain('color.surface.inverse')
    expect(tokenPaths).toContain('typography.display')
    expect(tokenPaths).toContain('typography.heading.h1')
    expect(tokenPaths).toContain('shadow.elevation.md')
    expect(tokenPaths).toContain('spacing.gap.page')
    expect(tokenPaths).toContain('spacing.padding.xl')
    expect(tokenPaths).toContain('size.border.hairline')
    expect(tokenPaths).toContain('size.container.lg')
    expect(tokenPaths).toContain('size.block.hero')
    expect(tokenPaths).toContain('size.media.sm')
    expect(tokenPaths).toContain('size.media.md')
    expect(tokenPaths).toContain('size.media.lg')
    expect(tokenPaths).toContain('size.media.lgMax')
    for (const path of tokenPaths) {
      expect(path).not.toMatch(/^#|^rgb|^rgba|^hsl/i)
      expect(path).toMatch(/^(color|spacing|typography|radius|shadow|size)\./)
    }
  })

  it('keeps rem/px layout paint out of style (tokens as properties)', () => {
    const scene = createZaolyDefaultLandingScene()
    const sectionKeys = new Set(
      ZAOLY_LANDING_SECTION_EXPORT_NAMES.map((name) => zaolyLandingSectionSourceKey(name)),
    )
    for (const master of scene.masters ?? []) {
      if (!sectionKeys.has(master.sourceKey ?? '')) continue
      expect(walkPaintStyleLeaks(master.root)).toEqual([])
      for (const variant of master.variants ?? []) {
        expect(walkPaintStyleLeaks(variant.root)).toEqual([])
      }
    }

    const nav = findMasterBySourceKey(scene.masters, zaolyLandingSectionSourceKey('LandingNav'))?.root
    expect(nav?.tokenBindings?.paddingBlock).toBe('spacing.padding.lg')
    expect(nav?.tokenBindings?.paddingInline).toBe('spacing.padding.xl')
    expect(nav?.tokenBindings?.borderWidth).toBe('size.border.hairline')

    const painted = resolveTokenBindingsToStyle(nav?.tokenBindings)
    expect(painted.paddingBlock).toBe('1rem')
    expect(painted.paddingInline).toBe('1.5rem')
    expect(painted.borderWidth).toBe('1px')

    const hero = findMasterBySourceKey(scene.masters, zaolyLandingSectionSourceKey('LandingHero'))?.root
    expect(hero?.tokenBindings?.minHeight).toBe('size.block.hero')
    expect(resolveTokenBindingsToStyle(hero?.tokenBindings).minHeight).toBe('70vh')
  })

  it('uses product images from paths.landing.assets across hero, showcase, cards, and kit band', () => {
    const scene = createZaolyDefaultLandingScene()
    const hero = findMasterBySourceKey(scene.masters, zaolyLandingSectionSourceKey('LandingHero'))
    const heroArt = findNodeInTree(hero!.root, ZAOLY_DEFAULT_LANDING_HERO_ART_ID)
    expect(heroArt?.type).toBe('Instance')
    expect(heroArt?.instanceOverrides?.props?.src).toBe(paths.landing.assets.heroArtboard)
    expect(heroArt?.instanceOverrides?.tokenBindings?.padding).toBe('spacing.padding.lg')

    const showcase = findMasterBySourceKey(
      scene.masters,
      zaolyLandingSectionSourceKey('LandingShowcase'),
    )!.root
    const tokenShot = findNodeInTree(showcase, 'inst-zaoly-landing-showcase-media')
    const kitShot = findNodeInTree(showcase, 'inst-zaoly-landing-showcase-kit')
    expect(tokenShot?.instanceOverrides?.props?.src).toBe(paths.landing.assets.tokenStudioApp)
    expect(kitShot?.instanceOverrides?.props?.src).toBe(paths.landing.assets.kitPlaygroundApp)

    const card = findMasterBySourceKey(scene.masters, zaolyLandingSectionSourceKey('LandingCard'))
    const atoms = card?.variants?.find((v) => v.id === ZAOLY_LANDING_CARD_VARIANT_IDS.atoms)
    const cardImage = findNodeInTree(atoms!.root, 'mroot-LandingCard-image')
    expect(cardImage?.instanceOverrides?.props?.src).toBe(paths.landing.assets.kitAssembly)

    const kitBand = findMasterBySourceKey(
      scene.masters,
      zaolyLandingSectionSourceKey('LandingKitBand'),
    )!.root
    const kitArt = findNodeInTree(kitBand, 'inst-zaoly-landing-kit-band-art')
    expect(kitArt?.instanceOverrides?.props?.src).toBe(paths.landing.assets.kitAssembly)
    expect(kitArt?.instanceOverrides?.tokenBindings?.padding).toBe('spacing.padding.xl')
  })

  it('expands and keeps hero headline editable via Master-Edit set_prop', () => {
    const scene = createZaolyDefaultLandingScene()
    const expanded = expandCompositionScene(scene)
    expect(expanded.children?.length).toBeGreaterThan(0)

    const hero = findMasterBySourceKey(scene.masters, zaolyLandingSectionSourceKey('LandingHero'))!
    const headline = findNodeInTree(hero.root, 'inst-zaoly-landing-headline')
    expect(headline?.instanceOverrides?.props?.children).toMatch(/Compose product pages/i)

    const result = applyMasterEditOp(scene, hero.id, {
      op: 'set_prop',
      nodeId: 'inst-zaoly-landing-headline',
      key: 'children',
      value: 'Updated Zaoly headline',
    })
    expect(result.ok).toBe(true)
    const updatedHero = findMasterBySourceKey(
      result.scene!.masters,
      zaolyLandingSectionSourceKey('LandingHero'),
    )!
    const updated = findNodeInTree(updatedHero.root, 'inst-zaoly-landing-headline')
    expect(updated?.instanceOverrides?.props?.children).toBe('Updated Zaoly headline')
  })

  it('stores canvas copy on the page Instance descendants, not the section Master', () => {
    const scene = createZaolyDefaultLandingScene()
    const expandId = `${ZAOLY_DEFAULT_LANDING_HERO_STAGE_ID}${INSTANCE_EXPAND_SEP}inst-zaoly-landing-headline`
    const heroMasterId = paletteMasterId(zaolyLandingSectionSourceKey('LandingHero'))
    const inserted = applySceneOp(scene, {
      op: 'insert_instance',
      parentId: scene.root.id,
      masterId: heroMasterId,
      name: 'Hero copy',
    })
    expect(inserted.ok).toBe(true)
    const sibling = inserted.scene!.root.children?.find(
      (c) => c.type === 'Instance' && c.instanceOf === heroMasterId && c.id !== ZAOLY_DEFAULT_LANDING_HERO_STAGE_ID,
    )
    expect(sibling).toBeTruthy()

    const result = applySceneOp(inserted.scene!, {
      op: 'set_prop',
      nodeId: expandId,
      key: 'children',
      value: 'Page-only headline',
    })
    expect(result.ok).toBe(true)
    const host = result.scene!.root.children?.find((c) => c.id === ZAOLY_DEFAULT_LANDING_HERO_STAGE_ID)
    expect(host?.instanceOverrides?.descendants?.['inst-zaoly-landing-headline']?.props?.children).toBe(
      'Page-only headline',
    )

    const masterHeadline = findNodeInTree(
      findMasterBySourceKey(result.scene!.masters, zaolyLandingSectionSourceKey('LandingHero'))!.root,
      'inst-zaoly-landing-headline',
    )
    expect(masterHeadline?.instanceOverrides?.props?.children).toMatch(/Compose product pages/i)

    const subject = resolveInspectSubject(result.scene!, expandId)
    expect(subject?.props?.children).toBe('Page-only headline')

    const siblingExpand = `${sibling!.id}${INSTANCE_EXPAND_SEP}inst-zaoly-landing-headline`
    expect(resolveInspectSubject(result.scene!, siblingExpand)?.props?.children).toMatch(/Compose product pages/i)
  })

  it('nests palette atom Instances inside section Masters', () => {
    const scene = createZaolyDefaultLandingScene()
    const hero = findMasterBySourceKey(scene.masters, zaolyLandingSectionSourceKey('LandingHero'))!
    const headline = findNodeInTree(hero.root, 'inst-zaoly-landing-headline')
    expect(headline?.type).toBe('Instance')
    expect(headline?.instanceOf).toBe(paletteMasterId('SiteText'))
  })

  it('reseeds empty Untitled blanks and older landing seeds missing section Masters', () => {
    expect(shouldReseedZaolyDefaultLanding(createEmptyArtboardScene())).toBe(true)
    expect(shouldReseedZaolyDefaultLanding(createZaolyDefaultLandingScene())).toBe(false)

    const inline = createZaolyDefaultLandingScene()
    inline.root = {
      ...inline.root,
      children: inline.root.children?.map((child) =>
        child.id === ZAOLY_DEFAULT_LANDING_NAV_ID
          ? { id: child.id, type: 'SiteContainer', name: 'Nav' }
          : child,
      ),
    }
    expect(shouldReseedZaolyDefaultLanding(inline)).toBe(true)

    const legacy = createZaolyDefaultLandingScene()
    const heroKey = zaolyLandingSectionSourceKey('LandingHero')
    legacy.masters = legacy.masters?.map((m) => {
      if (m.sourceKey !== heroKey) return m
      const stripHeroArt = (node: (typeof m.root)): typeof m.root => ({
        ...node,
        children: node.children?.filter((c) => c.id !== ZAOLY_DEFAULT_LANDING_HERO_ART_ID).map(stripHeroArt),
      })
      return { ...m, root: stripHeroArt(m.root) }
    })
    expect(shouldReseedZaolyDefaultLanding(legacy)).toBe(true)

    const prePad = createZaolyDefaultLandingScene()
    const navKey = zaolyLandingSectionSourceKey('LandingNav')
    prePad.masters = prePad.masters?.map((m) => {
      if (m.sourceKey !== navKey || !m.root.tokenBindings) return m
      const { padding, paddingBlock, paddingInline, paddingTop, ...rest } = m.root.tokenBindings
      void padding
      void paddingBlock
      void paddingInline
      void paddingTop
      return { ...m, root: { ...m.root, tokenBindings: rest } }
    })
    expect(shouldReseedZaolyDefaultLanding(prePad)).toBe(true)
  })

  it('ships complete layout defaults for palette soft-fill', () => {
    expect(DEFAULT_SITE_LAYOUT_BINDINGS).toMatchObject({
      gap: 'spacing.gap.modules',
      background: 'color.surface.canvas',
      padding: 'spacing.padding.md',
      radius: 'radius.surface',
      borderColor: 'color.line',
    })
  })

  it('exposes starter sections in the Insert palette and prefills them on blank scenes', () => {
    expect(zaolyLandingSectionPaletteItems().map((i) => i.label)).toEqual(
      expect.arrayContaining(['Nav', 'Hero', 'Card', 'Features', 'CTA']),
    )
    expect(landingSectionPaletteItems().every((i) => i.layer === 'Sections')).toBe(true)

    const blank = createEmptyArtboardScene()
    const seeded = seedEditorPrefillMasters(blank)
    expect(seeded.root.children ?? []).toEqual(blank.root.children ?? [])
    expect(findMasterBySourceKey(seeded.masters, zaolyLandingSectionSourceKey('LandingNav'))).toBeTruthy()
    const twice = seedZaolyLandingSectionMasters(seeded)
    expect(twice.masters?.filter((m) => m.sourceKey === zaolyLandingSectionSourceKey('LandingNav'))).toHaveLength(1)
  })

  it('uses named Card variants inside the Features Master', () => {
    const scene = createZaolyDefaultLandingScene()
    const features = findMasterBySourceKey(
      scene.masters,
      zaolyLandingSectionSourceKey('LandingFeatures'),
    )!
    const cards = (features.root.children ?? [])
      .flatMap((c) => c.children ?? [])
      .filter((c) => c.instanceOf === paletteMasterId(zaolyLandingSectionSourceKey('LandingCard')))
    expect(cards.map((c) => c.instanceVariantId)).toEqual([
      ZAOLY_LANDING_CARD_VARIANT_IDS.atoms,
      ZAOLY_LANDING_CARD_VARIANT_IDS.tokens,
      ZAOLY_LANDING_CARD_VARIANT_IDS.editable,
    ])
  })
})
