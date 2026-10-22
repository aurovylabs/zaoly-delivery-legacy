import type { CompositionScene, SceneInstanceOverrides, SceneMaster, SceneNode } from '@zaoly/contracts'
import {
  DEFAULT_BODY_TYPE_BINDINGS,
  DEFAULT_HEADLINE_TYPE_BINDINGS,
  DEFAULT_SITE_BUTTON_BINDINGS,
  DEFAULT_SITE_FIELD_BINDINGS,
  DEFAULT_SITE_LINK_BINDINGS,
} from '../inspect/token-catalog'
import { paths } from '../paths'
import { EDITOR_BREAKPOINT_WIDTHS } from './breakpoints'
import { INSTANCE_TYPE } from './expand-instances'
import { cloneSceneNodeWithNewIds, defaultChildForType } from './ops'
import { BOARD_PAGE_GAP } from './scene-board'
import { SITE_KIT_PALETTE_IDS, type SiteKitPaletteId } from './site-kit-palette'

/** Stable scene id for Zaoly Deposit web-system landing (Layer-1 token pack paths). */
export const DEPOSIT_LANDING_SCENE_ID = 'scene-deposit-landing'
export const DEPOSIT_LANDING_PAGE_ID = 'page-deposit-landing'
export const DEPOSIT_STUDIO_PAGE_ID = 'page-deposit-studio'
export const DEPOSIT_CONTACT_PAGE_ID = 'page-deposit-contact'
export const DEPOSIT_LANDING_SCENE_NAME = 'Zaoly Deposit Landing'

type LayoutKind = 'SiteStack' | 'SiteContainer' | 'SiteGrid'

const DEPOSIT_PAGE_BINDINGS: Record<string, string> = {
  gap: 'spacing.static.4',
  background: 'color.background',
}

const DEPOSIT_SURFACE_BINDINGS: Record<string, string> = {
  gap: 'spacing.static.4',
  background: 'color.surface.elevated',
  radius: 'radius.panel',
}

const DEPOSIT_SURFACE_BASE_BINDINGS: Record<string, string> = {
  gap: 'spacing.static.4',
  background: 'color.surface.base',
  radius: 'radius.panel',
}

const DEPOSIT_TITLE_BINDINGS: Record<string, string> = {
  ...DEFAULT_HEADLINE_TYPE_BINDINGS,
  color: 'color.ink',
}

const DEPOSIT_BODY_BINDINGS: Record<string, string> = {
  ...DEFAULT_BODY_TYPE_BINDINGS,
  color: 'color.ink',
}

const DEPOSIT_MUTED_BINDINGS: Record<string, string> = {
  ...DEFAULT_BODY_TYPE_BINDINGS,
  color: 'color.muted',
}

const DEPOSIT_BUTTON_BINDINGS: Record<string, string> = {
  ...DEFAULT_SITE_BUTTON_BINDINGS,
  background: 'color.action.primary',
  color: 'color.brand.white',
}

const DEPOSIT_GHOST_BUTTON_BINDINGS: Record<string, string> = {
  ...DEPOSIT_BUTTON_BINDINGS,
  background: 'color.surface.raised',
  color: 'color.ink',
}

const DEPOSIT_LINK_BINDINGS: Record<string, string> = {
  ...DEFAULT_SITE_LINK_BINDINGS,
  color: 'color.action.primary',
}

const DEPOSIT_FIELD_BINDINGS: Record<string, string> = {
  ...DEFAULT_SITE_FIELD_BINDINGS,
  borderColor: 'color.line',
  background: 'color.field',
  color: 'color.ink',
}

const DEPOSIT_DANGER_BUTTON_BINDINGS: Record<string, string> = {
  ...DEPOSIT_BUTTON_BINDINGS,
  background: 'color.status.danger',
  color: 'color.brand.white',
}

function demoMasterId(sourceKey: SiteKitPaletteId): string {
  return `master-${sourceKey}`
}

