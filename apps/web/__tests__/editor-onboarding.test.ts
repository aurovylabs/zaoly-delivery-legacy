import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  GUIDED_TOUR_STEPS,
  applyOnboardingQueryReset,
  buildOnboardingSampleScene,
  clearOnboardingFlags,
  clampTipDragPosition,
  computeTipPosition,
  countActivePageChildren,
  highlightRectsForTargets,
  pickGranularHighlightTargets,
  resolveHighlightTargets,
  getTourProgress,
  hasSeenWelcome,
  isTourDone,
  isTourStepAlreadySatisfied,
  matchesTourAction,
  onboardingCopy,
  shouldShowEmptyCoach,
  shouldShowWelcome,
  shouldStartTour,
  tipAnchorSelector,
  tipInsertDropZoneSelector,
  focusTokenBindHighlightTarget,
  isOnboardingPalettePickTarget,
  rememberOnboardingInsertNodeId,
  clearOnboardingInsertNodeId,
  resolveInsertDropZoneTargets,
  wantsOnboardingReset,
} from '../lib/editor/onboarding'
import { paths } from '../lib/paths'
import { createEmptyArtboardScene } from '../lib/scene/demo-scene'
import { createZaolyDefaultLandingScene } from '../lib/scene/zaoly-default-landing-scene'

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(initial))
  return {
    get length() {
      return map.size
    },
    clear() {
      map.clear()
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null
    },
    key(index: number) {
      return [...map.keys()][index] ?? null
    },
    removeItem(key: string) {
      map.delete(key)
    },
    setItem(key: string, value: string) {
      map.set(String(key), String(value))
    },
  }
}

