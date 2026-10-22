import type {
  CompositionScene,
  SceneInstanceOverrides,
  SceneMaster,
  SceneNode,
} from '@zaoly/contracts'
import { DEFAULT_BODY_TYPE_BINDINGS, DEFAULT_HEADLINE_TYPE_BINDINGS, defaultSiteKitTokenBindings } from '../inspect/token-catalog'
import { paths } from '../paths'
import { INSTANCE_TYPE } from './expand-instances'
import { defaultChildForType } from './ops'
import { DEFAULT_SCENE_PAGE_ID } from './scene-pages'
import { BOARD_PAGE_GAP } from './scene-board'
import { EDITOR_BREAKPOINT_WIDTHS } from './breakpoints'
import {
  SITE_KIT_PALETTE_IDS,
  paletteMasterId,
  type SiteKitPaletteId,
} from './site-kit-palette'
import { cloneSceneNodeWithDeterministicIds } from './scene-clone'
import {
  zaolyCardPatternBlock,
  zaolyCtaPatternBlock,
  zaolyNavPatternBlock,
  zaolySectionPatternBlock,
} from './zaoly-pattern-seeds'

export {
  zaolyCardPatternBlock,
  zaolyCtaPatternBlock,
  zaolyNavPatternBlock,
  zaolySectionPatternBlock,
} from './zaoly-pattern-seeds'

type LayoutKind = 'SiteStack' | 'SiteContainer' | 'SiteGrid'

