/**
 * Editor onboarding helpers — specs/domain/onboarding.md
 */
import type { CompositionScene } from '@zaoly/contracts'
import { paths } from '../paths'
import { createZaolyDefaultLandingScene } from '../scene/zaoly-default-landing-scene'

export type OnboardingLocale = 'en' | 'de'

export type OnboardingTourStepId =
  | 'select'
  | 'openComponents'
  | 'insert'
  | 'inlineText'
  | 'focusInspect'
  | 'inspect'
  | 'openTokens'
  | 'tokenPick'
  | 'tokenBind'
  | 'breakpoints'
  | 'activateBreakpoint'
  | 'preview'

/** Actions emitted on `zaoly:onboarding-action`. `tokens` aliases `openTokens`. */
export type OnboardingActionId =
  | OnboardingTourStepId
  | 'tokens'

export type GuidedTourStep = {
  id: OnboardingTourStepId
  copyKey: keyof OnboardingCopyPack
  /** Tip anchor key for pulse / position (null = bottom-center). */
  anchor: string | null
}

export const GUIDED_TOUR_STEPS: readonly GuidedTourStep[] = Object.freeze([
  { id: 'select', copyKey: 'tipSelect', anchor: 'select' },
  { id: 'openComponents', copyKey: 'tipOpenComponents', anchor: 'openComponents' },
  { id: 'insert', copyKey: 'tipInsert', anchor: 'insert' },
  { id: 'inlineText', copyKey: 'tipInlineText', anchor: 'inlineText' },
  { id: 'focusInspect', copyKey: 'tipFocusInspect', anchor: 'focusInspect' },
  { id: 'inspect', copyKey: 'tipInspect', anchor: 'inspect' },
  { id: 'openTokens', copyKey: 'tipOpenTokens', anchor: 'openTokens' },
  { id: 'tokenPick', copyKey: 'tipTokenPick', anchor: 'tokenPick' },
  { id: 'tokenBind', copyKey: 'tipTokenBind', anchor: 'tokenBind' },
  { id: 'breakpoints', copyKey: 'tipBreakpoints', anchor: 'breakpoints' },
  { id: 'activateBreakpoint', copyKey: 'tipActivateBreakpoint', anchor: 'activateBreakpoint' },
  { id: 'preview', copyKey: 'tipPreview', anchor: 'preview' },
])

export type OnboardingCopyPack = {
  brandLabel: string
  welcomeTitle: string
  welcomeBody: string
  emptyTitle: string
  emptyBody: string
  openSample: string
  openSampleHint: string
  explore: string
  letsStart: string
  later: string
  busyOpen: string
  tipNext: string
  tipDone: string
  tipSkip: string
  tipDrag: string
  tipProgress: (n: number, total: number) => string
  tipSelect: string
  tipOpenComponents: string
  tipInsert: string
  tipInlineText: string
  tipFocusInspect: string
  tipInspect: string
  tipOpenTokens: string
  tipTokenPick: string
  tipTokenBind: string
  tipBreakpoints: string
  tipActivateBreakpoint: string
  tipPreview: string
  doneTitle: string
  doneBody: string
  doneCta: string
}