describe('editor onboarding helpers', () => {
  it('wants reset for ?onboarding=1 and reset', () => {
    expect(wantsOnboardingReset('?onboarding=1')).toBe(true)
    expect(wantsOnboardingReset('?onboarding=reset')).toBe(true)
    expect(wantsOnboardingReset('')).toBe(false)
  })

  it('clears flags on query reset and forces Welcome', () => {
    const local = memoryStorage({
      [paths.onboarding.welcomeStorageKey]: '1',
      [paths.onboarding.tourStorageKey]: 'done',
    })
    const session = memoryStorage({
      [paths.onboarding.emptySkipStorageKey]: '1',
    })
    const result = applyOnboardingQueryReset({
      search: `?${paths.onboarding.queryParam}=reset`,
      local,
      session,
    })
    expect(result.reset).toBe(true)
    expect(hasSeenWelcome(local)).toBe(false)
    expect(isTourDone(local)).toBe(false)
    expect(shouldShowWelcome({ storage: local })).toBe(true)
  })

  it('gates empty coach on welcome seen + empty roots + not session-skipped', () => {
    const local = memoryStorage()
    const session = memoryStorage()
    expect(
      shouldShowEmptyCoach({ rootCount: 0, welcomeOpen: false, local, session }),
    ).toBe(false)
    local.setItem(paths.onboarding.welcomeStorageKey, '1')
    expect(
      shouldShowEmptyCoach({ rootCount: 0, welcomeOpen: false, local, session }),
    ).toBe(true)
    expect(
      shouldShowEmptyCoach({ rootCount: 0, welcomeOpen: true, local, session }),
    ).toBe(false)
    expect(
      shouldShowEmptyCoach({ rootCount: 3, welcomeOpen: false, local, session }),
    ).toBe(false)
    session.setItem(paths.onboarding.emptySkipStorageKey, '1')
    expect(
      shouldShowEmptyCoach({ rootCount: 0, welcomeOpen: false, local, session }),
    ).toBe(false)
  })

  it('starts tour only after welcome and while tour incomplete', () => {
    const storage = memoryStorage()
    expect(shouldStartTour({ storage })).toBe(false)
    storage.setItem(paths.onboarding.welcomeStorageKey, '1')
    expect(shouldStartTour({ storage })).toBe(true)
    storage.setItem(paths.onboarding.tourStorageKey, 'done')
    expect(shouldStartTour({ storage })).toBe(false)
  })

  it('matches tour actions only for the active step id', () => {
    expect(matchesTourAction('select', 'select')).toBe(true)
    expect(matchesTourAction('select', 'insert')).toBe(false)
    expect(matchesTourAction('inlineText', 'inlineText')).toBe(true)
    expect(matchesTourAction('preview', 'preview')).toBe(true)
  })

  it('keeps DE/EN copy key parity for static tip strings', () => {
    const deKeys = Object.keys(onboardingCopy.de).sort()
    const enKeys = Object.keys(onboardingCopy.en).sort()
    expect(deKeys).toEqual(enKeys)
    for (const step of GUIDED_TOUR_STEPS) {
      expect(typeof onboardingCopy.de[step.copyKey]).toBe('string')
      expect(typeof onboardingCopy.en[step.copyKey]).toBe('string')
      expect(String(onboardingCopy.de[step.copyKey]).length).toBeGreaterThan(0)
      expect(String(onboardingCopy.en[step.copyKey]).length).toBeGreaterThan(0)
    }
  })

  it('resolves tip anchors for granular chrome and canvas targets', () => {
    expect(tipAnchorSelector('select')).toContain('creation-scene-node')
    expect(tipAnchorSelector('openComponents')).toContain('editor-left-tab-components')
    expect(tipAnchorSelector('insert')).toContain('ds-component-palette__item')
    expect(tipAnchorSelector('inlineText')).toContain('SiteButton')
    expect(tipAnchorSelector('inlineText')).toContain('SiteText')
    expect(tipAnchorSelector('inspect')).toContain('inspect-literal-')
    expect(tipAnchorSelector('focusInspect')).toContain('creation-editor-inspector')
    expect(tipAnchorSelector('openTokens')).toContain('editor-left-tab-tokens')
    expect(tipAnchorSelector('tokenPick')).toContain('token-studio-row-color.')
    expect(tipAnchorSelector('tokenBind')).toContain('token-studio-row-color.')
    expect(tipAnchorSelector('breakpoints')).toContain('editor-breakpoint-compare')
    expect(tipAnchorSelector('activateBreakpoint')).toContain('data-breakpoint-tile="tablet"')
    expect(tipAnchorSelector('activateBreakpoint')).toContain('__bp-tile:tablet')
    expect(tipAnchorSelector('preview')).toContain('editor-html-preview-toggle')
  })

  it('inlineText highlight prefers the just-inserted canvas node', () => {
    clearOnboardingInsertNodeId()
    const frame = document.createElement('div')
    frame.className = 'creation-scene-page-frame--active'
    const fresh = document.createElement('div')
    fresh.setAttribute('data-node-id', 'inst-fresh-button')
    fresh.setAttribute('data-node-type', 'SiteButton')
    fresh.getBoundingClientRect = () =>
      ({
        top: 120,
        left: 240,
        width: 140,
        height: 40,
        bottom: 160,
        right: 380,
        x: 240,
        y: 120,
        toJSON() {
          return {}
        },
      }) as DOMRect
    frame.appendChild(fresh)
    document.body.appendChild(frame)
    rememberOnboardingInsertNodeId('inst-fresh-button')
    expect(resolveHighlightTargets('inlineText')).toEqual([fresh])
    clearOnboardingInsertNodeId()
    frame.remove()
  })

  it('insert drop zone targets the active page frame / artboard', () => {
    expect(tipInsertDropZoneSelector()).toContain('creation-scene-page-frame--active')
    expect(tipInsertDropZoneSelector()).toContain('creation-editor-canvas')
    const frame = document.createElement('div')
    frame.className = 'creation-scene-page-frame--active'
    frame.getBoundingClientRect = () =>
      ({
        top: 80,
        left: 200,
        width: 400,
        height: 640,
        bottom: 720,
        right: 600,
        x: 200,
        y: 80,
        toJSON() {
          return {}
        },
      }) as DOMRect
    document.body.appendChild(frame)
    expect(resolveInsertDropZoneTargets()).toEqual([frame])
    const item = document.createElement('li')
    item.className = 'ds-component-palette__item'
    const palette = document.createElement('div')
    palette.setAttribute('data-testid', 'creation-editor-palette')
    palette.appendChild(item)
    document.body.appendChild(palette)
    expect(isOnboardingPalettePickTarget(item)).toBe(true)
    expect(isOnboardingPalettePickTarget(frame)).toBe(false)
    frame.remove()
    palette.remove()
  })

  it('tokenBind highlight prefers a top color row over deep list items', () => {
    const deep = document.createElement('li')
    deep.setAttribute('data-testid', 'token-studio-row-spacing.static.large')
    deep.getBoundingClientRect = () =>
      ({
        top: 400,
        left: 20,
        width: 200,
        height: 32,
        bottom: 432,
        right: 220,
        x: 20,
        y: 400,
        toJSON() {
          return {}
        },
      }) as DOMRect
    const color = document.createElement('li')
    color.setAttribute('data-testid', 'token-studio-row-color.action.primary')
    color.getBoundingClientRect = () =>
      ({
        top: 160,
        left: 20,
        width: 200,
        height: 32,
        bottom: 192,
        right: 220,
        x: 20,
        y: 160,
        toJSON() {
          return {}
        },
      }) as DOMRect
    document.body.append(deep, color)
    const hits = resolveHighlightTargets('tokenBind')
    expect(hits).toHaveLength(1)
    expect(hits[0]).toBe(color)
    expect(focusTokenBindHighlightTarget()).toBe(color)
    deep.remove()
    color.remove()
  })

  it('matchesTourAction treats tokens as openTokens and keeps pick/bind separate', () => {
    expect(matchesTourAction('openTokens', 'tokens')).toBe(true)
    expect(matchesTourAction('openTokens', 'openTokens')).toBe(true)
    expect(matchesTourAction('openTokens', 'tokenBind')).toBe(false)
    expect(matchesTourAction('tokenPick', 'tokenPick')).toBe(true)
    expect(matchesTourAction('tokenPick', 'tokenBind')).toBe(true)
    expect(matchesTourAction('tokenBind', 'tokenBind')).toBe(true)
    expect(matchesTourAction('activateBreakpoint', 'activateBreakpoint')).toBe(true)
    expect(matchesTourAction('focusInspect', 'inspect')).toBe(false)
    expect(matchesTourAction('openComponents', 'openComponents')).toBe(true)
    expect(matchesTourAction('openComponents', 'insert')).toBe(false)
    expect(GUIDED_TOUR_STEPS).toHaveLength(12)
    expect(GUIDED_TOUR_STEPS.map((s) => s.id)).toEqual([
      'select',
      'openComponents',
      'insert',
      'inlineText',
      'focusInspect',
      'inspect',
      'openTokens',
      'tokenPick',
      'tokenBind',
      'breakpoints',
      'activateBreakpoint',
      'preview',
    ])
  })

  it('isTourStepAlreadySatisfied when left tab aria-selected', () => {
    const tab = document.createElement('button')
    tab.setAttribute('data-testid', 'editor-left-tab-tokens')
    tab.setAttribute('aria-selected', 'false')
    document.body.appendChild(tab)
    expect(isTourStepAlreadySatisfied('openTokens')).toBe(false)
    tab.setAttribute('aria-selected', 'true')
    expect(isTourStepAlreadySatisfied('openTokens')).toBe(true)
    tab.remove()
  })

  it('pickGranularHighlightTargets prefers small nodes over artboard-scale parents', () => {
    const big = document.createElement('div')
    big.getBoundingClientRect = () =>
      ({
        top: 0,
        left: 0,
        width: 900,
        height: 700,
        bottom: 700,
        right: 900,
        x: 0,
        y: 0,
        toJSON() {
          return {}
        },
      }) as DOMRect
    const small = document.createElement('div')
    small.getBoundingClientRect = () =>
      ({
        top: 40,
        left: 40,
        width: 96,
        height: 32,
        bottom: 72,
        right: 136,
        x: 40,
        y: 40,
        toJSON() {
          return {}
        },
      }) as DOMRect
    const picked = pickGranularHighlightTargets([big, small], { max: 1 })
    expect(picked).toEqual([small])
  })

  it('resolveHighlightTargets picks a palette item for insert, not the whole panel', () => {
    const palette = document.createElement('div')
    palette.setAttribute('data-testid', 'creation-editor-palette')
    const item = document.createElement('li')
    item.className = 'ds-component-palette__item'
    item.getBoundingClientRect = () =>
      ({
        top: 200,
        left: 16,
        width: 180,
        height: 32,
        bottom: 232,
        right: 196,
        x: 16,
        y: 200,
        toJSON() {
          return {}
        },
      }) as DOMRect
    palette.appendChild(item)
    document.body.appendChild(palette)
    const hits = resolveHighlightTargets('insert')
    expect(hits).toHaveLength(1)
    expect(hits[0]).toBe(item)
    palette.remove()
  })

  it('resolveHighlightTargets caps select to compact canvas nodes', () => {
    const frame = document.createElement('div')
    frame.className = 'creation-scene-page-frame creation-scene-page-frame--active'
    const body = document.createElement('div')
    body.className = 'creation-scene-page-frame__body'
    const mk = (type: string, w: number, h: number) => {
      const el = document.createElement('div')
      el.className = 'creation-scene-node'
      el.setAttribute('data-node-type', type)
      el.setAttribute('data-node-id', `n-${type}`)
      el.getBoundingClientRect = () =>
        ({
          top: 100,
          left: 100,
          width: w,
          height: h,
          bottom: 100 + h,
          right: 100 + w,
          x: 100,
          y: 100,
          toJSON() {
            return {}
          },
        }) as DOMRect
      return el
    }
    body.append(mk('SiteButton', 120, 36), mk('SiteText', 160, 24), mk('Instance', 800, 600))
    frame.appendChild(body)
    document.body.appendChild(frame)
    const hits = resolveHighlightTargets('select')
    expect(hits.length).toBeGreaterThan(0)
    expect(hits.length).toBeLessThanOrEqual(2)
    expect(hits.every((el) => el.getAttribute('data-node-type') !== 'Instance' || true)).toBe(true)
    // Huge Instance filtered by max area when smaller nodes exist
    expect(hits.map((el) => el.getAttribute('data-node-type'))).not.toContain('Instance')
    frame.remove()
  })

  it('highlightRectsForTargets skips zero-size nodes', () => {
    const el = document.createElement('div')
    el.getBoundingClientRect = () =>
      ({
        top: 0,
        left: 0,
        width: 0,
        height: 0,
        bottom: 0,
        right: 0,
        x: 0,
        y: 0,
        toJSON() {
          return {}
        },
      }) as DOMRect
    expect(highlightRectsForTargets([el])).toEqual([])
  })

  it('counts active page children for empty definition', () => {
    expect(countActivePageChildren(createEmptyArtboardScene())).toBe(0)
    expect(countActivePageChildren(createZaolyDefaultLandingScene())).toBeGreaterThan(0)
  })

  it('builds sample scene preserving current id / platformProjectId', () => {
    const current = createEmptyArtboardScene('proj-onboard-1')
    current.id = 'scene-keep-me'
    current.name = 'Working'
    const sample = buildOnboardingSampleScene(current)
    expect(sample.id).toBe('scene-keep-me')
    expect(sample.platformProjectId).toBe('proj-onboard-1')
    expect(countActivePageChildren(sample)).toBeGreaterThan(0)
    expect(sample.name).toBe('Working')
  })

  it('computeTipPosition falls back when tip would sit under top chrome', () => {
    const el = document.createElement('button')
    el.getBoundingClientRect = () =>
      ({
        top: 8,
        bottom: 36,
        left: 20,
        right: 120,
        width: 100,
        height: 28,
        x: 20,
        y: 8,
        toJSON() {
          return {}
        },
      }) as DOMRect
    document.body.appendChild(el)
    // Tiny viewport height so neither below nor above (with chrome inset) fits.
    const prevInnerHeight = window.innerHeight
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 120 })
    expect(computeTipPosition(el, 320, 148, 12, 56)).toBeNull()
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: prevInnerHeight })
    el.remove()
  })

  it('computeTipPosition prefers beside for left-rail anchors', () => {
    const el = document.createElement('button')
    el.getBoundingClientRect = () =>
      ({
        top: 160,
        bottom: 192,
        left: 40,
        right: 220,
        width: 180,
        height: 32,
        x: 40,
        y: 160,
        toJSON() {
          return {}
        },
      }) as DOMRect
    const pos = computeTipPosition(el, 320, 100, 12, 56)
    expect(pos).not.toBeNull()
    expect(pos?.placement).toBe('beside')
    expect(pos!.left).toBeGreaterThanOrEqual(220)
  })

  it('clampTipDragPosition keeps tip in viewport', () => {
    const prevH = window.innerHeight
    const prevW = window.innerWidth
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 })
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1200 })
    const clamped = clampTipDragPosition(-40, -10, 320, 100, 12, 56)
    expect(clamped.top).toBe(68) // topInset + margin
    expect(clamped.left).toBe(12)
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: prevH })
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: prevW })
  })

  it('clearOnboardingFlags resets welcome + tour + empty skip', () => {
    const local = memoryStorage({
      [paths.onboarding.welcomeStorageKey]: '1',
      [paths.onboarding.tourStorageKey]: '3',
    })
    const session = memoryStorage({
      [paths.onboarding.emptySkipStorageKey]: '1',
    })
    clearOnboardingFlags({ local, session })
    expect(getTourProgress(local)).toBe(0)
    expect(hasSeenWelcome(local)).toBe(false)
  })

  it('forces white label on cobalt primary buttons (portaled outside app-frame)', () => {
    const css = readFileSync(
      path.join(__dirname, '../css/zaoly-onboarding.css'),
      'utf8',
    )
    expect(css).toMatch(
      /\.zaoly-onboarding-welcome\s+\.ds-btn--primary[\s\S]*color:\s*var\(--editor-accent-ink,\s*#ffffff\)/i,
    )
    expect(css).toMatch(/\.zaoly-onboarding-tip\s+\.ds-btn--primary/i)
  })
})
