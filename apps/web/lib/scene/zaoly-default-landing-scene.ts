/**
 * Zaoly default landing composition — Site Kit atoms + starter-pack tokenBindings.
 * Spec: `specs/domain/editor-workspace.md` · knowledge/zaoly-default-landing-composition.md
 */
import type {
  CompositionScene,
  SceneInstanceOverrides,
  SceneMaster,
  SceneNode,
} from '@zaoly/contracts'
import {
  DEFAULT_BODY_TYPE_BINDINGS,
  DEFAULT_HEADLINE_TYPE_BINDINGS,
  DEFAULT_SITE_BUTTON_BINDINGS,
  DEFAULT_SITE_LINK_BINDINGS,
  defaultSiteKitTokenBindings,
} from '../inspect/token-catalog'
import { paths } from '../paths'
import { DEFAULT_EDITOR_SCENE_ID } from './demo-scene'
import { INSTANCE_TYPE } from './expand-instances'
import { cloneSceneNodeWithDeterministicIds, defaultChildForType, findMasterBySourceKey } from './ops'
import {
  SITE_KIT_PALETTE_IDS,
  paletteMasterId,
  type SiteKitPaletteId,
} from './site-kit-palette'
import {
  ZAOLY_LANDING_SECTION_EXPORT_NAMES,
  zaolyLandingSectionSourceKey,
  type ZaolyLandingSectionExportName,
} from './zaoly-landing-section-catalog'
import {
  applySiteKitResponsiveDefaults,
  siteKitNodeNeedsResponsiveDefaults,
} from './site-kit-responsive'

export const ZAOLY_DEFAULT_LANDING_SCENE_ID = DEFAULT_EDITOR_SCENE_ID
export const ZAOLY_DEFAULT_LANDING_PAGE_ID = 'page-zaoly-landing'
export const ZAOLY_DEFAULT_LANDING_SCENE_NAME = 'Zaoly Landing'
/** Marker node id for soft-upgrade of older landing seeds. */
export const ZAOLY_DEFAULT_LANDING_HERO_STAGE_ID = 'pattern-zaoly-landing-hero-stage'
/** Soft-upgrade marker when media mosaic ships (hero art + duo showcase). */
export const ZAOLY_DEFAULT_LANDING_HERO_ART_ID = 'inst-zaoly-landing-hero-art'
/** Soft-upgrade marker when layout paint moves fully into tokenBindings. */
export const ZAOLY_DEFAULT_LANDING_NAV_ID = 'pattern-zaoly-landing-nav'

export { ZAOLY_LANDING_SECTION_EXPORT_NAMES, zaolyLandingSectionSourceKey }
export type { ZaolyLandingSectionExportName } from './zaoly-landing-section-catalog'

export const ZAOLY_LANDING_CARD_VARIANT_IDS = {
  atoms: 'mvar-LandingCard-atoms',
  tokens: 'mvar-LandingCard-tokens',
  editable: 'mvar-LandingCard-editable',
} as const

type LayoutKind = 'SiteStack' | 'SiteContainer' | 'SiteGrid'

const PAGE_BINDINGS: Record<string, string> = {
  gap: 'spacing.gap.page',
  background: 'color.surface.canvas',
  paddingBlock: 'spacing.margin.section',
  paddingInline: 'spacing.padding.xl',
}

const SURFACE_BINDINGS: Record<string, string> = {
  gap: 'spacing.gap.modules',
  background: 'color.surface.elevated',
  radius: 'radius.surface',
  borderColor: 'color.line',
  borderWidth: 'size.border.hairline',
  shadow: 'shadow.elevation.md',
  padding: 'spacing.padding.lg',
}

const INVERSE_SURFACE_BINDINGS: Record<string, string> = {
  gap: 'spacing.gap.section',
  background: 'color.surface.inverse',
  padding: 'spacing.padding.none',
}

const INVERSE_BAND_BINDINGS: Record<string, string> = {
  gap: 'spacing.gap.section',
  background: 'color.surface.inverse',
  paddingBlock: 'spacing.margin.section',
  paddingInline: 'spacing.padding.xl',
}

const MUTED_SURFACE_BINDINGS: Record<string, string> = {
  gap: 'spacing.gap.modules',
  background: 'color.surface.muted',
  padding: 'spacing.padding.none',
}