export const onboardingCopy: Record<OnboardingLocale, OnboardingCopyPack> = {
  de: {
    brandLabel: 'Zaoly',
    welcomeTitle: 'Design, das als Komponente weiterlebt.',
    welcomeBody:
      'Starte mit dem Beispiel-Landing — danach zeigen wir dir die wichtigsten Editor-Schritte.',
    emptyTitle: 'Dein Artboard ist noch leer.',
    emptyBody: 'Starte mit dem Beispiel-Landing — danach führen wir dich Schritt für Schritt.',
    openSample: 'Beispiel öffnen',
    openSampleHint: 'Default-Landing mit Kit-Atomen und Tokens',
    explore: 'Selbst entdecken',
    letsStart: 'Loslegen',
    later: 'Später',
    busyOpen: 'Öffne…',
    tipNext: 'Weiter',
    tipDone: 'Fertig',
    tipSkip: 'Überspringen',
    tipDrag: 'Tipp verschieben',
    tipProgress: (n, total) => `${n} / ${total}`,
    tipSelect: 'Klicke ein Element auf dem Canvas — Auswahl steuert Inspect und HUD.',
    tipOpenComponents: 'Öffne den Tab Components links — dort liegt die Kit-Palette.',
    tipInsert:
      'Gut — wähle ein Kit-Atom (z. B. Button): Klick fügt ein, oder ziehe es auf die dann hell markierte Zeichenfläche.',
    tipInlineText:
      'Doppelklick auf den markierten Button (oder Text) — Label direkt ändern, Enter übernimmt.',
    tipFocusInspect:
      'Rechts siehst du den Inspector — Props und Bindungen der aktuellen Auswahl.',
    tipInspect: 'Ändere jetzt ein Feld im Inspector (z. B. Text, Farbe oder Abstände).',
    tipOpenTokens: 'Klicke links auf Tokens — dort liegt dein lokales Pack.',
    tipTokenPick: 'Klicke oben eine Farbe an (z. B. action.primary) — nur auswählen, noch nicht binden.',
    tipTokenBind:
      'Jetzt binden: Farbe auf ein Element ziehen oder im Inspector an ein Farbfeld koppeln.',
    tipBreakpoints: 'Schalte Breakpoint Compare ein — Desktop, Tablet und Mobile nebeneinander.',
    tipActivateBreakpoint: 'Klicke die Tablet- oder Mobile-Kachel — dort schreibst du Overrides.',
    tipPreview: 'Über Export / Preview gibst du Entwicklern den Handoff-Kontext.',
    doneTitle: 'Du bist startklar.',
    doneBody:
      'Auswählen, einfügen, Text, Inspect, Tokens, Breakpoints, Preview — der Editor gehört dir.',
    doneCta: 'Loslegen',
  },
  en: {
    brandLabel: 'Zaoly',
    welcomeTitle: 'Design that lives on as a component.',
    welcomeBody: 'Start with the sample landing — then we walk you through the key editor moves.',
    emptyTitle: 'Your artboard is still empty.',
    emptyBody: 'Start with the sample landing — then we walk you through the key moves.',
    openSample: 'Open sample',
    openSampleHint: 'Default landing with kit atoms and tokens',
    explore: 'Explore on my own',
    letsStart: "Let's start",
    later: 'Later',
    busyOpen: 'Opening…',
    tipNext: 'Next',
    tipDone: 'Done',
    tipSkip: 'Skip',
    tipDrag: 'Move tip',
    tipProgress: (n, total) => `${n} / ${total}`,
    tipSelect: 'Click an element on the canvas — selection drives Inspect and the HUD.',
    tipOpenComponents: 'Open the Components tab on the left — that is your kit palette.',
    tipInsert:
      'Nice — pick a kit atom (e.g. Button): click to insert, or drag it onto the canvas that lights up.',
    tipInlineText:
      'Double-click the highlighted button (or text) — edit the label; Enter commits.',
    tipFocusInspect:
      'On the right is Inspect — props and bindings for the current selection.',
    tipInspect: 'Now change a field in Inspect (copy, color, or spacing).',
    tipOpenTokens: 'Click Tokens on the left — that is your local pack.',
    tipTokenPick: 'Click a color near the top (e.g. action.primary) — just pick it, do not bind yet.',
    tipTokenBind:
      'Now bind it: drag the color onto an element or attach it in Inspect.',
    tipBreakpoints: 'Turn on Breakpoint Compare — desktop, tablet, and mobile side by side.',
    tipActivateBreakpoint: 'Click the Tablet or Mobile tile — that is where overrides write.',
    tipPreview: 'Use Export / Preview to give developers the handoff context.',
    doneTitle: "You're ready.",
    doneBody:
      'Select, insert, text, inspect, tokens, breakpoints, preview — the editor is yours.',
    doneCta: "Let's go",
  },
}

export function resolveOnboardingLocale(
  search = typeof window !== 'undefined' ? window.location.search : '',
  fallback: OnboardingLocale = 'en',
): OnboardingLocale {
  const q = new URLSearchParams(search).get('lang')
  if (q === 'de' || q === 'en') return q
  if (typeof window !== 'undefined') {
    try {
      const stored = window.localStorage.getItem(paths.localeStorageKey)
      if (stored === 'de' || stored === 'en') return stored
    } catch {
      /* ignore */
    }
  }
  return fallback
}

