/** Sanitized opaque SVG markup for SiteSvg (Phase 0). Spec: specs/domain/site-svg.md */

import { SITE_SVG_MARKS, SITE_SVG_DEFAULT_MARK_ID } from './svg-marks'

export const SITE_SVG_PLACEHOLDER_MARKUP =
  SITE_SVG_MARKS.find((m) => m.id === SITE_SVG_DEFAULT_MARK_ID)!.markup

const SCRIPT_RE = /<\s*script\b/i
const FOREIGN_RE = /<\s*foreignObject\b[\s\S]*?<\/\s*foreignObject\s*>/gi
const EVENT_ATTR_RE = /\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi
const JS_HREF_RE = /\s+(?:xlink:)?href\s*=\s*("|')\s*javascript:[^"']*\1/gi
const DATA_JS_RE = /\s+(?:xlink:)?href\s*=\s*("|')\s*data:text\/html[^"']*\1/gi

export type SanitizeSiteSvgResult =
  | { ok: true; markup: string; viewBox?: string; stripped: boolean }
  | { ok: false; reason: string }

/**
 * Strip scriptable / active content from an SVG fragment.
 * Pure string transforms — safe in Node and browser.
 */
export function sanitizeSiteSvgMarkup(raw: string): SanitizeSiteSvgResult {
  const input = raw.trim()
  if (!input) {
    return { ok: false, reason: 'empty-markup' }
  }
  if (SCRIPT_RE.test(input)) {
    return { ok: false, reason: 'script-rejected' }
  }

  let markup = input
  let stripped = false

  const withoutForeign = markup.replace(FOREIGN_RE, () => {
    stripped = true
    return ''
  })
  markup = withoutForeign

  const withoutEvents = markup.replace(EVENT_ATTR_RE, () => {
    stripped = true
    return ''
  })
  markup = withoutEvents

  const withoutJs = markup.replace(JS_HREF_RE, () => {
    stripped = true
    return ''
  })
  markup = withoutJs

  const withoutData = markup.replace(DATA_JS_RE, () => {
    stripped = true
    return ''
  })
  markup = withoutData

  if (!/<\s*svg\b/i.test(markup)) {
    markup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${markup}</svg>`
    stripped = true
  }

  const viewBoxMatch = markup.match(/\bviewBox\s*=\s*("|')([^"']+)\1/i)
  const viewBox = viewBoxMatch?.[2]?.trim() || undefined

  return { ok: true, markup: markup.trim(), viewBox, stripped }
}

const SKIP_PAINT = /^(none|currentColor|inherit|transparent|url\()/i

/**
 * Explicit Phase 1 op: rewrite hard-coded fill/stroke paints to `currentColor`
 * so Inspect color / tokenBindings can recolor the mark. Does not invent tokens.
 */
export function promoteSiteSvgMarkupToCurrentColor(raw: string): SanitizeSiteSvgResult {
  const sanitized = sanitizeSiteSvgMarkup(raw)
  if (!sanitized.ok) return sanitized

  let changed = false
  const markup = sanitized.markup.replace(
    /\b(fill|stroke)\s*=\s*("|')([^"']*)\2/gi,
    (full, attr: string, quote: string, value: string) => {
      const v = value.trim()
      if (!v || SKIP_PAINT.test(v)) return full
      changed = true
      return `${attr}=${quote}currentColor${quote}`
    },
  )

  return {
    ok: true,
    markup,
    viewBox: sanitized.viewBox,
    stripped: sanitized.stripped || changed,
  }
}