const NAV_BINDINGS: Record<string, string> = {
  gap: 'spacing.gap.modules',
  background: 'color.surface.base',
  borderColor: 'color.line',
  borderWidth: 'size.border.hairline',
  shadow: 'shadow.elevation.sm',
  paddingBlock: 'spacing.padding.lg',
  paddingInline: 'spacing.padding.xl',
}

const FOOTER_BINDINGS: Record<string, string> = {
  gap: 'spacing.gap.modules',
  background: 'color.surface.base',
  borderColor: 'color.line',
  borderWidth: 'size.border.hairline',
  paddingBlock: 'spacing.padding.xl',
  paddingInline: 'spacing.padding.xl',
}

const BRAND_DISPLAY_BINDINGS: Record<string, string> = {
  fontFamily: 'typography.display',
  fontSize: 'typography.display',
  fontWeight: 'typography.display',
  lineHeight: 'typography.display',
  letterSpacing: 'typography.display',
  color: 'color.brand.primary',
}

const INVERSE_BRAND_BINDINGS: Record<string, string> = {
  ...BRAND_DISPLAY_BINDINGS,
  color: 'color.action.accent',
}

const INVERSE_HEADLINE_BINDINGS: Record<string, string> = {
  ...DEFAULT_HEADLINE_TYPE_BINDINGS,
  color: 'color.surface.inverseForeground',
}

const MUTED_BINDINGS: Record<string, string> = {
  ...DEFAULT_BODY_TYPE_BINDINGS,
  color: 'color.inkMuted',
}

const INVERSE_MUTED_BINDINGS: Record<string, string> = {
  ...DEFAULT_BODY_TYPE_BINDINGS,
  color: 'color.inkSecondary',
}

const LABEL_BINDINGS: Record<string, string> = {
  ...MUTED_BINDINGS,
  fontFamily: 'typography.label',
  fontSize: 'typography.label',
  fontWeight: 'typography.label',
  lineHeight: 'typography.label',
}

const PRIMARY_BUTTON_BINDINGS: Record<string, string> = {
  ...DEFAULT_SITE_BUTTON_BINDINGS,
}

const INVERSE_GHOST_BUTTON_BINDINGS: Record<string, string> = {
  ...DEFAULT_SITE_BUTTON_BINDINGS,
  background: 'color.surface.inverse',
  color: 'color.surface.inverseForeground',
  borderColor: 'color.lineStrong',
}

const LINK_BINDINGS: Record<string, string> = {
  ...DEFAULT_SITE_LINK_BINDINGS,
  color: 'color.action.link',
}

function demoMasterId(sourceKey: SiteKitPaletteId): string {
  return paletteMasterId(sourceKey)
}

function paletteMasters(): SceneMaster[] {
  return SITE_KIT_PALETTE_IDS.map((type) => {
    const root = cloneSceneNodeWithDeterministicIds(
      defaultChildForType(type),
      `mroot-${type}`,
    )
    return {
      id: demoMasterId(type),
      name: type.replace(/^Site/, '') || type,
      sourceKey: type,
      root,
    }
  })
}

function inst(
  sourceKey: SiteKitPaletteId,
  opts?: {
    id?: string
    name?: string
    overrides?: SceneInstanceOverrides
  },
): SceneNode {
  const node: SceneNode = {
    id: opts?.id ?? `inst-${sourceKey}`,
    type: INSTANCE_TYPE,
    name: opts?.name ?? sourceKey.replace(/^Site/, ''),
    instanceOf: demoMasterId(sourceKey),
  }
  if (opts?.overrides) node.instanceOverrides = opts.overrides
  return node
}

function compositionInst(
  exportName: ZaolyLandingSectionExportName,
  opts: { id: string; name?: string; variantId?: string },
): SceneNode {
  const node: SceneNode = {
    id: opts.id,
    type: INSTANCE_TYPE,
    name: opts.name ?? exportName.replace(/^Landing/, ''),
    instanceOf: paletteMasterId(zaolyLandingSectionSourceKey(exportName)),
  }
  if (opts.variantId) node.instanceVariantId = opts.variantId
  return node
}

function compositionMaster(
  exportName: ZaolyLandingSectionExportName,
  name: string,
  root: SceneNode,
  variants?: NonNullable<SceneMaster['variants']>,
): SceneMaster {
  const master: SceneMaster = {
    id: paletteMasterId(zaolyLandingSectionSourceKey(exportName)),
    name,
    sourceKey: zaolyLandingSectionSourceKey(exportName),
    root: applySiteKitResponsiveDefaults(root),
  }
  if (variants?.length) {
    master.variants = variants.map((v) => ({
      ...v,
      root: applySiteKitResponsiveDefaults(v.root),
    }))
    master.defaultVariantId = variants[0]!.id
  }
  return master
}