export function resolveOnboardingCopy(
  search = typeof window !== 'undefined' ? window.location.search : '',
  locale?: OnboardingLocale,
): OnboardingCopyPack {
  const lang = locale ?? resolveOnboardingLocale(search)
  return onboardingCopy[lang] ?? onboardingCopy.en
}

export function wantsOnboardingReset(search = ''): boolean {
  const flag = new URLSearchParams(search).get(paths.onboarding.queryParam)
  return flag === '1' || flag === 'reset'
}

export function isBoardEmpty(rootCount: number): boolean {
  return Number(rootCount) === 0
}

function readFlag(store: Storage | null, key: string): boolean {
  if (!store) return false
  try {
    return store.getItem(key) === '1'
  } catch {
    return false
  }
}

function writeFlag(store: Storage | null, key: string): void {
  if (!store) return
  try {
    store.setItem(key, '1')
  } catch {
    /* ignore */
  }
}

function clearFlag(store: Storage | null, key: string): void {
  if (!store) return
  try {
    store.removeItem(key)
  } catch {
    /* ignore */
  }
}

function readRaw(store: Storage | null, key: string): string | null {
  if (!store) return null
  try {
    return store.getItem(key)
  } catch {
    return null
  }
}

function writeRaw(store: Storage | null, key: string, value: string): void {
  if (!store) return
  try {
    store.setItem(key, value)
  } catch {
    /* ignore */
  }
}

export function clearOnboardingFlags({
  local = typeof localStorage !== 'undefined' ? localStorage : null,
  session = typeof sessionStorage !== 'undefined' ? sessionStorage : null,
}: {
  local?: Storage | null
  session?: Storage | null
} = {}): void {
  clearFlag(local, paths.onboarding.welcomeStorageKey)
  clearFlag(local, paths.onboarding.tourStorageKey)
  clearFlag(session, paths.onboarding.emptySkipStorageKey)
  clearOnboardingInsertNodeId()
}

export function applyOnboardingQueryReset({
  search = typeof window !== 'undefined' ? window.location.search : '',
  local = typeof localStorage !== 'undefined' ? localStorage : null,
  session = typeof sessionStorage !== 'undefined' ? sessionStorage : null,
}: {
  search?: string
  local?: Storage | null
  session?: Storage | null
} = {}): { reset: boolean } {
  if (!wantsOnboardingReset(search)) return { reset: false }
  clearOnboardingFlags({ local, session })
  return { reset: true }
}

export function hasSeenWelcome(
  storage = typeof localStorage !== 'undefined' ? localStorage : null,
): boolean {
  return readFlag(storage, paths.onboarding.welcomeStorageKey)
}

export function markWelcomeSeen(
  storage = typeof localStorage !== 'undefined' ? localStorage : null,
): void {
  writeFlag(storage, paths.onboarding.welcomeStorageKey)
}

export function shouldShowWelcome({
  search = typeof window !== 'undefined' ? window.location.search : '',
  storage = typeof localStorage !== 'undefined' ? localStorage : null,
}: {
  search?: string
  storage?: Storage | null
} = {}): boolean {
  void search
  return !hasSeenWelcome(storage)
}

export function hasSkippedEmptyCoach(
  storage = typeof sessionStorage !== 'undefined' ? sessionStorage : null,
): boolean {
  return readFlag(storage, paths.onboarding.emptySkipStorageKey)
}

export function markEmptyCoachSkipped(
  storage = typeof sessionStorage !== 'undefined' ? sessionStorage : null,
): void {
  writeFlag(storage, paths.onboarding.emptySkipStorageKey)
}

export function shouldShowEmptyCoach({
  rootCount,
  welcomeOpen = false,
  local = typeof localStorage !== 'undefined' ? localStorage : null,
  session = typeof sessionStorage !== 'undefined' ? sessionStorage : null,
}: {
  rootCount: number
  welcomeOpen?: boolean
  local?: Storage | null
  session?: Storage | null
}): boolean {
  if (welcomeOpen) return false
  if (!hasSeenWelcome(local)) return false
  if (!isBoardEmpty(rootCount)) return false
  if (hasSkippedEmptyCoach(session)) return false
  return true
}

