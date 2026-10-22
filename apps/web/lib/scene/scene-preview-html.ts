/**
 * Site-Kit composition tree → static HTML for headless preview.
 * Spec: specs/domain/scene-preview.md
 */
import type { SceneBreakpointId, SceneNode } from '@zaoly/contracts'
import {
  sanitizeSiteSvgMarkup,
  SITE_SVG_PLACEHOLDER_MARKUP,
} from '@zaoly/site-kit'
import {
  serializeSiteKitComposition,
  type SiteKitCompositionNode,
} from '../site-kit/sync-tree'
import { buildGoogleFontLinkTagsHtml } from '../fonts/google-fonts'

const SITE_KIT_CSS = `
:root {
  --site-ink: #141414;
  --site-muted: #5c5c58;
  --site-paper: #f3eee4;
  --site-line: #c9bca1;
  --site-accent: #1f44ff;
  --site-accent-ink: #f3eee4;
  --site-radius: 0;
  --site-font: 'Noto Sans', system-ui, sans-serif;
  --site-space-1: 0.25rem;
  --site-space-2: 0.5rem;
  --site-space-3: 0.75rem;
  --site-space-4: 1rem;
  --site-space-5: 1.5rem;
  --site-space-6: 2rem;
  --site-space-8: 3rem;
  --site-max: 72rem;
  /* Short aliases for legacy imports that still emit var(--ink) etc. */
  --ink: var(--site-ink);
  --muted: var(--site-muted);
  --bg: var(--site-paper);
  --line: var(--site-line);
  --accent: var(--site-accent);
  --font: var(--site-font);
  --paper: var(--site-paper);
  --radius: var(--site-radius);
}
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: inherit;
  color: inherit;
  background: transparent;
}
#preview-root { min-height: 100vh; width: 100%; }
button, .sk-button {
  font: inherit;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: var(--site-radius);
  background: transparent;
  color: inherit;
  padding: 0.6rem 1rem;
}
a { color: inherit; text-decoration: none; }
img { max-width: 100%; height: auto; display: block; }
select, input, textarea {
  font: inherit;
  width: 100%;
  max-width: 24rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--site-line);
  border-radius: var(--site-radius);
  background: #fff;
}
.sk-badge {
  display: inline-block;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  font-size: 0.85rem;
}
.sk-title { font-size: 2rem; font-weight: 700; margin: 0 0 0.5rem; color: inherit; }
.sk-display { font-size: 2.75rem; font-weight: 700; margin: 0 0 0.75rem; color: inherit; }
.sk-body { font-size: 1rem; margin: 0 0 0.75rem; color: inherit; }
`

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function styleAttr(style?: Record<string, string | number>): string {
  if (!style || !Object.keys(style).length) return ''
  const css = Object.entries(style)
    .map(([k, v]) => {
      const prop = k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
      return `${prop}:${String(v)}`
    })
    .join(';')
  return ` style="${escapeHtml(css)}"`
}

function textOf(props: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const v = props[key]
    if (typeof v === 'string' && v.trim()) return v
    if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  }
  return ''
}

function selectOptionsHtml(props: Record<string, unknown>): string {
  const options = props.options
  const lines: string[] = []
  if (typeof options === 'string') {
    for (const line of options.split('\n').map((l) => l.trim()).filter(Boolean)) {
      lines.push(line)
    }
  } else if (Array.isArray(options)) {
    for (const o of options) {
      if (o && typeof o === 'object' && 'label' in o) {
        lines.push(String((o as { label?: unknown }).label ?? ''))
      } else if (o != null) {
        lines.push(String(o))
      }
    }
  }
  if (!lines.length) {
    const ph = textOf(props, 'placeholder') || 'Select'
    return `<option>${escapeHtml(ph)}</option>`
  }
  return lines.map((l) => `<option>${escapeHtml(l)}</option>`).join('')
}