function layout(
  type: LayoutKind,
  id: string,
  props: Record<string, unknown>,
  children: SceneNode[],
  opts?: {
    tokenBindings?: Record<string, string>
    style?: SceneNode['style']
    breakpoints?: SceneNode['breakpoints']
  },
): SceneNode {
  return {
    id,
    type,
    props,
    tokenBindings: opts?.tokenBindings ?? defaultSiteKitTokenBindings(type),
    ...(opts?.style ? { style: opts.style } : {}),
    ...(opts?.breakpoints ? { breakpoints: opts.breakpoints } : {}),
    children,
  }
}

function findNodeId(node: SceneNode, id: string): boolean {
  if (node.id === id) return true
  for (const child of node.children ?? []) {
    if (findNodeId(child, id)) return true
  }
  return false
}

function findNode(node: SceneNode, id: string): SceneNode | null {
  if (node.id === id) return node
  for (const child of node.children ?? []) {
    const hit = findNode(child, id)
    if (hit) return hit
  }
  return null
}

function hasLayoutPaddingBinding(node: SceneNode | null): boolean {
  const b = node?.tokenBindings
  if (!b) return false
  return Boolean(b.padding || b.paddingBlock || b.paddingInline || b.paddingTop)
}

function mediaImage(
  id: string,
  src: string,
  alt: string,
  opts?: {
    style?: SceneNode['style']
    tokenBindings?: Record<string, string>
  },
): SceneNode {
  return inst('SiteImage', {
    id,
    overrides: {
      props: { src, alt },
      ...(opts?.tokenBindings ? { tokenBindings: opts.tokenBindings } : {}),
      style: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        display: 'block',
        ...opts?.style,
      },
    },
  })
}

function featureCard(
  id: string,
  badge: string,
  title: string,
  body: string,
  media: { src: string; alt: string },
): SceneNode {
  return layout(
    'SiteStack',
    id,
    { direction: 'column', gap: 'sm' },
    [
      layout(
        'SiteStack',
        `${id}-media`,
        { direction: 'column', gap: 'none' },
        [mediaImage(`${id}-image`, media.src, media.alt)],
        {
          tokenBindings: {
            gap: 'spacing.gap.none',
            background: 'color.surface.muted',
            radius: 'radius.surface',
            padding: 'spacing.padding.none',
            height: 'size.media.sm',
          },
          style: {
            width: '100%',
            overflow: 'hidden',
          },
        },
      ),
      inst('SiteBadge', {
        id: `${id}-badge`,
        overrides: { props: { children: badge } },
      }),
      inst('SiteText', {
        id: `${id}-title`,
        overrides: {
          props: { role: 'title', children: title },
          tokenBindings: {
            ...DEFAULT_HEADLINE_TYPE_BINDINGS,
            fontFamily: 'typography.heading.h3',
            fontSize: 'typography.heading.h3',
            fontWeight: 'typography.heading.h3',
            lineHeight: 'typography.heading.h3',
            letterSpacing: 'typography.heading.h3',
            color: 'color.ink',
          },
        },
      }),
      inst('SiteText', {
        id: `${id}-body`,
        overrides: {
          props: { role: 'body', children: body },
          tokenBindings: MUTED_BINDINGS,
        },
      }),
    ],
    {
      tokenBindings: {
        ...SURFACE_BINDINGS,
        minHeight: 'size.media.md',
      },
      style: {
        width: '100%',
        justifyContent: 'flex-start',
      },
    },
  )
}