export function getTourProgress(
  storage = typeof localStorage !== 'undefined' ? localStorage : null,
): 'done' | number {
  if (!storage) return 'done'
  const raw = readRaw(storage, paths.onboarding.tourStorageKey)
  if (raw === 'done') return 'done'
  if (raw == null || raw === '') return 0
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0) return 0
  if (n >= GUIDED_TOUR_STEPS.length) return 'done'
  return Math.floor(n)
}

export function isTourDone(
  storage = typeof localStorage !== 'undefined' ? localStorage : null,
): boolean {
  return getTourProgress(storage) === 'done'
}

export function setTourProgress(
  stepOrDone: number | 'done',
  storage = typeof localStorage !== 'undefined' ? localStorage : null,
): void {
  if (!storage) return
  if (stepOrDone === 'done') {
    writeRaw(storage, paths.onboarding.tourStorageKey, 'done')
    return
  }
  const n = Math.max(0, Math.min(GUIDED_TOUR_STEPS.length, Number(stepOrDone) || 0))
  if (n >= GUIDED_TOUR_STEPS.length) writeRaw(storage, paths.onboarding.tourStorageKey, 'done')
  else writeRaw(storage, paths.onboarding.tourStorageKey, String(n))
}

export function markTourDone(
  storage = typeof localStorage !== 'undefined' ? localStorage : null,
): void {
  setTourProgress('done', storage)
  clearOnboardingInsertNodeId()
}

/** Node id from the most recent palette insert during the guided tour (inlineText spotlight). */
let lastOnboardingInsertNodeId: string | null = null

export function rememberOnboardingInsertNodeId(nodeId: string | null | undefined): void {
  const id = typeof nodeId === 'string' ? nodeId.trim() : ''
  lastOnboardingInsertNodeId = id || null
}

export function getLastOnboardingInsertNodeId(): string | null {
  return lastOnboardingInsertNodeId
}

export function clearOnboardingInsertNodeId(): void {
  lastOnboardingInsertNodeId = null
}

/** Canvas DOM for the fresh insert — preferred inlineText highlight. */
export function resolveLastInsertHighlightTarget(): Element | null {
  const id = lastOnboardingInsertNodeId
  if (!id || typeof document === 'undefined') return null
  const escaped =
    typeof CSS !== 'undefined' && typeof CSS.escape === 'function' ? CSS.escape(id) : id
  const selectors = [
    `.creation-scene-page-frame--active [data-node-id="${escaped}"]`,
    `[data-node-id="${escaped}"]`,
  ]
  for (const sel of selectors) {
    const el = document.querySelector(sel)
    if (el) return el
  }
  return null
}

export function shouldStartTour({
  storage = typeof localStorage !== 'undefined' ? localStorage : null,
}: {
  storage?: Storage | null
} = {}): boolean {
  if (!hasSeenWelcome(storage)) return false
  return !isTourDone(storage)
}

export function getTourStep(index: number): GuidedTourStep | null {
  if (typeof index !== 'number' || index < 0 || index >= GUIDED_TOUR_STEPS.length) return null
  return GUIDED_TOUR_STEPS[index] ?? null
}

export function compositionCountsFromDetail(detail: unknown): { rootCount: number } {
  const rootCount = Number((detail as { rootCount?: unknown } | null)?.rootCount)
  return { rootCount: Number.isFinite(rootCount) ? rootCount : 0 }
}

/**
 * Granular DOM candidates for a tour step (individual nodes / palette rows / fields).
 * Prefer small interactive targets over whole panels/artboards.
 */
