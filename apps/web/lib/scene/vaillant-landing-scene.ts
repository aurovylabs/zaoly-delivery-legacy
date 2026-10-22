/**
 * Vaillant Group landing — token pack paths + Spirion look contract
 * (capture cap_bdda0c1e082944b891d1e25ff99b3f8c · vaillant.de homepage).
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
  DEFAULT_SITE_FIELD_BINDINGS,
  DEFAULT_SITE_LINK_BINDINGS,
} from '../inspect/token-catalog'
import { paths } from '../paths'
import { EDITOR_BREAKPOINT_WIDTHS } from './breakpoints'
import { INSTANCE_TYPE } from './expand-instances'
import { cloneSceneNodeWithNewIds, defaultChildForType } from './ops'
import { BOARD_PAGE_GAP } from './scene-board'
import { SITE_KIT_PALETTE_IDS, type SiteKitPaletteId } from './site-kit-palette'

export const VAILLANT_LANDING_SCENE_ID = 'scene-vaillant-landing'
export const VAILLANT_LANDING_PAGE_ID = 'page-vaillant-home'
export const VAILLANT_CONTACT_PAGE_ID = 'page-vaillant-contact'
export const VAILLANT_INSIGHT_COST_PAGE_ID = 'page-vaillant-insight-cost'
export const VAILLANT_INSIGHT_FEASIBILITY_PAGE_ID = 'page-vaillant-insight-feasibility'
export const VAILLANT_INSIGHT_STEPS_PAGE_ID = 'page-vaillant-insight-steps'
export const VAILLANT_LANDING_SCENE_NAME = 'Vaillant Group Landing · Jana Schmitt'
/** Spirion capture run for vaillant.de (staging research). */
export const VAILLANT_SPIRION_CAPTURE_ID = 'cap_bdda0c1e082944b891d1e25ff99b3f8c'
/** Marker node — missing ⇒ safe to reseed MaFo Jana landing on editor boot. */
export const VAILLANT_JANA_SEED_MARKER_ID = 'inst-vaillant-jana-kicker'

type LayoutKind = 'SiteStack' | 'SiteContainer' | 'SiteGrid'

const PAGE_BINDINGS: Record<string, string> = {
  gap: 'spacing.static.md',
  background: 'color.background.default',
}

const MUTED_BINDINGS: Record<string, string> = {
  ...DEFAULT_BODY_TYPE_BINDINGS,
  color: 'color.text.primary',
  fontFamily: 'typography.body.family',
}

const TITLE_BINDINGS: Record<string, string> = {
  ...DEFAULT_HEADLINE_TYPE_BINDINGS,
  color: 'color.text.primary',
  fontFamily: 'typography.heading.h1',
}

const DISPLAY_BINDINGS: Record<string, string> = {
  ...DEFAULT_HEADLINE_TYPE_BINDINGS,
  color: 'color.text.primary',
  fontFamily: 'typography.display.family',
}

const INVERSE_TITLE_BINDINGS: Record<string, string> = {
  ...DEFAULT_HEADLINE_TYPE_BINDINGS,
  color: 'color.text.inverse',
  fontFamily: 'typography.display.family',
}

const INVERSE_BODY_BINDINGS: Record<string, string> = {
  ...DEFAULT_BODY_TYPE_BINDINGS,
  color: 'color.text.inverse',
  fontFamily: 'typography.body.family',
}

const PRIMARY_BUTTON_BINDINGS: Record<string, string> = {
  ...DEFAULT_SITE_BUTTON_BINDINGS,
  background: 'color.action.primary',
  color: 'color.text.inverse',
  radius: 'radius.control.md',
}

const OUTLINE_BUTTON_BINDINGS: Record<string, string> = {
  ...DEFAULT_SITE_BUTTON_BINDINGS,
  background: 'color.background.default',
  color: 'color.brand.primary',
  borderColor: 'color.brand.primary',
  radius: 'radius.control.md',
}

const LINK_BINDINGS: Record<string, string> = {
  ...DEFAULT_SITE_LINK_BINDINGS,
  color: 'color.brand.primary',
}

const SURFACE_BINDINGS: Record<string, string> = {
  gap: 'spacing.static.md',
  background: 'color.background.subtle',
  radius: 'radius.control.md',
}