function navPattern(): SceneNode {
  return layout(
    'SiteContainer',
    ZAOLY_DEFAULT_LANDING_NAV_ID,
    { direction: 'row', gap: 'md', wrap: true },
    [
      inst('SiteText', {
        id: 'inst-zaoly-landing-nav-brand',
        overrides: {
          props: { role: 'title', children: paths.brandLabel },
          tokenBindings: BRAND_DISPLAY_BINDINGS,
        },
      }),
      layout(
        'SiteStack',
        'pattern-zaoly-landing-nav-links',
        { direction: 'row', gap: 'md', wrap: true },
        [
          inst('SiteLink', {
            id: 'inst-zaoly-landing-nav-product',
            overrides: {
              props: { children: 'Product', href: `#${paths.landing.sections.product}` },
              tokenBindings: LINK_BINDINGS,
            },
          }),
          inst('SiteLink', {
            id: 'inst-zaoly-landing-nav-tokens',
            overrides: {
              props: { children: 'Tokens', href: `#${paths.landing.sections.tokens}` },
              tokenBindings: LINK_BINDINGS,
            },
          }),
          inst('SiteLink', {
            id: 'inst-zaoly-landing-nav-kit',
            overrides: {
              props: { children: 'Kit', href: `#${paths.landing.sections.kit}` },
              tokenBindings: LINK_BINDINGS,
            },
          }),
        ],
        {
          tokenBindings: {
            gap: 'spacing.gap.modules',
            background: 'color.surface.base',
            padding: 'spacing.padding.none',
          },
          style: { marginLeft: 'auto', alignItems: 'center' },
        },
      ),
      inst('SiteButton', {
        id: 'inst-zaoly-landing-nav-cta',
        overrides: {
          props: { children: 'Open editor' },
          tokenBindings: PRIMARY_BUTTON_BINDINGS,
        },
      }),
    ],
    {
      tokenBindings: NAV_BINDINGS,
      style: {
        width: '100%',
        alignItems: 'center',
      },
      // Wave C — stack on mobile when wrap alone is not enough
      breakpoints: {
        mobile: { props: { direction: 'column', gap: 'sm' } },
      },
    },
  )
}

/** Full-bleed inverse hero — brand first + hero artboard image. */
function heroPattern(): SceneNode {
  return layout(
    'SiteStack',
    ZAOLY_DEFAULT_LANDING_HERO_STAGE_ID,
    { direction: 'column', gap: 'lg' },
    [
      layout(
        'SiteGrid',
        'pattern-zaoly-landing-hero-grid',
        { columns: '2', gap: 'lg' },
        [
          layout(
            'SiteStack',
            'pattern-zaoly-landing-hero',
            { direction: 'column', gap: 'md' },
            [
              inst('SiteText', {
                id: 'inst-zaoly-landing-brand',
                overrides: {
                  props: { role: 'title', children: paths.brandLabel },
                  tokenBindings: INVERSE_BRAND_BINDINGS,
                },
              }),
              inst('SiteText', {
                id: 'inst-zaoly-landing-headline',
                overrides: {
                  props: {
                    role: 'title',
                    children: 'Compose product pages from kit atoms and tokens',
                  },
                  tokenBindings: INVERSE_HEADLINE_BINDINGS,
                },
              }),
              inst('SiteText', {
                id: 'inst-zaoly-landing-lede',
                overrides: {
                  props: {
                    role: 'body',
                    children:
                      'Every surface, type role, and action on this seed binds the local Zaoly starter pack.',
                  },
                  tokenBindings: INVERSE_MUTED_BINDINGS,
                },
              }),
              layout(
                'SiteStack',
                'pattern-zaoly-landing-hero-ctas',
                { direction: 'row', gap: 'md' },
                [
                  inst('SiteButton', {
                    id: 'inst-zaoly-landing-hero-start',
                    overrides: {
                      props: { children: 'Start composing' },
                      tokenBindings: PRIMARY_BUTTON_BINDINGS,
                    },
                  }),
                  inst('SiteButton', {
                    id: 'inst-zaoly-landing-hero-tokens',
                    overrides: {
                      props: { children: 'Browse tokens' },
                      tokenBindings: INVERSE_GHOST_BUTTON_BINDINGS,
                    },
                  }),
                ],
                {
                  tokenBindings: {
                    gap: 'spacing.gap.modules',
                    background: 'color.surface.inverse',
                    padding: 'spacing.padding.none',
                    marginTop: 'spacing.padding.sm',
                  },
                  style: { flexWrap: 'wrap' },
                },
              ),
            ],
            {
              tokenBindings: INVERSE_SURFACE_BINDINGS,
              style: {
                width: '100%',
                justifyContent: 'center',
              },
            },
          ),
          layout(
            'SiteStack',
            'pattern-zaoly-landing-hero-media',
            { direction: 'column', gap: 'none' },
            [
              mediaImage(
                ZAOLY_DEFAULT_LANDING_HERO_ART_ID,
                paths.landing.assets.heroArtboard,
                'Zaoly editor artboard illustration',
                {
                  style: { objectFit: 'contain' },
                  tokenBindings: { padding: 'spacing.padding.lg' },
                },
              ),
            ],
            {
              tokenBindings: {
                gap: 'spacing.gap.none',
                background: 'color.surface.muted',
                radius: 'radius.surface',
                shadow: 'shadow.elevation.lg',
                padding: 'spacing.padding.none',
                minHeight: 'size.media.lg',
              },
              style: {
                width: '100%',
                overflow: 'hidden',
                alignSelf: 'stretch',
              },
            },
          ),
        ],
        {
          tokenBindings: {
            gap: 'spacing.gap.section',
            background: 'color.surface.inverse',
            padding: 'spacing.padding.none',
            maxWidth: 'size.container.lg',
          },
          style: {
            width: '100%',
            alignItems: 'stretch',
          },
        },
      ),
    ],
    {
      tokenBindings: {
        ...INVERSE_BAND_BINDINGS,
        minHeight: 'size.block.hero',
      },
      style: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
      },
    },
  )
}