export function tipAnchorSelector(tipId: string | null | undefined): string | null {
  if (tipId === 'select') {
    return [
      '.creation-scene-page-frame--active .creation-scene-node[data-node-type="SiteButton"]',
      '.creation-scene-page-frame--active .creation-scene-node[data-node-type="Button"]',
      '.creation-scene-page-frame--active .creation-scene-node[data-node-type="SiteText"]',
      '.creation-scene-page-frame--active .creation-scene-node[data-node-type="Heading"]',
      '.creation-scene-page-frame--active .creation-scene-node[data-node-type="Text"]',
      '.creation-scene-page-frame--active .creation-scene-node[data-node-type="Instance"]',
      '.creation-scene-page-frame--active .creation-scene-node[data-node-id]',
      '[data-onboarding-anchor="select"]',
    ].join(', ')
  }
  if (tipId === 'openComponents') {
    return [
      '[data-testid="editor-left-tab-components"]',
      '[data-onboarding-anchor="openComponents"]',
    ].join(', ')
  }
  if (tipId === 'insert') {
    return [
      '[data-testid="creation-editor-palette"] .ds-component-palette__item',
      '[data-testid="creation-editor-palette"] .ds-component-palette__btn',
      '[data-onboarding-anchor="insert"]',
    ].join(', ')
  }
  if (tipId === 'inlineText') {
    return [
      '.creation-scene-page-frame--active .creation-scene-node[data-node-type="SiteButton"]',
      '.creation-scene-page-frame--active .creation-scene-node[data-node-type="Button"]',
      '.creation-scene-page-frame--active .creation-scene-node[data-node-type="SiteText"]',
      '.creation-scene-page-frame--active .creation-scene-node[data-node-type="Text"]',
      '.creation-scene-page-frame--active .creation-scene-node[data-node-type="Heading"]',
      '.creation-scene-page-frame--active .creation-scene-node[data-node-type="SiteLink"]',
      '.creation-scene-page-frame--active .creation-scene-node[data-node-type="Link"]',
      '[data-onboarding-anchor="inlineText"]',
    ].join(', ')
  }
  if (tipId === 'focusInspect') {
    return [
      '[data-testid="creation-editor-inspector"]',
      '[data-testid="creation-editor-right"]',
      '[data-onboarding-anchor="focusInspect"]',
    ].join(', ')
  }
  if (tipId === 'inspect') {
    return [
      '[data-testid^="inspect-literal-"]',
      '[data-testid^="inspect-token-"]',
      '[data-testid="inspect-section"]',
      '[data-testid="inspect-tabs"] [data-testid^="inspect-tab-"]',
      '[data-onboarding-anchor="inspect"]',
      '[data-testid="creation-editor-inspector"]',
    ].join(', ')
  }
  if (tipId === 'openTokens') {
    return [
      '[data-testid="editor-left-tab-tokens"]',
      '[data-onboarding-anchor="openTokens"]',
    ].join(', ')
  }
  if (tipId === 'tokenPick' || tipId === 'tokenBind') {
    // Prefer color rows near the top of Local Pack — avoid scrolling deep lists.
    return [
      '[data-testid^="token-studio-row-color.action.primary"]',
      '[data-testid^="token-studio-row-color.action."]',
      '[data-testid^="token-studio-row-color."]',
      '[data-testid="token-studio-filter-color"]',
      '[data-testid^="token-studio-row-"]',
      '[data-testid^="inspect-token-"]',
      `[data-onboarding-anchor="${tipId}"]`,
    ].join(', ')
  }
  if (tipId === 'breakpoints') {
    return '[data-testid="editor-breakpoint-compare"]'
  }
  if (tipId === 'activateBreakpoint') {
    return [
      '[data-breakpoint-tile="tablet"]',
      '[data-breakpoint-tile="mobile"]',
      '[data-node-id="__bp-tile:tablet"]',
      '[data-node-id="__bp-tile:mobile"]',
      '[data-onboarding-anchor="activateBreakpoint"]',
    ].join(', ')
  }
  if (tipId === 'preview') {
    return [
      '[data-testid="editor-html-preview-toggle"]',
      '[data-testid="editor-topbar-menu-export"]',
      '[data-onboarding-anchor="preview"]',
    ].join(', ')
  }
  return null
}

/** Max rings per step — keep spotlights small and readable. */
export const ONBOARDING_HIGHLIGHT_MAX = 2

/** Skip artboard-scale targets (px²). ~half a phone viewport. */
export const ONBOARDING_HIGHLIGHT_MAX_AREA = 280 * 200

/** Ignore tiny hit targets (handles, icons). */
export const ONBOARDING_HIGHLIGHT_MIN_SIDE = 14

/**
 * Prefer compact, non-nested targets (smallest first) so we never spotlight the whole artboard.
 */
