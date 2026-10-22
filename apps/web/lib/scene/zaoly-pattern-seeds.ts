/**
 * Canon library molecules → React / CompositionScene pattern seeds.
 * Source tags: ds-nav, ds-cta, ds-card, ds-section (Stencil archive).
 * Runtime SoT: Site Kit atoms + layout scaffolds (no WC rollback).
 * knowledge/canon-library-integration.md
 */
import type { SceneInstanceOverrides, SceneNode } from '@zaoly/contracts'
import { defaultSiteKitTokenBindings } from '../inspect/token-catalog'
import { INSTANCE_TYPE } from './expand-instances'
import {
  paletteMasterId,
  type SiteKitPaletteId,
} from './site-kit-palette'
import { applySiteKitResponsiveDefaults } from './site-kit-responsive'

type LayoutKind = 'SiteStack' | 'SiteContainer' | 'SiteGrid'

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
    instanceOf: paletteMasterId(sourceKey),
  }
  if (opts?.overrides) node.instanceOverrides = opts.overrides
  return node
}

function layout(
  type: LayoutKind,
  id: string,
  props: Record<string, unknown>,
  children: SceneNode[],
  style?: SceneNode['style'],
): SceneNode {
  return applySiteKitResponsiveDefaults({
    id,
    type,
    props,
    tokenBindings: defaultSiteKitTokenBindings(type),
    ...(style ? { style } : {}),
    children,
  })
}

/**
 * ds-nav → SiteContainer row: brand + links + primary CTA.
 * Select `pattern-zaoly-nav` → Save as Site Kit Pattern.
 */
export function zaolyNavPatternBlock(): SceneNode {
  return layout(
    'SiteContainer',
    'pattern-zaoly-nav',
    { direction: 'row', gap: 'md' },
    [
      inst('SiteText', {
        id: 'inst-zaoly-nav-brand',
        overrides: {
          props: { role: 'title', children: 'Zaoly' },
          tokenBindings: { color: 'color.brand.primary' },
        },
      }),
      layout(
        'SiteStack',
        'pattern-zaoly-nav-links',
        { direction: 'row', gap: 'md' },
        [
          inst('SiteLink', {
            id: 'inst-zaoly-nav-product',
            overrides: { props: { children: 'Product', href: '#product' } },
          }),
          inst('SiteLink', {
            id: 'inst-zaoly-nav-studio',
            overrides: { props: { children: 'Studio', href: '#studio' } },
          }),
          inst('SiteLink', {
            id: 'inst-zaoly-nav-how',
            overrides: { props: { children: 'How it works', href: '#how' } },
          }),
          inst('SiteLink', {
            id: 'inst-zaoly-nav-gallery',
            overrides: { props: { children: 'Gallery', href: '#gallery' } },
          }),
        ],
        { marginLeft: 'auto' },
      ),
      inst('SiteButton', {
        id: 'inst-zaoly-nav-start',
        overrides: { props: { children: 'Start' } },
      }),
    ],
    {
      width: '100%',
      padding: '1rem 1.5rem',
      alignItems: 'center',
      borderBottomWidth: '1px',
      borderBottomStyle: 'solid',
      borderBottomColor: 'rgba(30, 27, 23, 0.12)',
    },
  )
}

/**
 * ds-cta → message + action (primary). Radius 0 for Zaoly CD.
 * Select `pattern-zaoly-cta` → Save as Pattern.
 */
export function zaolyCtaPatternBlock(): SceneNode {
  return layout(
    'SiteStack',
    'pattern-zaoly-cta',
    { direction: 'row', gap: 'md' },
    [
      inst('SiteText', {
        id: 'inst-zaoly-cta-message',
        overrides: {
          props: { role: 'body', children: 'Ready when you are' },
        },
      }),
      inst('SiteButton', {
        id: 'inst-zaoly-cta-action',
        overrides: { props: { children: 'Continue' } },
      }),
    ],
    {
      width: '100%',
      maxWidth: '40rem',
      marginLeft: 'auto',
      marginRight: 'auto',
      padding: '1.5rem',
      alignItems: 'center',
      justifyContent: 'center',
      flexWrap: 'wrap',
      backgroundColor: 'rgba(31, 68, 255, 0.06)',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'rgba(31, 68, 255, 0.28)',
    },
  )
}

/**
 * ds-card → bordered surface with title, body, link (sharp edges).
 * Select `pattern-zaoly-card` → Save as Pattern.
 */
export function zaolyCardPatternBlock(): SceneNode {
  return layout(
    'SiteStack',
    'pattern-zaoly-card',
    { direction: 'column', gap: 'sm' },
    [
      inst('SiteBadge', {
        id: 'inst-zaoly-card-badge',
        overrides: { props: { children: 'Pattern' } },
      }),
      inst('SiteText', {
        id: 'inst-zaoly-card-title',
        overrides: {
          props: { role: 'title', children: 'Compose, don’t clone' },
        },
      }),
      inst('SiteText', {
        id: 'inst-zaoly-card-body',
        overrides: {
          props: {
            role: 'body',
            children:
              'Canon ds-card as a Site Kit stack — edit atoms in Inspect, save as a Collection Pattern.',
          },
        },
      }),
      inst('SiteLink', {
        id: 'inst-zaoly-card-link',
        overrides: { props: { children: 'Open studio', href: '#studio' } },
      }),
    ],
    {
      width: '100%',
      maxWidth: '22rem',
      padding: '1.25rem',
      backgroundColor: '#fbf6ec',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: '#c9bca1',
    },
  )
}

/**
 * ds-section → padded landmark with kicker + title + body.
 * Select `pattern-zaoly-section` → Save as Pattern.
 */
export function zaolySectionPatternBlock(): SceneNode {
  return layout(
    'SiteStack',
    'pattern-zaoly-section',
    { direction: 'column', gap: 'md' },
    [
      inst('SiteText', {
        id: 'inst-zaoly-section-kicker',
        overrides: {
          props: { role: 'label', children: 'Studio' },
          tokenBindings: { color: 'color.brand.primary' },
        },
      }),
      inst('SiteText', {
        id: 'inst-zaoly-section-title',
        overrides: {
          props: { role: 'title', children: 'Design that ships' },
        },
      }),
      inst('SiteText', {
        id: 'inst-zaoly-section-body',
        overrides: {
          props: {
            role: 'body',
            children:
              'Section landmark from the canon library — rebuilt as SiteStack + SiteText Instances.',
          },
        },
      }),
    ],
    {
      width: '100%',
      maxWidth: '72rem',
      marginLeft: 'auto',
      marginRight: 'auto',
      padding: '3rem 1.5rem',
    },
  )
}