/** Edge-to-edge product visuals — Token Studio + Kit Playground. */
function showcasePattern(): SceneNode {
  return layout(
    'SiteGrid',
    'pattern-zaoly-landing-showcase',
    { columns: '2', gap: 'none' },
    [
      layout(
        'SiteStack',
        'pattern-zaoly-landing-showcase-tokens',
        { direction: 'column', gap: 'none' },
        [
          mediaImage(
            'inst-zaoly-landing-showcase-media',
            paths.landing.assets.tokenStudioApp,
            'Zaoly Token Studio with local pack color tokens',
          ),
        ],
        {
          tokenBindings: {
            gap: 'spacing.gap.none',
            background: 'color.surface.muted',
            padding: 'spacing.padding.none',
            minHeight: 'size.media.lg',
          },
          style: { width: '100%', overflow: 'hidden' },
        },
      ),
      layout(
        'SiteStack',
        'pattern-zaoly-landing-showcase-kit',
        { direction: 'column', gap: 'none' },
        [
          mediaImage(
            'inst-zaoly-landing-showcase-kit',
            paths.landing.assets.kitPlaygroundApp,
            'Zaoly Kit Playground component preview',
          ),
        ],
        {
          tokenBindings: {
            gap: 'spacing.gap.none',
            background: 'color.surface.elevated',
            padding: 'spacing.padding.none',
            minHeight: 'size.media.lg',
          },
          style: { width: '100%', overflow: 'hidden' },
        },
      ),
    ],
    {
      tokenBindings: {
        gap: 'spacing.gap.none',
        background: 'color.surface.canvas',
        padding: 'spacing.padding.none',
      },
      style: { width: '100%' },
    },
  )
}

function featuresPattern(): SceneNode {
  return layout(
    'SiteStack',
    'pattern-zaoly-landing-features',
    { direction: 'column', gap: 'lg' },
    [
      layout(
        'SiteStack',
        'pattern-zaoly-landing-features-intro',
        { direction: 'column', gap: 'sm' },
        [
          inst('SiteText', {
            id: 'inst-zaoly-landing-features-kicker',
            overrides: {
              props: { role: 'label', children: 'System' },
              tokenBindings: {
                ...LABEL_BINDINGS,
                color: 'color.brand.primary',
              },
            },
          }),
          inst('SiteText', {
            id: 'inst-zaoly-landing-features-title',
            overrides: {
              props: { role: 'title', children: 'Built from the system' },
              tokenBindings: {
                ...DEFAULT_HEADLINE_TYPE_BINDINGS,
                fontFamily: 'typography.heading.h2',
                fontSize: 'typography.heading.h2',
                fontWeight: 'typography.heading.h2',
                lineHeight: 'typography.heading.h2',
                letterSpacing: 'typography.heading.h2',
                color: 'color.ink',
              },
            },
          }),
          inst('SiteText', {
            id: 'inst-zaoly-landing-features-lede',
            overrides: {
              props: {
                role: 'body',
                children: 'Three layers you can edit on the canvas — atoms, tokens, and masters.',
              },
              tokenBindings: MUTED_BINDINGS,
            },
          }),
        ],
        {
          tokenBindings: {
            gap: 'spacing.gap.tight',
            background: 'color.surface.canvas',
            padding: 'spacing.padding.none',
            maxWidth: 'size.container.sm',
          },
        },
      ),
      layout(
        'SiteGrid',
        'pattern-zaoly-landing-features-grid',
        { columns: '3', gap: 'md' },
        [
          compositionInst('LandingCard', {
            id: 'pattern-zaoly-landing-card-atoms',
            name: 'Atoms',
            variantId: ZAOLY_LANDING_CARD_VARIANT_IDS.atoms,
          }),
          compositionInst('LandingCard', {
            id: 'pattern-zaoly-landing-card-tokens',
            name: 'Tokens',
            variantId: ZAOLY_LANDING_CARD_VARIANT_IDS.tokens,
          }),
          compositionInst('LandingCard', {
            id: 'pattern-zaoly-landing-card-edit',
            name: 'Editable',
            variantId: ZAOLY_LANDING_CARD_VARIANT_IDS.editable,
          }),
        ],
        {
          tokenBindings: {
            gap: 'spacing.gap.modules',
            background: 'color.surface.canvas',
            padding: 'spacing.padding.none',
          },
          style: { width: '100%' },
        },
      ),
    ],
    {
      tokenBindings: PAGE_BINDINGS,
      style: { width: '100%' },
    },
  )
}

