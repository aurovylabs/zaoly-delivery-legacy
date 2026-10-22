import { paths } from '../paths'
import type { LandingExperienceChapter } from './experience-tour'

export type ExploreChapterId = (typeof paths.landing.exploreChapters)[number]

export function isExploreChapter(value: string): value is ExploreChapterId {
  return (paths.landing.exploreChapters as readonly string[]).includes(value)
}

export function exploreChapterHref(chapter: ExploreChapterId): string {
  return paths.routes.exploreChapter(chapter)
}

export type ExploreChapterMeta = {
  id: ExploreChapterId
  experienceId: LandingExperienceChapter
  labelDe: string
  labelEn: string
  titleDe: string
  titleEn: string
  bodyDe: string
  bodyEn: string
  /** Authenticated product hub (or register). Distinct from public `/explore` demos. */
  productHref: string
  productLabelDe: string
  productLabelEn: string
  /** When true, product CTA copy should signal sign-in. */
  productRequiresAuth: boolean
}

export const EXPLORE_CHAPTERS: ExploreChapterMeta[] = [
  {
    id: 'editor',
    experienceId: 'editor',
    labelDe: 'Editor',
    labelEn: 'Editor',
    titleDe: 'Ein Arbeitsplatz. Drei Blickwinkel.',
    titleEn: 'One workspace. Three lenses.',
    bodyDe: 'Seiten, Zoom, Layers, Canvas-Hotspots, Inspector — Illustration der Linsen Canvas · Masters · Preflight.',
    bodyEn: 'Pages, zoom, layers, canvas hotspots, inspector — illustration of Canvas · Masters · Preflight lenses.',
    productHref: paths.routes.editor,
    productLabelDe: 'App · Editor (Login)',
    productLabelEn: 'App · Editor (sign-in)',
    productRequiresAuth: true,
  },
  {
    id: 'kit',
    experienceId: 'kit',
    labelDe: 'Zaoly Kit',
    labelEn: 'Zaoly Kit',
    titleDe: 'Atome. Daraus Layouts.',
    titleEn: 'Atoms. Then layouts.',
    bodyDe: 'Der komplette Kit-Katalog — und warum Stack, Grid und Container daraus Seiten bauen.',
    bodyEn: 'The full Kit catalog — and why Stack, Grid, and Container turn atoms into pages.',
    productHref: paths.routes.kit,
    productLabelDe: 'App · Kit Playground (Login)',
    productLabelEn: 'App · Kit Playground (sign-in)',
    productRequiresAuth: true,
  },
  {
    id: 'tokens',
    experienceId: 'tokens',
    labelDe: 'Token Studio',
    labelEn: 'Token Studio',
    titleDe: 'Ein Pfad. Zwei Komponenten.',
    titleEn: 'One path. Two components.',
    bodyDe: 'Swatches, Skalen, gebundene Karten — ein Override aktualisiert Verwendungen.',
    bodyEn: 'Swatches, scales, bound cards — one override updates uses.',
    productHref: paths.routes.tokens,
    productLabelDe: 'App · Token Studio (Login)',
    productLabelEn: 'App · Token Studio (sign-in)',
    productRequiresAuth: true,
  },
  {
    id: 'screens',
    experienceId: 'screens',
    labelDe: 'Screens',
    labelEn: 'Screens',
    titleDe: 'Dieselbe Seite. Andere Breite.',
    titleEn: 'Same page. Different width.',
    bodyDe: 'Desktop, Tablet, Mobile — vergleichen, tippen, Rahmen und Orientierung wechseln.',
    bodyEn: 'Desktop, tablet, mobile — compare, tap, switch chrome and orientation.',
    productHref: paths.routes.editor,
    productLabelDe: 'App · Editor (Login)',
    productLabelEn: 'App · Editor (sign-in)',
    productRequiresAuth: true,
  },
  {
    id: 'path',
    experienceId: 'path',
    labelDe: 'Weg',
    labelEn: 'Path',
    titleDe: 'Form. System. Code.',
    titleEn: 'Shape. System. Code.',
    bodyDe: 'Scrubbe die drei Schritte, tippe Details an, oder lass den Weg kurz abspielen.',
    bodyEn: 'Scrub the three steps, tap details, or play the short path.',
    productHref: paths.routes.register,
    productLabelDe: 'Loslegen',
    productLabelEn: 'Get started',
    productRequiresAuth: false,
  },
]