function renderNode(node: SiteKitCompositionNode): string {
  const type = node.type
  const props = node.props ?? {}
  const style = styleAttr(node.style)
  const kids = (node.children ?? []).map(renderNode).join('')
  const label = textOf(props, 'children', 'label')

  if (type === 'SiteStack' || type === 'SiteContainer' || type === 'Stack' || type === 'Frame') {
    return `<div data-type="${escapeHtml(type)}"${style}>${kids}</div>`
  }
  if (type === 'SiteGrid' || type === 'Grid') {
    return `<div data-type="${escapeHtml(type)}"${style}>${kids}</div>`
  }
  if (type === 'SiteText' || type === 'Text' || type === 'Heading') {
    const role = textOf(props, 'role').toLowerCase()
    const cls =
      role === 'display' ? 'sk-display' : role === 'title' || props.level != null ? 'sk-title' : 'sk-body'
    const tag = role === 'display' || role === 'title' || props.level != null ? 'h1' : 'p'
    return `<${tag} class="${cls}" data-type="${escapeHtml(type)}"${style}>${escapeHtml(label)}${kids}</${tag}>`
  }
  if (type === 'SiteButton' || type === 'Button') {
    return `<button type="button" class="sk-button" data-type="${escapeHtml(type)}"${style}>${escapeHtml(label || 'Button')}${kids}</button>`
  }
  if (type === 'SiteLink' || type === 'Link') {
    const href = textOf(props, 'href') || '#'
    return `<a href="${escapeHtml(href)}" data-type="${escapeHtml(type)}"${style}>${escapeHtml(label || 'Link')}${kids}</a>`
  }
  if (type === 'SiteBadge' || type === 'Badge') {
    return `<span class="sk-badge" data-type="${escapeHtml(type)}"${style}>${escapeHtml(label || 'Badge')}${kids}</span>`
  }
  if (type === 'SiteSelect' || type === 'Select') {
    const ph = textOf(props, 'placeholder')
    return `<label data-type="${escapeHtml(type)}"${style}>${ph ? `<span>${escapeHtml(ph)}</span>` : ''}<select>${selectOptionsHtml(props)}</select></label>`
  }
  if (type === 'SiteInput' || type === 'Input') {
    const ph = textOf(props, 'placeholder')
    return `<input data-type="${escapeHtml(type)}" placeholder="${escapeHtml(ph)}"${style} />`
  }
  if (type === 'SiteTextarea' || type === 'Textarea') {
    const ph = textOf(props, 'placeholder')
    return `<textarea data-type="${escapeHtml(type)}" placeholder="${escapeHtml(ph)}"${style}></textarea>`
  }
  if (type === 'SiteImage' || type === 'Image') {
    const src = textOf(props, 'src') || ''
    const alt = textOf(props, 'alt') || 'Image'
    return `<img data-type="${escapeHtml(type)}" src="${escapeHtml(src)}" alt="${escapeHtml(alt)}"${style} />`
  }
  if (type === 'SiteSvg') {
    const raw = textOf(props, 'markup') || ''
    const sanitized = sanitizeSiteSvgMarkup(raw)
    const markup = sanitized.ok ? sanitized.markup : SITE_SVG_PLACEHOLDER_MARKUP
    const alt = textOf(props, 'alt') || 'Graphic'
    return `<span data-type="SiteSvg" role="img" aria-label="${escapeHtml(alt)}"${style}>${markup}</span>`
  }
  if (type === 'SiteShape') {
    const d = textOf(props, 'd') || 'M24 4 L44 24 L24 44 L4 24 Z'
    const viewBox = textOf(props, 'viewBox') || '0 0 48 48'
    const alt = textOf(props, 'alt') || 'Shape'
    return `<span data-type="SiteShape" role="img" aria-label="${escapeHtml(alt)}"${style}><svg viewBox="${escapeHtml(viewBox)}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="${escapeHtml(d)}" fill="currentColor"/></svg></span>`
  }
  if (type === 'SiteCheckbox' || type === 'Checkbox') {
    return `<label data-type="${escapeHtml(type)}"${style}><input type="checkbox" /> ${escapeHtml(label)}</label>`
  }
  return `<div data-type="${escapeHtml(type)}"${style}>${label ? escapeHtml(label) : ''}${kids}</div>`
}

/** Build a full HTML document for Playwright setContent. */
export function buildScenePreviewHtml(
  root: SceneNode,
  options?: {
    breakpoint?: SceneBreakpointId
    /** Wave H — OP-9 cascade base for serialize. */
    primaryBreakpoint?: Exclude<SceneBreakpointId, 'print'>
    title?: string
    /** Google Font family names to inject as CSS2 links (P93). */
    fontFamilies?: string[]
  },
): string {
  const breakpoint = options?.breakpoint ?? 'desktop'
  const tree = serializeSiteKitComposition(root, {
    breakpoint,
    primaryBreakpoint: options?.primaryBreakpoint,
  })
  const body = renderNode(tree)
  const title = escapeHtml(options?.title ?? 'Scene preview')
  const fontLinks =
    options?.fontFamilies?.length ? buildGoogleFontLinkTagsHtml(options.fontFamilies) : ''
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
${fontLinks}
<style>${SITE_KIT_CSS}</style>
</head>
<body>
<main id="preview-root">${body}</main>
</body>
</html>`
}