/** Full-width kit assembly band between features and CTA. */
function kitBandPattern(): SceneNode {
  return layout(
    'SiteStack',
    'pattern-zaoly-landing-kit-band',
    { direction: 'column', gap: 'md' },
    [
      layout(
        'SiteStack',
        'pattern-zaoly-landing-kit-band-copy',
        { direction: 'column', gap: 'sm' },
        [
          inst('SiteText', {
            id: 'inst-zaoly-landing-kit-band-kicker',
            overrides: {
              props: { role: 'label', children: 'Kit' },
              tokenBindings: {
                ...LABEL_BINDINGS,
                color: 'color.brand.primary',
              },
            },
          }),
          inst('SiteText', {
            id: 'inst-zaoly-landing-kit-band-title',
            overrides: {
              props: { role: 'title', children: 'Assemble once, reuse everywhere' },
              tokenBindings: {
                ...DEFAULT_HEADLINE_TYPE_BINDINGS,
                fontFamily: 'typography.heading.h2',
                fontSize: 'typography.heading.h2',
                fontWeight: 'typography.heading.h2',
                lineHeight: 'typography.heading.h2',
                letterSpacing: 'typography.heading.h2',
                color: 'color.ink',
              },
            },
          }),
        ],
        {
          tokenBindings: {
            gap: 'spacing.gap.tight',
            background: 'color.surface.muted',
            paddingInline: 'spacing.padding.xl',
            maxWidth: 'size.container.sm',
          },
        },
      ),
      layout(
        'SiteStack',
        'pattern-zaoly-landing-kit-band-media',
        { direction: 'column', gap: 'none' },
        [
          mediaImage(
            'inst-zaoly-landing-kit-band-art',
            paths.landing.assets.kitAssembly,
            'Zaoly Site Kit atom assembly diagram',
            {
              style: { objectFit: 'contain' },
              tokenBindings: { padding: 'spacing.padding.xl' },
            },
          ),
        ],
        {
          tokenBindings: {
            gap: 'spacing.gap.none',
            background: 'color.surface.elevated',
            shadow: 'shadow.elevation.sm',
            padding: 'spacing.padding.none',
            minHeight: 'size.media.md',
            maxHeight: 'size.media.lgMax',
          },
          style: {
            width: '100%',
            overflow: 'hidden',
          },
        },
      ),
    ],
    {
      tokenBindings: {
        ...MUTED_SURFACE_BINDINGS,
        paddingTop: 'spacing.padding.page',
      },
      style: { width: '100%' },
    },
  )
}

function ctaBandPattern(): SceneNode {
  return layout(
    'SiteStack',
    'pattern-zaoly-landing-cta',
    { direction: 'column', gap: 'md' },
    [
      inst('SiteText', {
        id: 'inst-zaoly-landing-cta-kicker',
        overrides: {
          props: { role: 'label', children: 'Next' },
          tokenBindings: {
            ...LABEL_BINDINGS,
            color: 'color.action.accent',
          },
        },
      }),
      inst('SiteText', {
        id: 'inst-zaoly-landing-cta-message',
        overrides: {
          props: {
            role: 'title',
            children: 'Replace this seed with your product story.',
          },
          tokenBindings: INVERSE_HEADLINE_BINDINGS,
        },
      }),
      inst('SiteText', {
        id: 'inst-zaoly-landing-cta-lede',
        overrides: {
          props: {
            role: 'body',
            children: 'Keep the structure, swap the copy, retune the pack in Token Studio.',
          },
          tokenBindings: INVERSE_MUTED_BINDINGS,
        },
      }),
      inst('SiteButton', {
        id: 'inst-zaoly-landing-cta-action',
        overrides: {
          props: { children: 'Continue in editor' },
          tokenBindings: PRIMARY_BUTTON_BINDINGS,
        },
      }),
    ],
    {
      tokenBindings: INVERSE_BAND_BINDINGS,
      style: {
        width: '100%',
        alignItems: 'flex-start',
        maxWidth: '100%',
      },
    },
  )
}