export function pickGranularHighlightTargets(
  candidates: Element[],
  opts: { max?: number; maxArea?: number; minSide?: number } = {},
): Element[] {
  const max = opts.max ?? ONBOARDING_HIGHLIGHT_MAX
  const maxArea = opts.maxArea ?? ONBOARDING_HIGHLIGHT_MAX_AREA
  const minSide = opts.minSide ?? ONBOARDING_HIGHLIGHT_MIN_SIDE
  const scored = candidates
    .map((el) => {
      if (typeof (el as HTMLElement).getBoundingClientRect !== 'function') {
        return null
      }
      const r = (el as HTMLElement).getBoundingClientRect()
      const area = r.width * r.height
      return { el, r, area }
    })
    .filter((row): row is { el: Element; r: DOMRect; area: number } => {
      if (!row) return false
      const { r, area } = row
      return r.width >= minSide && r.height >= minSide && area > 0 && area <= maxArea
    })
    .sort((a, b) => a.area - b.area)

  const picked: Element[] = []
  for (const { el } of scored) {
    if (picked.some((p) => p.contains(el) || el.contains(p))) continue
    picked.push(el)
    if (picked.length >= max) break
  }
  // Fallback: if everything was too big (empty board chrome only), take the smallest candidate.
  if (picked.length === 0 && candidates.length > 0) {
    const fallback = candidates
      .map((el) => {
        const r = (el as HTMLElement).getBoundingClientRect?.()
        if (!r || r.width < 2 || r.height < 2) return null
        return { el, area: r.width * r.height }
      })
      .filter((row): row is { el: Element; area: number } => Boolean(row))
      .sort((a, b) => a.area - b.area)
    if (fallback[0]) picked.push(fallback[0].el)
  }
  return picked
}

/** Where to release a dragged palette atom during the insert tip. */
export function tipInsertDropZoneSelector(): string {
  return [
    '.creation-scene-page-frame--active',
    '[data-testid="creation-editor-canvas"] .ds-canvas-viewport__artboard',
    '[data-testid="creation-editor-canvas"] .creation-editor-canvas__pad',
    '[data-testid="creation-editor-canvas"]',
  ].join(', ')
}

/**
 * Active artboard / page frame for the insert drop guide (may be large — not granular).
 */
export function resolveInsertDropZoneTargets(): Element[] {
  if (typeof document === 'undefined') return []
  const candidates = Array.from(document.querySelectorAll(tipInsertDropZoneSelector()))
  for (const el of candidates) {
    if (typeof (el as HTMLElement).getBoundingClientRect !== 'function') continue
    const r = (el as HTMLElement).getBoundingClientRect()
    if (r.width >= 80 && r.height >= 80) return [el]
  }
  return candidates.slice(0, 1)
}

/** Palette row under a pointer / drag event (insert drop-guide gate). */
export function isOnboardingPalettePickTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof Element)) return false
  return Boolean(
    target.closest(
      '[data-testid="creation-editor-palette"] .ds-component-palette__item, [data-testid="creation-editor-palette"] .ds-component-palette__btn, [data-onboarding-anchor="insert"]',
    ),
  )
}

export function resolveHighlightTargets(tipId: string | null | undefined): Element[] {
  const all = resolveTipAnchors(tipId)
  if (tipId === 'breakpoints' || tipId === 'preview') {
    return pickGranularHighlightTargets(all, { max: 1, maxArea: 120 * 80 })
  }
  if (tipId === 'openComponents' || tipId === 'openTokens') {
    return pickGranularHighlightTargets(all, { max: 1, maxArea: 200 * 48 })
  }
  if (tipId === 'tokenPick' || tipId === 'tokenBind') {
    const colorRows = all.filter((el) => {
      const id = el.getAttribute('data-testid') ?? ''
      return id.startsWith('token-studio-row-color.')
    })
    const preferred = colorRows.length > 0 ? colorRows : all
    return pickGranularHighlightTargets(preferred, { max: 1, maxArea: 420 * 56 })
  }
  if (tipId === 'focusInspect') {
    return pickGranularHighlightTargets(all, { max: 1, maxArea: 480 * 900 })
  }
  if (tipId === 'insert' || tipId === 'inspect') {
    return pickGranularHighlightTargets(all, { max: 1, maxArea: 360 * 64 })
  }
  if (tipId === 'activateBreakpoint') {
    return pickGranularHighlightTargets(all, { max: 1, maxArea: 900 * 120 })
  }
  if (tipId === 'inlineText') {
    const fresh = resolveLastInsertHighlightTarget()
    if (fresh) return [fresh]
    return pickGranularHighlightTargets(all, { max: 1, maxArea: ONBOARDING_HIGHLIGHT_MAX_AREA })
  }
  // select: up to two small/medium canvas nodes
  return pickGranularHighlightTargets(all, { max: ONBOARDING_HIGHLIGHT_MAX })
}