const FIELD_BINDINGS: Record<string, string> = {
  ...DEFAULT_SITE_FIELD_BINDINGS,
  borderColor: 'color.border.default',
  background: 'color.background.default',
  color: 'color.text.primary',
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
  opts?: { id?: string; name?: string; overrides?: SceneInstanceOverrides },
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
  opts?: { style?: SceneNode['style']; tokenBindings?: Record<string, string> },
): SceneNode {
  return {
    id,
    type,
    props,
    tokenBindings: opts?.tokenBindings ?? PAGE_BINDINGS,
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
          tokenBindings: TITLE_BINDINGS,
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
      tokenBindings: SURFACE_BINDINGS,
      style: { padding: '1.25rem', flex: '1 1 14rem' },
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
          tokenBindings: { ...TITLE_BINDINGS, color: 'color.brand.primary' },
        },
      }),
      inst('SiteText', {
        id: `${id}-label`,
        overrides: {
          props: { role: 'label', children: label },
          tokenBindings: MUTED_BINDINGS,
        },
      }),
    ],
    {
      tokenBindings: SURFACE_BINDINGS,
      style: { padding: '1rem', flex: '1 1 8rem' },
    },
  )
}

function vaillantHeader(): SceneNode {
  return layout(
    'SiteContainer',
    'pattern-vaillant-header',
    { direction: 'row', gap: 'md' },
    [
      inst('SiteText', {
        id: 'inst-vaillant-brand',
        overrides: {
          props: { role: 'title', children: 'Vaillant Group' },
          tokenBindings: { ...TITLE_BINDINGS, color: 'color.brand.primary' },
        },
      }),
      layout(
        'SiteStack',
        'pattern-vaillant-nav',
        { direction: 'row', gap: 'md' },
        [
          inst('SiteLink', {
            id: 'inst-vaillant-nav-products',
            overrides: {
              props: { children: 'Produkte', href: '#' },
              tokenBindings: MUTED_BINDINGS,
            },
          }),
          inst('SiteLink', {
            id: 'inst-vaillant-nav-service',
            overrides: {
              props: { children: 'Service', href: '#' },
              tokenBindings: MUTED_BINDINGS,
            },
          }),
          inst('SiteLink', {
            id: 'inst-vaillant-nav-about',
            overrides: {
              props: { children: 'Über uns', href: '#' },
              tokenBindings: MUTED_BINDINGS,
            },
          }),
        ],
        { tokenBindings: PAGE_BINDINGS, style: { marginLeft: 'auto' } },
      ),
      inst('SiteButton', {
        id: 'inst-vaillant-nav-cta',
        overrides: {
          props: { children: 'Angebot anfordern' },
          tokenBindings: OUTLINE_BUTTON_BINDINGS,
          style: { borderWidth: '2px', borderStyle: 'solid' },
        },
      }),
    ],
    {
      tokenBindings: {
        gap: 'spacing.static.md',
        background: 'color.background.default',
        borderColor: 'color.border.default',
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

/** Split hero — Spirion above_fold: headline + product media. */
function vaillantHero(): SceneNode {
  return layout(
    'SiteGrid',
    'pattern-vaillant-hero',
    { columns: '2', gap: 'lg' },
    [
      layout(
        'SiteStack',
        'pattern-vaillant-hero-copy',
        { direction: 'column', gap: 'md' },
        [
          inst('SiteText', {
            id: VAILLANT_JANA_SEED_MARKER_ID,
            overrides: {
              props: {
                role: 'label',
                children: 'Für Öko-Modernisierer · Persona Jana Schmitt',
              },
              tokenBindings: { ...MUTED_BINDINGS, color: 'color.brand.primary' },
            },
          }),
          inst('SiteText', {
            id: 'inst-vaillant-headline',
            overrides: {
              props: {
                role: 'title',
                children: 'Klimaziel erreicht — mit Planungssicherheit',
              },
              tokenBindings: DISPLAY_BINDINGS,
            },
          }),
          inst('SiteText', {
            id: 'inst-vaillant-lede',
            overrides: {
              props: {
                role: 'body',
                children:
                  'Jana will nachhaltig modernisieren, ohne im Förderdschungel stecken zu bleiben. Klare Kosten, technische Eignung und der passende Fachpartner — Schritt für Schritt.',
              },
              tokenBindings: MUTED_BINDINGS,
            },
          }),
          layout(
            'SiteStack',
            'pattern-vaillant-hero-ctas',
            { direction: 'row', gap: 'md' },
            [
              inst('SiteButton', {
                id: 'inst-vaillant-hero-primary',
                overrides: {
                  props: { children: 'Eignung prüfen' },
                  tokenBindings: PRIMARY_BUTTON_BINDINGS,
                },
              }),
              inst('SiteButton', {
                id: 'inst-vaillant-hero-outline',
                overrides: {
                  props: { children: 'Kosten & Förderung' },
                  tokenBindings: OUTLINE_BUTTON_BINDINGS,
                  style: { borderWidth: '2px', borderStyle: 'solid' },
                },
              }),
            ],
            { tokenBindings: PAGE_BINDINGS },
          ),
        ],
        { tokenBindings: PAGE_BINDINGS, style: { justifyContent: 'center' } },
      ),
      layout(
        'SiteStack',
        'pattern-vaillant-hero-media',
        { direction: 'column', gap: 'sm' },
        [
          inst('SiteImage', {
            id: 'inst-vaillant-hero-image',
            overrides: {
              props: {
                src: paths.imagePlaceholderHeroUrl,
                alt: 'Vaillant Wärmepumpen-System',
              },
              style: { borderRadius: '4px', width: '100%', objectFit: 'cover' },
            },
          }),
          inst('SiteBadge', {
            id: 'inst-vaillant-hero-badge',
            overrides: {
              props: { children: 'Bis zu 70 % Förderung möglich' },
              tokenBindings: {
                ...MUTED_BINDINGS,
                background: 'color.action.accent',
                color: 'color.text.inverse',
              },
            },
          }),
        ],
        { tokenBindings: PAGE_BINDINGS },
      ),
    ],
    {
      tokenBindings: PAGE_BINDINGS,
      style: {
        width: '100%',
        maxWidth: '72rem',
        marginLeft: 'auto',
        marginRight: 'auto',
        padding: '3rem 1.5rem',
        alignItems: 'center',
      },
    },
  )
}

function vaillantConversionBand(): SceneNode {
  return layout(
    'SiteStack',
    'pattern-vaillant-conversion',
    { direction: 'column', gap: 'md' },
    [
      inst('SiteText', {
        id: 'inst-vaillant-conversion-title',
        overrides: {
          props: { role: 'title', children: 'Unsicherheit raus — Entscheidung rein' },
          tokenBindings: INVERSE_TITLE_BINDINGS,
        },
      }),
      inst('SiteText', {
        id: 'inst-vaillant-conversion-body',
        overrides: {
          props: {
            role: 'body',
            children:
              'Kaufbarrieren wie Kosten, Technik und Förderantrag werden mit Fachpartnern vor Ort geklärt — bevor Sie investieren.',
          },
          tokenBindings: INVERSE_BODY_BINDINGS,
        },
      }),
      inst('SiteButton', {
        id: 'inst-vaillant-conversion-cta',
        overrides: {
          props: { children: 'Beratung anfordern' },
          tokenBindings: {
            ...PRIMARY_BUTTON_BINDINGS,
            background: 'color.background.default',
            color: 'color.brand.primary',
          },
          style: { alignSelf: 'flex-start' },
        },
      }),
    ],
    {
      tokenBindings: {
        gap: 'spacing.static.lg',
        background: 'color.brand.primary',
      },
      style: {
        width: '100%',
        padding: '3rem 1.5rem',
      },
    },
  )
}

function vaillantFooter(): SceneNode {
  return layout(
    'SiteContainer',
    'pattern-vaillant-footer',
    { direction: 'row', gap: 'md' },
    [
      inst('SiteText', {
        id: 'inst-vaillant-footer-copy',
        overrides: {
          props: { role: 'label', children: 'Vaillant Group · CREATION Site Kit' },
          tokenBindings: MUTED_BINDINGS,
        },
      }),
      layout(
        'SiteStack',
        'pattern-vaillant-footer-links',
        { direction: 'row', gap: 'md' },
        [
          inst('SiteLink', {
            id: 'inst-vaillant-footer-impressum',
            overrides: {
              props: { children: 'Impressum', href: '#' },
              tokenBindings: LINK_BINDINGS,
            },
          }),
          inst('SiteLink', {
            id: 'inst-vaillant-footer-privacy',
            overrides: {
              props: { children: 'Datenschutz', href: '#' },
              tokenBindings: LINK_BINDINGS,
            },
          }),
        ],
        { tokenBindings: PAGE_BINDINGS, style: { marginLeft: 'auto' } },
      ),
    ],
    {
      tokenBindings: {
        gap: 'spacing.static.md',
        background: 'color.background.default',
        borderColor: 'color.border.default',
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

/** Home artboard — nav → hero → stats → conversion → features → editorial → footer. */
export function vaillantLandingPageRoot(): SceneNode {
  return layout(
    'SiteStack',
    'page-vaillant-home-root',
    { direction: 'column', gap: 'none' },
    [
      vaillantHeader(),
      vaillantHero(),
      layout(
        'SiteGrid',
        'pattern-vaillant-stats',
        { columns: '3', gap: 'md' },
        [
          statCell('pattern-vaillant-stat-years', '70 %', 'Förderung möglich'),
          statCell('pattern-vaillant-stat-experts', '4.500+', 'Fachbetriebe'),
          statCell('pattern-vaillant-stat-green', 'CO₂↓', 'Klimaziel im Blick'),
        ],
        {
          tokenBindings: PAGE_BINDINGS,
          style: {
            width: '100%',
            maxWidth: '72rem',
            marginLeft: 'auto',
            marginRight: 'auto',
            padding: '2rem 1.5rem',
          },
        },
      ),
      vaillantConversionBand(),
      layout(
        'SiteStack',
        'pattern-vaillant-features-wrap',
        { direction: 'column', gap: 'lg' },
        [
          inst('SiteText', {
            id: 'inst-vaillant-features-kicker',
            overrides: {
              props: { role: 'label', children: 'Was Jana braucht' },
              tokenBindings: { ...MUTED_BINDINGS, color: 'color.brand.primary' },
            },
          }),
          inst('SiteText', {
            id: 'inst-vaillant-features-title',
            overrides: {
              props: { role: 'title', children: 'Barrieren, die wir adressieren' },
              tokenBindings: TITLE_BINDINGS,
            },
          }),
          layout(
            'SiteGrid',
            'pattern-vaillant-features-grid',
            { columns: '3', gap: 'lg' },
            [
              featureCard(
                'pattern-vaillant-feat-heat',
                'Kosten klar gemacht',
                'Gesamtinvestition, Betriebskosten und Förderanteil transparent — ohne versteckte Annahmen.',
              ),
              featureCard(
                'pattern-vaillant-feat-service',
                'Technik verständlich',
                'Passt die Wärmepumpe zu Bestand und Sanierungsstand? Eignung prüfen vor der Entscheidung.',
              ),
              featureCard(
                'pattern-vaillant-feat-green',
                'Handwerker finden',
                'Fachpartner im Netz, die Klima-Ziele und Förderung mitdenken — nicht nur Geräte verkaufen.',
              ),
            ],
            { tokenBindings: PAGE_BINDINGS, style: { width: '100%' } },
          ),
        ],
        {
          tokenBindings: PAGE_BINDINGS,
          style: {
            width: '100%',
            maxWidth: '72rem',
            marginLeft: 'auto',
            marginRight: 'auto',
            padding: '3rem 1.5rem',
          },
        },
      ),
      layout(
        'SiteGrid',
        'pattern-vaillant-editorial',
        { columns: '2', gap: 'lg' },
        [
          inst('SiteImage', {
            id: 'inst-vaillant-editorial-image',
            overrides: {
              props: {
                src: paths.imagePlaceholderUrl,
                alt: 'Vaillant Wärmepumpen Installation',
              },
              style: { borderRadius: '4px', width: '100%' },
            },
          }),
          layout(
            'SiteStack',
            'pattern-vaillant-editorial-copy',
            { direction: 'column', gap: 'md' },
            [
              inst('SiteText', {
                id: 'inst-vaillant-editorial-title',
                overrides: {
                  props: { role: 'title', children: 'Drei Schritte zur Wärmepumpe' },
                  tokenBindings: TITLE_BINDINGS,
                },
              }),
              inst('SiteText', {
                id: 'inst-vaillant-editorial-body',
                overrides: {
                  props: {
                    role: 'body',
                    children:
                      '1) Beratung & Eignung · 2) Angebot mit Förderpfad · 3) Installation mit Fachpartner. Für Menschen wie Jana, die Klimaziele mit Planungssicherheit verbinden wollen.',
                  },
                  tokenBindings: MUTED_BINDINGS,
                },
              }),
              inst('SiteLink', {
                id: 'inst-vaillant-editorial-link',
                overrides: {
                  props: { children: 'Schritte ansehen', href: '#' },
                  tokenBindings: LINK_BINDINGS,
                },
              }),
            ],
            { tokenBindings: PAGE_BINDINGS },
          ),
        ],
        {
          tokenBindings: PAGE_BINDINGS,
          style: {
            width: '100%',
            maxWidth: '72rem',
            marginLeft: 'auto',
            marginRight: 'auto',
            padding: '2rem 1.5rem 3rem',
          },
        },
      ),
      vaillantFooter(),
    ],
    {
      tokenBindings: PAGE_BINDINGS,
      style: { width: '100%', minHeight: '100%' },
    },
  )
}

export function vaillantContactPageRoot(): SceneNode {
  return layout(
    'SiteStack',
    'page-vaillant-contact-root',
    { direction: 'column', gap: 'lg' },
    [
      vaillantHeader(),
      layout(
        'SiteStack',
        'pattern-vaillant-contact-form',
        { direction: 'column', gap: 'md' },
        [
          inst('SiteText', {
            id: 'inst-vaillant-contact-title',
            overrides: {
              props: { role: 'title', children: 'Kontakt & Beratung' },
              tokenBindings: TITLE_BINDINGS,
            },
          }),
          inst('SiteText', {
            id: 'inst-vaillant-contact-lede',
            overrides: {
              props: {
                role: 'body',
                children: 'Wir melden uns innerhalb von 24 Stunden bei Ihnen.',
              },
              tokenBindings: MUTED_BINDINGS,
            },
          }),
          layout(
            'SiteGrid',
            'pattern-vaillant-contact-fields',
            { columns: '2', gap: 'md' },
            [
              inst('SiteInput', {
                id: 'inst-vaillant-contact-name',
                overrides: {
                  props: { placeholder: 'Name' },
                  tokenBindings: FIELD_BINDINGS,
                },
              }),
              inst('SiteInput', {
                id: 'inst-vaillant-contact-email',
                overrides: {
                  props: { placeholder: 'E-Mail' },
                  tokenBindings: FIELD_BINDINGS,
                },
              }),
            ],
            { tokenBindings: PAGE_BINDINGS },
          ),
          inst('SiteTextarea', {
            id: 'inst-vaillant-contact-message',
            overrides: {
              props: { placeholder: 'Ihre Nachricht' },
              tokenBindings: FIELD_BINDINGS,
            },
          }),
          inst('SiteButton', {
            id: 'inst-vaillant-contact-submit',
            overrides: {
              props: { children: 'Anfrage senden' },
              tokenBindings: PRIMARY_BUTTON_BINDINGS,
            },
          }),
        ],
        {
          tokenBindings: PAGE_BINDINGS,
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
    { tokenBindings: PAGE_BINDINGS, style: { width: '100%', minHeight: '100%' } },
  )
}

/** Single-insight landing (UC1 CREATION module). */
function vaillantInsightPageRoot(
  patternId: string,
  headline: string,
  lede: string,
  ctaLabel: string,
): SceneNode {
  return layout(
    'SiteStack',
    patternId,
    { direction: 'column', gap: 'md' },
    [
      vaillantHeader(),
      layout(
        'SiteStack',
        `${patternId}-hero`,
        { direction: 'column', gap: 'md' },
        [
          inst('SiteText', {
            id: `${patternId}-headline`,
            overrides: {
              props: { role: 'title', children: headline },
              tokenBindings: DISPLAY_BINDINGS,
            },
          }),
          inst('SiteText', {
            id: `${patternId}-lede`,
            overrides: {
              props: { role: 'body', children: lede },
              tokenBindings: MUTED_BINDINGS,
            },
          }),
          inst('SiteButton', {
            id: `${patternId}-cta`,
            overrides: {
              props: { children: ctaLabel },
              tokenBindings: PRIMARY_BUTTON_BINDINGS,
              style: { alignSelf: 'flex-start' },
            },
          }),
        ],
        {
          tokenBindings: PAGE_BINDINGS,
          style: {
            width: '100%',
            maxWidth: '48rem',
            marginLeft: 'auto',
            marginRight: 'auto',
            padding: '3rem 1.5rem',
          },
        },
      ),
    ],
    { tokenBindings: PAGE_BINDINGS, style: { width: '100%', minHeight: '100%' } },
  )
}

export function createVaillantLandingScene(
  platformProjectId: string = paths.vaillantGroupPlatformProjectId,
): CompositionScene {
  const landingRoot = vaillantLandingPageRoot()
  const contactRoot = vaillantContactPageRoot()
  const costRoot = vaillantInsightPageRoot(
    'pattern-vaillant-insight-cost',
    'Was kostet mich eine Wärmepumpe wirklich?',
    'Transparente Gesamtkosten, Förderung und Betriebskosten — ohne versteckte Annahmen. Insight aus Vaillant Group MaFo UC1 · Jana Schmitt.',
    'Kostenrechner starten',
  )
  const feasibilityRoot = vaillantInsightPageRoot(
    'pattern-vaillant-insight-feasibility',
    'Funktioniert eine Wärmepumpe in meinem Haus?',
    'Eignung für Bestandsgebäude, Altbau und Sanierungsstand — Planungssicherheit vor der Investition.',
    'Eignung prüfen',
  )
  const stepsRoot = vaillantInsightPageRoot(
    'pattern-vaillant-insight-steps',
    'Ihre nächsten drei Schritte zur Wärmepumpe',
    'Geführte Journey: Beratung, Planung mit Fachhandwerker, Förderantrag — klar strukturiert.',
    'Schritte ansehen',
  )
  const desktopWidth = EDITOR_BREAKPOINT_WIDTHS.desktop
  const pageGap = desktopWidth + BOARD_PAGE_GAP

  return {
    id: VAILLANT_LANDING_SCENE_ID,
    name: VAILLANT_LANDING_SCENE_NAME,
    version: 1,
    platformProjectId,
    updatedAt: new Date().toISOString(),
    masters: paletteMasters(),
    pages: [
      {
        id: VAILLANT_LANDING_PAGE_ID,
        name: 'Landing · Jana',
        root: landingRoot,
        frame: { x: 0, y: 0 },
      },
      {
        id: VAILLANT_INSIGHT_COST_PAGE_ID,
        name: 'Insight · Kosten',
        root: costRoot,
        frame: { x: pageGap, y: 0 },
      },
      {
        id: VAILLANT_INSIGHT_FEASIBILITY_PAGE_ID,
        name: 'Insight · Eignung',
        root: feasibilityRoot,
        frame: { x: pageGap * 2, y: 0 },
      },
      {
        id: VAILLANT_INSIGHT_STEPS_PAGE_ID,
        name: 'Insight · 3 Schritte',
        root: stepsRoot,
        frame: { x: pageGap * 3, y: 0 },
      },
      {
        id: VAILLANT_CONTACT_PAGE_ID,
        name: 'Kontakt',
        root: contactRoot,
        frame: { x: pageGap * 4, y: 0 },
      },
    ],
    activePageId: VAILLANT_LANDING_PAGE_ID,
    root: landingRoot,
  }
}

function sceneContainsNodeId(scene: CompositionScene, nodeId: string): boolean {
  const walk = (node: SceneNode | undefined): boolean => {
    if (!node) return false
    if (node.id === nodeId) return true
    for (const child of node.children ?? []) {
      if (walk(child)) return true
    }
    return false
  }
  if (walk(scene.root)) return true
  for (const page of scene.pages ?? []) {
    if (walk(page.root)) return true
  }
  return false
}

/** True when persisted scene lacks Jana MaFo seed marker (safe to auto-upgrade). */
export function shouldReseedVaillantLanding(scene: CompositionScene): boolean {
  if (scene.id !== VAILLANT_LANDING_SCENE_ID) return false
  if (scene.name !== VAILLANT_LANDING_SCENE_NAME) return true
  return !sceneContainsNodeId(scene, VAILLANT_JANA_SEED_MARKER_ID)
}