function footerPattern(): SceneNode {
  return layout(
    'SiteStack',
    'pattern-zaoly-landing-footer',
    { direction: 'row', gap: 'md', wrap: true },
    [
      inst('SiteText', {
        id: 'inst-zaoly-landing-footer-brand',
        overrides: {
          props: { role: 'label', children: paths.brandLabel },
          tokenBindings: {
            ...LABEL_BINDINGS,
            color: 'color.brand.primary',
          },
        },
      }),
      inst('SiteText', {
        id: 'inst-zaoly-landing-footer-copy',
        overrides: {
          props: {
            role: 'label',
            children: 'Local pack · Site Kit atoms · editable seed',
          },
          tokenBindings: MUTED_BINDINGS,
        },
      }),
    ],
    {
      tokenBindings: FOOTER_BINDINGS,
      style: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
      },
      breakpoints: {
        mobile: { props: { direction: 'column', gap: 'sm' } },
      },
    },
  )
}

/** Landing page root — Instances of starter section Masters. */
export function zaolyDefaultLandingPageRoot(): SceneNode {
  return layout(
    'SiteStack',
    'page-zaoly-landing-root',
    { direction: 'column', gap: 'none' },
    [
      compositionInst('LandingNav', {
        id: ZAOLY_DEFAULT_LANDING_NAV_ID,
        name: 'Nav',
      }),
      compositionInst('LandingHero', {
        id: ZAOLY_DEFAULT_LANDING_HERO_STAGE_ID,
        name: 'Hero',
      }),
      compositionInst('LandingShowcase', {
        id: 'pattern-zaoly-landing-showcase',
        name: 'Showcase',
      }),
      compositionInst('LandingFeatures', {
        id: 'pattern-zaoly-landing-features',
        name: 'Features',
      }),
      compositionInst('LandingKitBand', {
        id: 'pattern-zaoly-landing-kit-band',
        name: 'Kit band',
      }),
      compositionInst('LandingCta', {
        id: 'pattern-zaoly-landing-cta',
        name: 'CTA',
      }),
      compositionInst('LandingFooter', {
        id: 'pattern-zaoly-landing-footer',
        name: 'Footer',
      }),
    ],
    {
      tokenBindings: {
        gap: 'spacing.gap.none',
        background: 'color.surface.canvas',
        padding: 'spacing.padding.none',
      },
      style: { width: '100%', minHeight: '100%' },
    },
  )
}

export function zaolyLandingSectionMasters(): SceneMaster[] {
  const cardAtoms = featureCard(
    'mroot-LandingCard',
    'Atoms',
    'Site Kit only',
    'Text, Button, Link, Badge, Image, and layout Stacks — no custom chrome on this page.',
    {
      src: paths.landing.assets.kitAssembly,
      alt: 'Zaoly kit atom assembly illustration',
    },
  )
  const cardTokens = featureCard(
    'mroot-LandingCard',
    'Tokens',
    'Starter pack paths',
    'Brand, action, ink, surface, spacing, type, and elevation resolve from the local Zaoly pack.',
    {
      src: paths.landing.assets.tokenStudioApp,
      alt: 'Token Studio color tokens preview',
    },
  )
  const cardEditable = featureCard(
    'mroot-LandingCard',
    'Editable',
    'Inspect & override',
    'Select any Instance to change copy or bindings; Masters stay the Site Kit palette seeds.',
    {
      src: paths.landing.assets.kitPlaygroundApp,
      alt: 'Kit Playground editable component preview',
    },
  )
  return [
    compositionMaster('LandingCard', 'Card', structuredClone(cardAtoms), [
      {
        id: ZAOLY_LANDING_CARD_VARIANT_IDS.atoms,
        name: 'Atoms',
        root: structuredClone(cardAtoms),
      },
      {
        id: ZAOLY_LANDING_CARD_VARIANT_IDS.tokens,
        name: 'Tokens',
        root: structuredClone(cardTokens),
      },
      {
        id: ZAOLY_LANDING_CARD_VARIANT_IDS.editable,
        name: 'Editable',
        root: structuredClone(cardEditable),
      },
    ]),
    compositionMaster('LandingNav', 'Nav', navPattern()),
    compositionMaster('LandingHero', 'Hero', heroPattern()),
    compositionMaster('LandingShowcase', 'Showcase', showcasePattern()),
    compositionMaster('LandingFeatures', 'Features', featuresPattern()),
    compositionMaster('LandingKitBand', 'Kit band', kitBandPattern()),
    compositionMaster('LandingCta', 'CTA', ctaBandPattern()),
    compositionMaster('LandingFooter', 'Footer', footerPattern()),
  ]
}