/** Stable Master id for a Site Kit palette sourceKey (`composition-masters.md` demo). */
export function demoMasterId(sourceKey: SiteKitPaletteId): string {
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

/**
 * Layout scaffold on the page tree — nests palette Master Instances.
 * Required wherever a pattern block has children; atom Instances stay editable via Inspect.
 */
function layoutScaffold(
  type: LayoutKind,
  id: string,
  props: Record<string, unknown>,
  children: SceneNode[],
  style?: SceneNode['style'],
): SceneNode {
  return {
    id,
    type,
    props,
    tokenBindings: defaultSiteKitTokenBindings(type),
    ...(style ? { style } : {}),
    children,
  }
}

function textColumnScaffold(
  id: string,
  title: string,
  body: string,
  extras: SceneNode[] = [],
): SceneNode {
  return layoutScaffold('SiteStack', id, { direction: 'column', gap: 'sm' }, [
    inst('SiteText', {
      id: `${id}-title`,
      overrides: { props: { role: 'title', children: title } },
    }),
    inst('SiteText', {
      id: `${id}-body`,
      overrides: { props: { role: 'body', children: body } },
    }),
    ...extras,
  ])
}

/**
 * Full-bleed hero: layout scaffold + atom Instances on the page tree.
 * Select `pattern-hero` → Save as Site Kit component.
 */
export function heroPatternBlock(): SceneNode {
  return layoutScaffold(
    'SiteStack',
    'pattern-hero',
    { direction: 'column' },
    [
      inst('SiteImage', {
        id: 'inst-hero-bg',
        overrides: {
          props: { src: paths.imagePlaceholderHeroUrl, alt: 'Hero background' },
          style: {
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          },
        },
      }),
      layoutScaffold(
        'SiteStack',
        'pattern-hero-align',
        { direction: 'column' },
        [
          layoutScaffold(
            'SiteContainer',
            'pattern-hero-teaser',
            { direction: 'column', gap: 'md' },
            [
              inst('SiteText', {
                id: 'inst-hero-headline',
                overrides: {
                  props: { role: 'title', children: 'Compose faster with Zaoly' },
                },
              }),
              inst('SiteText', {
                id: 'inst-hero-body',
                overrides: {
                  props: {
                    role: 'body',
                    children:
                      'Full-bleed hero with a teaser box anchored bottom-right via layout Stacks. Save this block as a Pattern when ready.',
                  },
                },
              }),
              inst('SiteButton', {
                id: 'inst-hero-cta',
                overrides: { props: { children: 'Get started' } },
              }),
            ],
            {
              maxWidth: '420px',
              padding: '1.5rem',
              backgroundColor: 'rgba(251, 246, 236, 0.94)',
              borderRadius: '0',
            },
          ),
        ],
        {
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'flex-end',
          padding: '2rem',
          position: 'relative',
          zIndex: 1,
        },
      ),
    ],
    {
      position: 'relative',
      width: '100vw',
      height: '60vh',
      minHeight: '360px',
      overflow: 'hidden',
    },
  )
}

/** Two-column editorial split on the page tree. */
export function editorialSplitPatternBlock(): SceneNode {
  return layoutScaffold(
    'SiteGrid',
    'pattern-editorial-split',
    { columns: '2', gap: 'lg' },
    [
      layoutScaffold('SiteStack', 'pattern-editorial-media', { direction: 'column', gap: 'sm' }, [
        inst('SiteImage', {
          id: 'inst-editorial-image',
          overrides: {
            props: { src: paths.imagePlaceholderUrl, alt: 'Editorial placeholder' },
          },
        }),
        inst('SiteText', {
          id: 'inst-editorial-caption',
          overrides: {
            props: { role: 'label', children: 'Placeholder media — swap via Inspect.' },
          },
        }),
      ]),
      layoutScaffold('SiteStack', 'pattern-editorial-copy', { direction: 'column', gap: 'md' }, [
        inst('SiteText', {
          id: 'inst-editorial-title',
          overrides: {
            props: { role: 'title', children: 'Editorial split' },
          },
        }),
        inst('SiteText', {
          id: 'inst-editorial-body',
          overrides: {
            props: {
              role: 'body',
              children:
                'Media beside copy — layout scaffolds nest atom Instances. Save this block as its own Pattern.',
            },
          },
        }),
        layoutScaffold('SiteContainer', 'pattern-editorial-actions', { direction: 'row', gap: 'md' }, [
          inst('SiteLink', {
            id: 'inst-editorial-link',
            overrides: { props: { children: 'Read the approach', href: '#' } },
          }),
          inst('SiteBadge', {
            id: 'inst-editorial-badge',
            overrides: { props: { children: 'Pattern' } },
          }),
        ]),
      ]),
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

/** Three-column feature row on the page tree. */
export function featuresPatternBlock(): SceneNode {
  return layoutScaffold(
    'SiteStack',
    'pattern-features',
    { direction: 'column', gap: 'lg' },
    [
      inst('SiteText', {
        id: 'inst-features-kicker',
        overrides: { props: { role: 'label', children: 'Capabilities' } },
      }),
      inst('SiteText', {
        id: 'inst-features-title',
        overrides: { props: { role: 'title', children: 'Why Site Kit' } },
      }),
      layoutScaffold('SiteGrid', 'pattern-features-grid', { columns: '3', gap: 'lg' }, [
        textColumnScaffold(
          'pattern-features-atoms',
          'Atoms',
          'Text, Button, Link, Badge, and Image — typed props with token pack bindings on every Instance.',
        ),
        textColumnScaffold(
          'pattern-features-forms',
          'Forms',
          'Input, Select, Textarea, and Checkbox share the same Master pattern as the rest of the kit.',
        ),
        textColumnScaffold(
          'pattern-features-layout',
          'Layout',
          'Stack, Grid, Container, and Divider scaffold pages without pre-baked composite shells.',
          [inst('SiteBadge', { id: 'inst-features-badge', overrides: { props: { children: 'Layout' } } })],
        ),
      ]),
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

/** Lead-capture form from form atom Instances on the page tree. */
export function formPatternBlock(): SceneNode {
  return layoutScaffold(
    'SiteStack',
    'pattern-form',
    { direction: 'column', gap: 'md' },
    [
      inst('SiteText', {
        id: 'inst-form-title',
        overrides: { props: { role: 'title', children: 'Stay in touch' } },
      }),
      inst('SiteText', {
        id: 'inst-form-lede',
        overrides: {
          props: {
            role: 'body',
            children: 'A compact form built from the same Masters as the rest of the demo patterns.',
          },
        },
      }),
      layoutScaffold('SiteGrid', 'pattern-form-fields', { columns: '2', gap: 'md' }, [
        inst('SiteInput', {
          id: 'inst-form-email',
          overrides: { props: { placeholder: 'you@example.com' } },
        }),
        inst('SiteSelect', {
          id: 'inst-form-select',
          overrides: {
            props: { placeholder: 'Interest', options: 'Design\nEngineering\nProduct' },
          },
        }),
      ]),
      inst('SiteTextarea', {
        id: 'inst-form-message',
        overrides: { props: { placeholder: 'Tell us more' } },
      }),
      inst('SiteCheckbox', {
        id: 'inst-form-checkbox',
        overrides: { props: { children: 'Subscribe to updates' } },
      }),
      layoutScaffold('SiteContainer', 'pattern-form-actions', { direction: 'row', gap: 'md' }, [
        inst('SiteButton', {
          id: 'inst-form-submit',
          overrides: { props: { children: 'Send' } },
        }),
        inst('SiteLink', {
          id: 'inst-form-privacy',
          overrides: { props: { children: 'Privacy policy', href: '#' } },
        }),
      ]),
    ],
    {
      width: '100%',
      maxWidth: '40rem',
      marginLeft: 'auto',
      marginRight: 'auto',
      padding: '3rem 1.5rem',
    },
  )
}

/** Footer row on the page tree. */
export function footerPatternBlock(): SceneNode {
  return layoutScaffold(
    'SiteContainer',
    'pattern-footer',
    { direction: 'row', gap: 'md' },
    [
      inst('SiteText', {
        id: 'inst-footer-copy',
        overrides: { props: { role: 'label', children: 'Zaoly · Site Kit demo' } },
      }),
      layoutScaffold(
        'SiteStack',
        'pattern-footer-actions',
        { direction: 'row', gap: 'md' },
        [
          inst('SiteLink', {
            id: 'inst-footer-link',
            overrides: { props: { children: 'Open components', href: '#' } },
          }),
          inst('SiteButton', {
            id: 'inst-footer-cta',
            overrides: { props: { children: 'Contact' } },
          }),
        ],
        { marginLeft: 'auto' },
      ),
    ],
    {
      width: '100%',
      padding: '1.5rem',
      borderTop: '1px solid rgba(0, 0, 0, 0.08)',
    },
  )
}

/** Default `/editor` document id — save + reload round-trip without `?sceneId=`. */
export const DEFAULT_EDITOR_SCENE_ID = 'scene-demo'

/** P80 demo page ids — Home + Contact tabs on staging. */
export const DEMO_PAGE_HOME_ID = 'page-home'
export const DEMO_PAGE_CONTACT_ID = 'page-contact'

function pageStackRoot(id: string, children: SceneNode[]): SceneNode {
  return {
    id,
    type: 'SiteStack',
    props: { direction: 'column' },
    tokenBindings: defaultSiteKitTokenBindings('SiteStack'),
    children,
  }
}

/** Home artboard: Zaoly canon seeds + landing patterns. */
export function homePageRoot(): SceneNode {
  return pageStackRoot('page-home-root', [
    zaolyNavPatternBlock(),
    heroPatternBlock(),
    inst('SiteDivider', { id: 'inst-pattern-div-1' }),
    zaolySectionPatternBlock(),
    editorialSplitPatternBlock(),
    inst('SiteDivider', { id: 'inst-pattern-div-2' }),
    featuresPatternBlock(),
    layoutScaffold(
      'SiteContainer',
      'pattern-zaoly-card-row',
      { direction: 'row', gap: 'lg' },
      [zaolyCardPatternBlock(), zaolyCtaPatternBlock()],
      {
        width: '100%',
        maxWidth: '72rem',
        marginLeft: 'auto',
        marginRight: 'auto',
        padding: '2rem 1.5rem',
        alignItems: 'stretch',
        flexWrap: 'wrap',
      },
    ),
    inst('SiteDivider', { id: 'inst-pattern-div-3' }),
    footerPatternBlock(),
  ])
}

/** Contact artboard: lead-capture form pattern only. */
export function contactPageRoot(): SceneNode {
  return pageStackRoot('page-contact-root', [formPatternBlock()])
}

/** Empty Site Kit artboard (atoms-first blank canvas). */
export function createEmptyArtboardScene(platformProjectId?: string | null): CompositionScene {
  const root: SceneNode = {
    id: 'root',
    type: 'SiteStack',
    props: { direction: 'column' },
    tokenBindings: defaultSiteKitTokenBindings('SiteStack'),
    children: [],
  }
  return {
    id: DEFAULT_EDITOR_SCENE_ID,
    name: 'Untitled',
    version: 1,
    platformProjectId: platformProjectId ?? null,
    updatedAt: new Date().toISOString(),
    pages: [{ id: DEFAULT_SCENE_PAGE_ID, name: 'Page 1', root, frame: { x: 0, y: 0 } }],
    activePageId: DEFAULT_SCENE_PAGE_ID,
    root,
  }
}

/**
 * Pattern demo (Home + Contact) — tests / explicit samples only.
 * `/editor` Collection boot seeds `createZaolyDefaultLandingScene` instead.
 */
export function createDemoScene(platformProjectId?: string | null): CompositionScene {
  const masters = paletteMasters()
  const homeRoot = homePageRoot()
  const contactRoot = contactPageRoot()
  const desktopWidth = EDITOR_BREAKPOINT_WIDTHS.desktop

  return {
    id: DEFAULT_EDITOR_SCENE_ID,
    name: 'Pattern demo',
    version: 1,
    platformProjectId: platformProjectId ?? null,
    updatedAt: new Date().toISOString(),
    masters,
    pages: [
      {
        id: DEMO_PAGE_HOME_ID,
        name: 'Home',
        root: homeRoot,
        frame: { x: 0, y: 0 },
      },
      {
        id: DEMO_PAGE_CONTACT_ID,
        name: 'Contact',
        root: contactRoot,
        frame: { x: desktopWidth + BOARD_PAGE_GAP, y: 0 },
      },
    ],
    activePageId: DEMO_PAGE_HOME_ID,
    root: homeRoot,
  }
}

/**
 * Legacy Top-N fixture (Text/Card/Button/Input/Image) for unit tests that need
 * known node ids (`title`, `card-1`, `email`, `hero-img`). Not used by `/editor`.
 */
export function createLegacyFixtureScene(platformProjectId?: string | null): CompositionScene {
  return {
    id: DEFAULT_EDITOR_SCENE_ID,
    name: 'Demo composition',
    version: 1,
    platformProjectId: platformProjectId ?? null,
    updatedAt: new Date().toISOString(),
    root: {
      id: 'root',
      type: 'Stack',
      props: { direction: 'column', gap: 'md' },
      children: [
        {
          id: 'title',
          type: 'Text',
          props: { children: 'CREATION Editor', role: 'headline' },
          tokenBindings: { ...DEFAULT_HEADLINE_TYPE_BINDINGS },
        },
        {
          id: 'card-1',
          type: 'Card',
          children: [
            {
              id: 'card-text',
              type: 'Text',
              props: { children: 'Select a node to inspect props.', role: 'body' },
              tokenBindings: { ...DEFAULT_BODY_TYPE_BINDINGS },
            },
            {
              id: 'card-btn',
              type: 'Button',
              props: { children: 'Primary action', variant: 'primary' },
            },
          ],
        },
        {
          id: 'field-row',
          type: 'Stack',
          props: { direction: 'row', gap: 'sm' },
          children: [
            {
              id: 'email',
              type: 'Input',
              props: { placeholder: 'email@example.com' },
            },
          ],
        },
        {
          id: 'hero-img',
          type: 'Image',
          props: {
            src: paths.imagePlaceholderHeroUrl,
            alt: 'Hero placeholder',
          },
        },
      ],
    },
  }
}