export type HighlightRect = { top: number; left: number; width: number; height: number }

export function highlightRectsForTargets(targets: Element[]): HighlightRect[] {
  const out: HighlightRect[] = []
  for (const el of targets) {
    if (typeof (el as HTMLElement).getBoundingClientRect !== 'function') continue
    const r = (el as HTMLElement).getBoundingClientRect()
    if (r.width < 2 && r.height < 2) continue
    // Slight padding so thin text lines still read as a target.
    const pad = 3
    out.push({
      top: r.top - pad,
      left: r.left - pad,
      width: r.width + pad * 2,
      height: r.height + pad * 2,
    })
  }
  return out
}

/** Default landing snapshot preserving current scene identity (spec onboarding.md). */
export function buildOnboardingSampleScene(current: CompositionScene): CompositionScene {
  const sample = createZaolyDefaultLandingScene(current.platformProjectId ?? null)
  return {
    ...sample,
    id: current.id,
    name: current.name || sample.name,
    platformProjectId: current.platformProjectId ?? sample.platformProjectId,
    updatedAt: new Date().toISOString(),
  }
}

export function tourStepAction(stepId: string): OnboardingActionId | null {
  if (
    stepId === 'select' ||
    stepId === 'openComponents' ||
    stepId === 'insert' ||
    stepId === 'inlineText' ||
    stepId === 'inspect' ||
    stepId === 'openTokens' ||
    stepId === 'tokenPick' ||
    stepId === 'tokenBind' ||
    stepId === 'breakpoints' ||
    stepId === 'activateBreakpoint' ||
    stepId === 'preview'
  ) {
    return stepId
  }
  // focusInspect is Next-only (no action auto-advance).
  return null
}

/** Whether an emitted action completes the current tour step. */
export function matchesTourAction(stepId: string, action: string): boolean {
  if (!stepId || !action) return false
  if (stepId === 'openTokens' && (action === 'openTokens' || action === 'tokens')) return true
  if (stepId === 'openComponents' && (action === 'openComponents' || action === 'insert')) {
    // Inserting while still on openComponents also counts (palette already visible).
    return action === 'openComponents'
  }
  if (stepId === 'tokenPick' && (action === 'tokenPick' || action === 'tokenBind')) {
    // Binding early still completes pick (user already chose a color).
    return true
  }
  return tourStepAction(stepId) === action
}

/**
 * Tab-open steps are already done if that left tab is selected
 * (session restore / previous tour actions) — host should auto-advance.
 */
export function isTourStepAlreadySatisfied(stepId: string): boolean {
  if (typeof document === 'undefined') return false
  if (stepId === 'openTokens') {
    const tab = document.querySelector('[data-testid="editor-left-tab-tokens"]')
    return tab?.getAttribute('aria-selected') === 'true'
  }
  if (stepId === 'openComponents') {
    const tab = document.querySelector('[data-testid="editor-left-tab-components"]')
    return tab?.getAttribute('aria-selected') === 'true'
  }
  return false
}

export function resolveTipAnchors(tipId: string | null | undefined): Element[] {
  const sel = tipAnchorSelector(tipId)
  if (!sel || typeof document === 'undefined') return []
  return Array.from(document.querySelectorAll(sel))
}

export function resolveTipAnchor(tipId: string | null | undefined): Element | null {
  return resolveTipAnchors(tipId)[0] ?? null
}

export type TipPlacement = 'above' | 'below' | 'beside'