/**
 * Prefill section Masters (list only).
 * Existing sourceKey wins the root, but missing responsive defaults are soft-filled.
 */
export function seedZaolyLandingSectionMasters(scene: CompositionScene): CompositionScene {
  const built = zaolyLandingSectionMasters()
  let masters = [...(scene.masters ?? [])]
  const additions: SceneMaster[] = []
  let softChanged = false
  for (const master of built) {
    const key = master.sourceKey?.trim()
    if (!key) continue
    const existing = findMasterBySourceKey(masters, key)
    if (existing) {
      if (!siteKitNodeNeedsResponsiveDefaults(existing.root)) continue
      const nextRoot = applySiteKitResponsiveDefaults(existing.root)
      if (nextRoot === existing.root) continue
      masters = masters.map((m) =>
        m.id === existing.id ? { ...m, root: nextRoot } : m,
      )
      softChanged = true
      continue
    }
    if (findMasterBySourceKey(additions, key)) continue
    if (masters.some((m) => m.id === master.id) || additions.some((m) => m.id === master.id)) {
      continue
    }
    additions.push(master)
  }
  if (!additions.length && !softChanged) return scene
  return { ...scene, masters: [...masters, ...additions] }
}

/**
 * Default editor seed for Zaoly standalone / new Collections.
 * Deposit + Vaillant curated landings stay Collection-specific exceptions.
 */
export function createZaolyDefaultLandingScene(
  platformProjectId?: string | null,
): CompositionScene {
  const root = zaolyDefaultLandingPageRoot()

  return {
    id: ZAOLY_DEFAULT_LANDING_SCENE_ID,
    name: ZAOLY_DEFAULT_LANDING_SCENE_NAME,
    version: 1,
    platformProjectId: platformProjectId ?? null,
    updatedAt: new Date().toISOString(),
    masters: [...paletteMasters(), ...zaolyLandingSectionMasters()],
    pages: [
      {
        id: ZAOLY_DEFAULT_LANDING_PAGE_ID,
        name: 'Landing',
        root,
        frame: { x: 0, y: 0 },
      },
    ],
    activePageId: ZAOLY_DEFAULT_LANDING_PAGE_ID,
    root,
  }
}

/**
 * Soft-upgrade empty Untitled blanks and older Zaoly Landing seeds that
 * predate section Masters (or media mosaic / layout padding tokenBindings).
 */
export function shouldReseedZaolyDefaultLanding(scene: CompositionScene): boolean {
  const children = scene.root.children ?? []
  const masters = scene.masters ?? []
  if (
    scene.name === 'Untitled' &&
    children.length === 0 &&
    masters.length === 0 &&
    (scene.pages?.length ?? 0) <= 1
  ) {
    return true
  }
  if (scene.name !== ZAOLY_DEFAULT_LANDING_SCENE_NAME) return false
  if ((scene.pages?.length ?? 0) !== 1) return false
  if (scene.pages?.[0]?.id !== ZAOLY_DEFAULT_LANDING_PAGE_ID) return false
  const navKey = zaolyLandingSectionSourceKey('LandingNav')
  const navMaster = findMasterBySourceKey(scene.masters, navKey)
  const nav = findNode(scene.root, ZAOLY_DEFAULT_LANDING_NAV_ID)
  if (!navMaster || nav?.type !== INSTANCE_TYPE || nav.instanceOf !== navMaster.id) {
    return true
  }
  const hero = findMasterBySourceKey(scene.masters, zaolyLandingSectionSourceKey('LandingHero'))
  if (!hero || !findNodeId(hero.root, ZAOLY_DEFAULT_LANDING_HERO_ART_ID)) return true
  if (!hasLayoutPaddingBinding(navMaster.root)) return true
  // Responsive kit defaults on section Masters (row wrap + mobile column, grids, …)
  if (siteKitNodeNeedsResponsiveDefaults(navMaster.root)) return true
  if (hero && siteKitNodeNeedsResponsiveDefaults(hero.root)) return true
  return false
}