function paletteMasters(): SceneMaster[] {
  return SITE_KIT_PALETTE_IDS.map((type) => {
    const root = cloneSceneNodeWithNewIds(defaultChildForType(type))
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

function layout(
  type: LayoutKind,
  id: string,
  props: Record<string, unknown>,
  children: SceneNode[],
  opts?: {
    style?: SceneNode['style']
    tokenBindings?: Record<string, string>
  },
): SceneNode {
  return {
    id,
    type,
    props,
    tokenBindings: opts?.tokenBindings ?? DEPOSIT_PAGE_BINDINGS,
    ...(opts?.style ? { style: opts.style } : {}),
    children,
  }
}

function featureCard(id: string, title: string, body: string): SceneNode {
  return layout(
    'SiteStack',
    id,
    { direction: 'column', gap: 'sm' },
    [
      inst('SiteText', {
        id: `${id}-title`,
        overrides: {
          props: { role: 'title', children: title },
          tokenBindings: DEPOSIT_TITLE_BINDINGS,
        },
      }),
      inst('SiteText', {
        id: `${id}-body`,
        overrides: {
          props: { role: 'body', children: body },
          tokenBindings: DEPOSIT_MUTED_BINDINGS,
        },
      }),
    ],
    {
      tokenBindings: DEPOSIT_SURFACE_BINDINGS,
      style: {
        padding: '1.25rem',
        minWidth: '14rem',
        flex: '1 1 14rem',
      },
    },
  )
}

function statCell(id: string, value: string, label: string): SceneNode {
  return layout(
    'SiteStack',
    id,
    { direction: 'column', gap: 'sm' },
    [
      inst('SiteText', {
        id: `${id}-value`,
        overrides: {
          props: { role: 'title', children: value },
          tokenBindings: DEPOSIT_TITLE_BINDINGS,
        },
      }),
      inst('SiteText', {
        id: `${id}-label`,
        overrides: {
          props: { role: 'label', children: label },
          tokenBindings: DEPOSIT_MUTED_BINDINGS,
        },
      }),
    ],
    {
      tokenBindings: DEPOSIT_SURFACE_BINDINGS,
      style: { padding: '1rem', flex: '1 1 8rem' },
    },
  )
}

function depositHeaderPattern(): SceneNode {
  return layout(
    'SiteContainer',
    'pattern-deposit-header',
    { direction: 'row', gap: 'md' },
    [
      inst('SiteText', {
        id: 'inst-deposit-brand',
        overrides: {
          props: { role: 'title', children: 'Zaoly' },
          tokenBindings: DEPOSIT_TITLE_BINDINGS,
        },
      }),
      layout(
        'SiteStack',
        'pattern-deposit-header-actions',
        { direction: 'row', gap: 'sm' },
        [
          inst('SiteButton', {
            id: 'inst-deposit-docs',
            overrides: {
              props: { children: 'Docs' },
              tokenBindings: DEPOSIT_GHOST_BUTTON_BINDINGS,
            },
          }),
          inst('SiteButton', {
            id: 'inst-deposit-studio',
            overrides: {
              props: { children: 'Open studio' },
              tokenBindings: DEPOSIT_BUTTON_BINDINGS,
            },
          }),
        ],
        {
          tokenBindings: { gap: 'spacing.static.3', background: 'color.background' },
          style: { marginLeft: 'auto' },
        },
      ),
    ],
    {
      tokenBindings: {
        gap: 'spacing.static.3',
        background: 'color.background',
        borderColor: 'color.line',
      },
      style: {
        width: '100%',
        padding: '0.75rem 1.5rem',
        alignItems: 'center',
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid',
      },
    },
  )
}

function depositStatsPattern(): SceneNode {
  return layout(
    'SiteGrid',
    'pattern-deposit-stats',
    { columns: '3', gap: 'md' },
    [
      statCell('pattern-deposit-stat-leaves', '140', 'Deposit leaves'),
      statCell('pattern-deposit-stat-themes', '2', 'Theme packs'),
      statCell('pattern-deposit-stat-layers', '3', 'Token layers'),
    ],
    {
      tokenBindings: { gap: 'spacing.static.4', background: 'color.background' },
      style: { width: '100%' },
    },
  )
}

function depositEditorialPattern(): SceneNode {
  return layout(
    'SiteGrid',
    'pattern-deposit-editorial',
    { columns: '2', gap: 'lg' },
    [
      layout(
        'SiteStack',
        'pattern-deposit-editorial-media',
        { direction: 'column', gap: 'sm' },
        [
          inst('SiteImage', {
            id: 'inst-deposit-editorial-image',
            overrides: {
              props: {
                src: paths.imagePlaceholderUrl,
                alt: 'Design system preview',
              },
            },
          }),
          inst('SiteText', {
            id: 'inst-deposit-editorial-caption',
            overrides: {
              props: { role: 'label', children: 'Layer 1 consume · token pack active' },
              tokenBindings: DEPOSIT_MUTED_BINDINGS,
            },
          }),
        ],
        { tokenBindings: { gap: 'spacing.static.3', background: 'color.background' } },
      ),
      layout(
        'SiteStack',
        'pattern-deposit-editorial-copy',
        { direction: 'column', gap: 'md' },
        [
          inst('SiteBadge', {
            id: 'inst-deposit-editorial-badge',
            overrides: {
              props: { children: 'Web system' },
              tokenBindings: {
                ...DEPOSIT_BODY_BINDINGS,
                background: 'color.action.accent',
                color: 'color.background',
              },
            },
          }),
          inst('SiteText', {
            id: 'inst-deposit-editorial-title',
            overrides: {
              props: { role: 'title', children: 'From Storybook proof to Collection canvas' },
              tokenBindings: DEPOSIT_TITLE_BINDINGS,
            },
          }),
          inst('SiteText', {
            id: 'inst-deposit-editorial-body',
            overrides: {
              props: {
                role: 'body',
                children:
                  'Landing and Studio pages mirror Pages/WebSystem in structure. Every fill binds a deposit path — inspect any node to verify typography, surface, and action tokens.',
              },
              tokenBindings: DEPOSIT_MUTED_BINDINGS,
            },
          }),
          inst('SiteLink', {
            id: 'inst-deposit-editorial-link',
            overrides: {
              props: { children: 'View token map', href: '#' },
              tokenBindings: DEPOSIT_LINK_BINDINGS,
            },
          }),
        ],
        { tokenBindings: { gap: 'spacing.static.4', background: 'color.background' } },
      ),
    ],
    {
      tokenBindings: { gap: 'spacing.static.5', background: 'color.background' },
      style: { width: '100%' },
    },
  )
}

function depositFooterPattern(): SceneNode {
  return layout(
    'SiteContainer',
    'pattern-deposit-footer',
    { direction: 'row', gap: 'md' },
    [
      inst('SiteText', {
        id: 'inst-deposit-footer-copy',
        overrides: {
          props: { role: 'label', children: 'Zaoly Deposit · CREATION Site Kit' },
          tokenBindings: DEPOSIT_MUTED_BINDINGS,
        },
      }),
      layout(
        'SiteStack',
        'pattern-deposit-footer-links',
        { direction: 'row', gap: 'md' },
        [
          inst('SiteLink', {
            id: 'inst-deposit-footer-tokens',
            overrides: {
              props: { children: 'Tokens', href: '#' },
              tokenBindings: DEPOSIT_LINK_BINDINGS,
            },
          }),
          inst('SiteLink', {
            id: 'inst-deposit-footer-storybook',
            overrides: {
              props: { children: 'Storybook', href: '#' },
              tokenBindings: DEPOSIT_LINK_BINDINGS,
            },
          }),
          inst('SiteButton', {
            id: 'inst-deposit-footer-cta',
            overrides: {
              props: { children: 'Contact' },
              tokenBindings: DEPOSIT_BUTTON_BINDINGS,
            },
          }),
        ],
        {
          tokenBindings: { gap: 'spacing.static.4', background: 'color.background' },
          style: { marginLeft: 'auto', alignItems: 'center' },
        },
      ),
    ],
    {
      tokenBindings: {
        gap: 'spacing.static.4',
        background: 'color.background',
        borderColor: 'color.line',
      },
      style: {
        width: '100%',
        padding: '1.5rem',
        borderTopWidth: '1px',
        borderTopStyle: 'solid',
        alignItems: 'center',
      },
    },
  )
}

/**
 * Storybook `Pages/WebSystem/Landing` proof as Site Kit artboard —
 * Token pack deposit paths only (no hex / Geist / Layer-0 chrome vars).
 */
export function depositLandingPageRoot(): SceneNode {
  return layout(
    'SiteStack',
    'page-deposit-landing-root',
    { direction: 'column', gap: 'md' },
    [
      depositHeaderPattern(),
      layout(
        'SiteStack',
        'pattern-deposit-main',
        { direction: 'column', gap: 'lg' },
        [
          layout(
            'SiteStack',
            'pattern-deposit-hero-copy',
            { direction: 'column', gap: 'sm' },
            [
              inst('SiteText', {
                id: 'inst-deposit-kicker',
                overrides: {
                  props: { role: 'label', children: 'Deposit · Layer 1' },
                  tokenBindings: DEPOSIT_MUTED_BINDINGS,
                },
              }),
              inst('SiteText', {
                id: 'inst-deposit-headline',
                overrides: {
                  props: {
                    role: 'title',
                    children: 'One surface system for product pages',
                  },
                  tokenBindings: DEPOSIT_TITLE_BINDINGS,
                },
              }),
              inst('SiteText', {
                id: 'inst-deposit-lede',
                overrides: {
                  props: {
                    role: 'body',
                    children:
                      'Background, elevated surface, primary action, and type resolve from the Zaoly Deposit active-pack — same Collection as deposit guideline gl-msrxlt4u.',
                  },
                  tokenBindings: DEPOSIT_MUTED_BINDINGS,
                },
              }),
            ],
            {
              tokenBindings: { gap: 'spacing.static.3', background: 'color.background' },
            },
          ),
          layout(
            'SiteStack',
            'pattern-deposit-ctas',
            { direction: 'row', gap: 'md' },
            [
              inst('SiteButton', {
                id: 'inst-deposit-start',
                overrides: {
                  props: { children: 'Start' },
                  tokenBindings: DEPOSIT_BUTTON_BINDINGS,
                },
              }),
              inst('SiteButton', {
                id: 'inst-deposit-tokens',
                overrides: {
                  props: { children: 'Browse tokens' },
                  tokenBindings: DEPOSIT_GHOST_BUTTON_BINDINGS,
                },
              }),
            ],
            {
              tokenBindings: { gap: 'spacing.static.4', background: 'color.background' },
            },
          ),
          depositStatsPattern(),
          layout(
            'SiteGrid',
            'pattern-deposit-features',
            { columns: '3', gap: 'md' },
            [
              featureCard(
                'pattern-deposit-card-tokens',
                'Tokens',
                'Semantic brand token paths map Layer-0 chrome without hardcoding --bg0 / --primary on the canvas.',
              ),
              featureCard(
                'pattern-deposit-card-elevation',
                'Elevation',
                'Cards bind color.surface.elevated — proof parity with Storybook Landing, deposit vocabulary only.',
              ),
              featureCard(
                'pattern-deposit-card-type',
                'Type',
                'Headlines and body use typography.heading.h1 / typography.body.family (Noto Layer-0 stacks).',
              ),
            ],
            {
              tokenBindings: { gap: 'spacing.static.4', background: 'color.background' },
              style: { width: '100%' },
            },
          ),
          inst('SiteDivider', { id: 'inst-deposit-div-editorial' }),
          depositEditorialPattern(),
        ],
        {
          tokenBindings: DEPOSIT_PAGE_BINDINGS,
          style: {
            width: '100%',
            maxWidth: '48rem',
            marginLeft: 'auto',
            marginRight: 'auto',
            padding: '2rem 1.5rem',
          },
        },
      ),
      depositFooterPattern(),
    ],
    {
      tokenBindings: DEPOSIT_PAGE_BINDINGS,
      style: { width: '100%', minHeight: '100%' },
    },
  )
}

function navLink(id: string, label: string, active = false): SceneNode {
  return inst('SiteLink', {
    id,
    overrides: {
      props: { children: label, href: '#' },
      tokenBindings: active
        ? { ...DEPOSIT_LINK_BINDINGS, background: 'color.surface.raised', color: 'color.ink' }
        : DEPOSIT_MUTED_BINDINGS,
      style: active ? { padding: '0.5rem 0.75rem', borderRadius: '0.5rem' } : { padding: '0.5rem 0.75rem' },
    },
  })
}

/** Storybook `Pages/WebSystem/AppShell` — sidebar + quick-create card. */
export function depositStudioPageRoot(): SceneNode {
  return layout(
    'SiteGrid',
    'page-deposit-studio-root',
    { columns: '2', gap: 'none' },
    [
      layout(
        'SiteStack',
        'pattern-deposit-sidebar',
        { direction: 'column', gap: 'md' },
        [
          inst('SiteText', {
            id: 'inst-deposit-sidebar-brand',
            overrides: {
              props: { role: 'title', children: 'Studio' },
              tokenBindings: DEPOSIT_TITLE_BINDINGS,
            },
          }),
          layout(
            'SiteStack',
            'pattern-deposit-sidebar-nav',
            { direction: 'column', gap: 'sm' },
            [
              navLink('inst-deposit-nav-overview', 'Overview', true),
              navLink('inst-deposit-nav-collections', 'Collections'),
              navLink('inst-deposit-nav-settings', 'Settings'),
            ],
            { tokenBindings: { gap: 'spacing.static.2', background: 'color.surface.base' } },
          ),
        ],
        {
          tokenBindings: {
            gap: 'spacing.static.4',
            background: 'color.surface.base',
            borderColor: 'color.line',
          },
          style: {
            minWidth: '12rem',
            maxWidth: '15rem',
            padding: '1.25rem',
            borderRightWidth: '1px',
            borderRightStyle: 'solid',
            minHeight: '100%',
          },
        },
      ),
      layout(
        'SiteStack',
        'pattern-deposit-studio-main',
        { direction: 'column', gap: 'none' },
        [
          layout(
            'SiteContainer',
            'pattern-deposit-studio-toolbar',
            { direction: 'row', gap: 'md' },
            [
              inst('SiteText', {
                id: 'inst-deposit-studio-title',
                overrides: {
                  props: { role: 'title', children: 'Overview' },
                  tokenBindings: DEPOSIT_TITLE_BINDINGS,
                },
              }),
              inst('SiteButton', {
                id: 'inst-deposit-studio-new',
                overrides: {
                  props: { children: 'New' },
                  tokenBindings: DEPOSIT_BUTTON_BINDINGS,
                },
              }),
            ],
            {
              tokenBindings: {
                gap: 'spacing.static.3',
                background: 'color.surface.raised',
                borderColor: 'color.line',
              },
              style: {
                padding: '0.75rem 1.5rem',
                alignItems: 'center',
                borderBottomWidth: '1px',
                borderBottomStyle: 'solid',
              },
            },
          ),
          layout(
            'SiteStack',
            'pattern-deposit-studio-content',
            { direction: 'column', gap: 'md' },
            [
              layout(
                'SiteStack',
                'pattern-deposit-quick-create',
                { direction: 'column', gap: 'md' },
                [
                  inst('SiteText', {
                    id: 'inst-deposit-quick-create-title',
                    overrides: {
                      props: { role: 'title', children: 'Quick create' },
                      tokenBindings: DEPOSIT_TITLE_BINDINGS,
                    },
                  }),
                  inst('SiteInput', {
                    id: 'inst-deposit-quick-create-name',
                    overrides: {
                      props: { placeholder: 'Collection name' },
                      tokenBindings: DEPOSIT_FIELD_BINDINGS,
                    },
                  }),
                  layout(
                    'SiteStack',
                    'pattern-deposit-quick-create-actions',
                    { direction: 'row', gap: 'sm' },
                    [
                      inst('SiteButton', {
                        id: 'inst-deposit-quick-create-submit',
                        overrides: {
                          props: { children: 'Create' },
                          tokenBindings: DEPOSIT_BUTTON_BINDINGS,
                        },
                      }),
                      inst('SiteButton', {
                        id: 'inst-deposit-quick-create-cancel',
                        overrides: {
                          props: { children: 'Cancel' },
                          tokenBindings: DEPOSIT_GHOST_BUTTON_BINDINGS,
                        },
                      }),
                    ],
                    {
                      tokenBindings: { gap: 'spacing.static.3', background: 'color.surface.elevated' },
                    },
                  ),
                ],
                {
                  tokenBindings: DEPOSIT_SURFACE_BINDINGS,
                  style: { padding: '1.25rem', maxWidth: '28rem' },
                },
              ),
              layout(
                'SiteStack',
                'pattern-deposit-secondary-band',
                { direction: 'row', gap: 'md' },
                [
                  inst('SiteText', {
                    id: 'inst-deposit-secondary-copy',
                    overrides: {
                      props: {
                        role: 'body',
                        children: 'Secondary surface · destructive sample:',
                      },
                      tokenBindings: DEPOSIT_BODY_BINDINGS,
                    },
                  }),
                  inst('SiteButton', {
                    id: 'inst-deposit-remove',
                    overrides: {
                      props: { children: 'Remove' },
                      tokenBindings: DEPOSIT_DANGER_BUTTON_BINDINGS,
                    },
                  }),
                ],
                {
                  tokenBindings: DEPOSIT_SURFACE_BASE_BINDINGS,
                  style: {
                    padding: '0.75rem 1rem',
                    maxWidth: '28rem',
                    alignItems: 'center',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                  },
                },
              ),
            ],
            {
              tokenBindings: DEPOSIT_PAGE_BINDINGS,
              style: { padding: '1.5rem', flex: 1 },
            },
          ),
        ],
        {
          tokenBindings: DEPOSIT_PAGE_BINDINGS,
          style: { minWidth: 0, minHeight: '100%' },
        },
      ),
    ],
    {
      tokenBindings: DEPOSIT_PAGE_BINDINGS,
      style: { width: '100%', minHeight: '100%' },
    },
  )
}

/** Lead-capture form — deposit field + action tokens. */
export function depositContactPageRoot(): SceneNode {
  return layout(
    'SiteStack',
    'page-deposit-contact-root',
    { direction: 'column', gap: 'lg' },
    [
      depositHeaderPattern(),
      layout(
        'SiteStack',
        'pattern-deposit-contact-form',
        { direction: 'column', gap: 'md' },
        [
          inst('SiteText', {
            id: 'inst-deposit-contact-title',
            overrides: {
              props: { role: 'title', children: 'Stay in touch' },
              tokenBindings: DEPOSIT_TITLE_BINDINGS,
            },
          }),
          inst('SiteText', {
            id: 'inst-deposit-contact-lede',
            overrides: {
              props: {
                role: 'body',
                children: 'Compact form built from Site Kit Masters with deposit field and action bindings.',
              },
              tokenBindings: DEPOSIT_MUTED_BINDINGS,
            },
          }),
          layout(
            'SiteGrid',
            'pattern-deposit-contact-fields',
            { columns: '2', gap: 'md' },
            [
              inst('SiteInput', {
                id: 'inst-deposit-contact-email',
                overrides: {
                  props: { placeholder: 'you@example.com' },
                  tokenBindings: DEPOSIT_FIELD_BINDINGS,
                },
              }),
              inst('SiteSelect', {
                id: 'inst-deposit-contact-interest',
                overrides: {
                  props: {
                    placeholder: 'Interest',
                    options: 'Design\nEngineering\nProduct',
                  },
                  tokenBindings: DEPOSIT_FIELD_BINDINGS,
                },
              }),
            ],
            { tokenBindings: { gap: 'spacing.static.4', background: 'color.background' } },
          ),
          inst('SiteTextarea', {
            id: 'inst-deposit-contact-message',
            overrides: {
              props: { placeholder: 'Tell us more' },
              tokenBindings: DEPOSIT_FIELD_BINDINGS,
            },
          }),
          inst('SiteCheckbox', {
            id: 'inst-deposit-contact-optin',
            overrides: {
              props: { children: 'Subscribe to updates' },
              tokenBindings: { ...DEPOSIT_BODY_BINDINGS, color: 'color.ink' },
            },
          }),
          layout(
            'SiteContainer',
            'pattern-deposit-contact-actions',
            { direction: 'row', gap: 'md' },
            [
              inst('SiteButton', {
                id: 'inst-deposit-contact-submit',
                overrides: {
                  props: { children: 'Send' },
                  tokenBindings: DEPOSIT_BUTTON_BINDINGS,
                },
              }),
              inst('SiteLink', {
                id: 'inst-deposit-contact-privacy',
                overrides: {
                  props: { children: 'Privacy policy', href: '#' },
                  tokenBindings: DEPOSIT_LINK_BINDINGS,
                },
              }),
            ],
            { tokenBindings: { gap: 'spacing.static.4', background: 'color.background' } },
          ),
        ],
        {
          tokenBindings: DEPOSIT_PAGE_BINDINGS,
          style: {
            width: '100%',
            maxWidth: '40rem',
            marginLeft: 'auto',
            marginRight: 'auto',
            padding: '2rem 1.5rem',
          },
        },
      ),
    ],
    {
      tokenBindings: DEPOSIT_PAGE_BINDINGS,
      style: { width: '100%', minHeight: '100%' },
    },
  )
}

/** True when persisted seed is still the original single-page landing (safe to auto-upgrade). */
export function shouldReseedDepositLanding(scene: CompositionScene): boolean {
  return (
    scene.name === DEPOSIT_LANDING_SCENE_NAME &&
    (scene.pages?.length ?? 0) === 1 &&
    scene.pages?.[0]?.id === DEPOSIT_LANDING_PAGE_ID
  )
}

/** Seed scene for Collection `paths.zaolyDepositPlatformProjectId` — Landing + Studio + Contact. */
export function createDepositLandingScene(
  platformProjectId: string = paths.zaolyDepositPlatformProjectId,
): CompositionScene {
  const landingRoot = depositLandingPageRoot()
  const studioRoot = depositStudioPageRoot()
  const contactRoot = depositContactPageRoot()
  const desktopWidth = EDITOR_BREAKPOINT_WIDTHS.desktop

  return {
    id: DEPOSIT_LANDING_SCENE_ID,
    name: DEPOSIT_LANDING_SCENE_NAME,
    version: 1,
    platformProjectId,
    updatedAt: new Date().toISOString(),
    masters: paletteMasters(),
    pages: [
      {
        id: DEPOSIT_LANDING_PAGE_ID,
        name: 'Landing',
        root: landingRoot,
        frame: { x: 0, y: 0 },
      },
      {
        id: DEPOSIT_STUDIO_PAGE_ID,
        name: 'Studio',
        root: studioRoot,
        frame: { x: desktopWidth + BOARD_PAGE_GAP, y: 0 },
      },
      {
        id: DEPOSIT_CONTACT_PAGE_ID,
        name: 'Contact',
        root: contactRoot,
        frame: { x: (desktopWidth + BOARD_PAGE_GAP) * 2, y: 0 },
      },
    ],
    activePageId: DEPOSIT_LANDING_PAGE_ID,
    root: landingRoot,
  }
}