/**
 * Place tip near an anchor without covering left-rail targets (Tokens list)
 * or sliding under hub bar + tool strip.
 * Returns null → host falls back to bottom-center dock.
 */
export function computeTipPosition(
  anchorEl: Element | null,
  tipWidth = 320,
  tipHeight = 148,
  margin = 12,
  topInset = 56,
): { top: number; left: number; placement: TipPlacement } | null {
  if (!anchorEl || typeof (anchorEl as HTMLElement).getBoundingClientRect !== 'function') {
    return null
  }
  const rect = (anchorEl as HTMLElement).getBoundingClientRect()
  if (rect.width < 2 && rect.height < 2) return null
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const chromeTop =
    typeof document !== 'undefined'
      ? (() => {
          const raw = getComputedStyle(document.documentElement)
            .getPropertyValue('--creation-editor-chrome-inset')
            .trim()
          const parsed = Number.parseFloat(raw)
          return Number.isFinite(parsed) && parsed > 0 ? parsed : topInset
        })()
      : topInset

  // Left-rail / token rows: park tip to the right so it does not cover the swatch.
  const minTop = chromeTop + margin
  const maxTop = vh - tipHeight - margin
  const preferBeside = rect.left < vw * 0.45
  if (preferBeside && maxTop >= minTop) {
    const besideLeft = rect.right + margin + 8
    if (besideLeft + tipWidth <= vw - margin) {
      const top = Math.min(Math.max(minTop, rect.top - 8), maxTop)
      return { top, left: besideLeft, placement: 'beside' }
    }
  }

  const belowTop = rect.bottom + margin
  const aboveTop = rect.top - tipHeight - margin
  const fitsBelow = belowTop + tipHeight <= vh - margin
  const fitsAbove = aboveTop >= chromeTop + margin

  let top: number
  let placement: TipPlacement
  if (fitsBelow) {
    top = Math.max(belowTop, chromeTop + margin)
    placement = 'below'
  } else if (fitsAbove) {
    top = aboveTop
    placement = 'above'
  } else {
    return null
  }

  let left = rect.left + rect.width / 2 - tipWidth / 2
  left = Math.min(Math.max(margin, left), vw - tipWidth - margin)
  return { top, left, placement }
}

/** Clamp a dragged tip into the visible viewport (below chrome). */
export function clampTipDragPosition(
  top: number,
  left: number,
  tipWidth = 320,
  tipHeight = 148,
  margin = 12,
  topInset = 56,
): { top: number; left: number } {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  return {
    top: Math.min(Math.max(topInset + margin, top), vh - tipHeight - margin),
    left: Math.min(Math.max(margin, left), vw - tipWidth - margin),
  }
}

export function countActivePageChildren(scene: {
  pages?: Array<{ id: string; root: { children?: unknown[] } }>
  activePageId?: string | null
  root?: { children?: unknown[] } | null
}): number {
  const pages = scene.pages
  if (pages && pages.length > 0) {
    const active =
      pages.find((p) => p.id === scene.activePageId) ?? pages[0]
    return active?.root.children?.length ?? 0
  }
  return scene.root?.children?.length ?? 0
}

export function dispatchOnboardingAction(action: OnboardingActionId): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent(paths.onboarding.actionEvent, { detail: { action } }),
  )
}

export function dispatchCompositionChanged(rootCount: number): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent(paths.onboarding.compositionChangedEvent, {
      detail: { rootCount },
    }),
  )
}

/** Ask chrome panels to focus a useful target for the current tour step. */
export function dispatchOnboardingPrepare(stepId: string): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent(paths.onboarding.prepareEvent, { detail: { stepId } }),
  )
}

/** After prepare (color filter), scroll first color row into view for spotlight. */
export function focusTokenBindHighlightTarget(): Element | null {
  if (typeof document === 'undefined') return null
  const preferred = [
    '[data-testid^="token-studio-row-color.action.primary"]',
    '[data-testid^="token-studio-row-color.action."]',
    '[data-testid^="token-studio-row-color."]',
  ]
  for (const sel of preferred) {
    const el = document.querySelector(sel)
    if (!el) continue
    const node = el as HTMLElement
    if (typeof node.scrollIntoView === 'function') {
      node.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    }
    return el
  }
  return null
}
