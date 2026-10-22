/**
 * Parse playground-generated (and lightly edited) TSX back into a composition tree
 * for live CompositionPreview. Spec: `specs/domain/site-kit-playground.md`
 *
 * Tokenizer / attr scan MUST be string- and brace-aware so pretty-printed seeds
 * (multi-line style, JSON props, SVG markup containing `>`) still round-trip.
 */
import type { SiteKitCompositionNode } from '@zaoly/site-kit'
import { SITE_KIT_CATALOG } from './site-kit-catalog'
import { extractReturnJsxBalanced } from './playground-draft'

const EXPORT_TO_TYPE: Record<string, string> = Object.fromEntries(
  SITE_KIT_CATALOG.map((e) => [e.exportName, e.id]),
)

export type PlaygroundParseResult =
  | { ok: true; composition: SiteKitCompositionNode }
  | { ok: false; error: string }

function extractReturnJsx(source: string): string | null {
  return extractReturnJsxBalanced(source)
}

type Token =
  | { kind: 'open'; tag: string; selfClosing: boolean; attrs: string }
  | { kind: 'close'; tag: string }
  | { kind: 'text'; value: string }

/** Index of `>` that closes an open tag starting at `start` (`s[start] === '<'`). */
function findOpenTagClose(s: string, start: number): number {
  let i = start + 1
  let inStr: '"' | "'" | '`' | null = null
  let escaped = false
  let braceDepth = 0
  while (i < s.length) {
    const ch = s[i]
    if (inStr) {
      if (escaped) {
        escaped = false
      } else if (ch === '\\') {
        escaped = true
      } else if (ch === inStr) {
        inStr = null
      }
      i += 1
      continue
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inStr = ch
      i += 1
      continue
    }
    if (ch === '{') {
      braceDepth += 1
      i += 1
      continue
    }
    if (ch === '}') {
      braceDepth = Math.max(0, braceDepth - 1)
      i += 1
      continue
    }
    if (ch === '>' && braceDepth === 0) return i
    i += 1
  }
  return -1
}

function tokenizeJsx(input: string): Token[] | null {
  const tokens: Token[] = []
  let i = 0
  const s = input
  while (i < s.length) {
    if (s[i] === '<') {
      if (s.startsWith('</', i)) {
        const end = s.indexOf('>', i)
        if (end < 0) return null
        const tag = s.slice(i + 2, end).trim()
        tokens.push({ kind: 'close', tag })
        i = end + 1
        continue
      }
      const end = findOpenTagClose(s, i)
      if (end < 0) return null
      let raw = s.slice(i + 1, end).trim()
      let selfClosing = false
      if (raw.endsWith('/')) {
        selfClosing = true
        raw = raw.slice(0, -1).trim()
      }
      const sp = raw.search(/\s/)
      const tag = sp < 0 ? raw : raw.slice(0, sp)
      const attrs = sp < 0 ? '' : raw.slice(sp + 1).trim()
      if (!/^[A-Za-z][A-Za-z0-9]*$/.test(tag)) return null
      tokens.push({ kind: 'open', tag, selfClosing, attrs })
      i = end + 1
      continue
    }
    const next = s.indexOf('<', i)
    const chunk = (next < 0 ? s.slice(i) : s.slice(i, next)).trim()
    if (chunk) tokens.push({ kind: 'text', value: decodeJsxText(chunk) })
    i = next < 0 ? s.length : next
  }
  return tokens
}

function decodeJsxText(text: string): string {
  return text
    .replace(/&#123;/g, '{')
    .replace(/&#125;/g, '}')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

function parseAttrValue(raw: string): unknown {
  const t = raw.trim()
  if (t.startsWith('{') && t.endsWith('}')) {
    const inner = t.slice(1, -1).trim()
    if (inner === 'undefined') return undefined
    if (inner === 'true') return true
    if (inner === 'false') return false
    if (/^-?\d+(\.\d+)?$/.test(inner)) return Number(inner)
    try {
      return JSON.parse(inner)
    } catch {
      return inner
    }
  }
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    return t.slice(1, -1)
  }
  return t
}

/** Read a `{…}` or quoted string starting at `start`; returns end index exclusive. */
function scanValueEnd(attrs: string, start: number): number {
  const ch = attrs[start]
  if (ch === '"' || ch === "'") {
    let i = start + 1
    let escaped = false
    while (i < attrs.length) {
      const c = attrs[i]
      if (escaped) {
        escaped = false
      } else if (c === '\\') {
        escaped = true
      } else if (c === ch) {
        return i + 1
      }
      i += 1
    }
    return -1
  }
  if (ch === '{') {
    let i = start + 1
    let depth = 1
    let inStr: '"' | "'" | '`' | null = null
    let escaped = false
    while (i < attrs.length) {
      const c = attrs[i]
      if (inStr) {
        if (escaped) {
          escaped = false
        } else if (c === '\\') {
          escaped = true
        } else if (c === inStr) {
          inStr = null
        }
        i += 1
        continue
      }
      if (c === '"' || c === "'" || c === '`') {
        inStr = c
        i += 1
        continue
      }
      if (c === '{') depth += 1
      else if (c === '}') {
        depth -= 1
        if (depth === 0) return i + 1
      }
      i += 1
    }
    return -1
  }
  return -1
}

function parseStyleObjectBody(body: string): Record<string, string | number> {
  const style: Record<string, string | number> = {}
  // Split on commas that are not inside quotes (style values are flat).
  let part = ''
  let inStr: '"' | "'" | null = null
  let escaped = false
  const parts: string[] = []
  for (let i = 0; i < body.length; i += 1) {
    const ch = body[i]
    if (inStr) {
      part += ch
      if (escaped) {
        escaped = false
      } else if (ch === '\\') {
        escaped = true
      } else if (ch === inStr) {
        inStr = null
      }
      continue
    }
    if (ch === '"' || ch === "'") {
      inStr = ch
      part += ch
      continue
    }
    if (ch === ',') {
      parts.push(part)
      part = ''
      continue
    }
    part += ch
  }
  if (part.trim()) parts.push(part)

  for (const entry of parts) {
    const idx = entry.indexOf(':')
    if (idx < 0) continue
    const key = entry.slice(0, idx).trim()
    const valRaw = entry.slice(idx + 1).trim()
    if (!key) continue
    try {
      style[key] = JSON.parse(valRaw) as string | number
    } catch {
      const n = Number(valRaw)
      style[key] = Number.isFinite(n) ? n : valRaw.replace(/^["']|["']$/g, '')
    }
  }
  return style
}

function parseAttrs(attrs: string): {
  props: Record<string, unknown>
  style?: Record<string, string | number>
} {
  const props: Record<string, unknown> = {}
  let style: Record<string, string | number> | undefined
  if (!attrs.trim()) return { props }

  let i = 0
  while (i < attrs.length) {
    while (i < attrs.length && /\s/.test(attrs[i])) i += 1
    if (i >= attrs.length) break
    const nameMatch = attrs.slice(i).match(/^([A-Za-z_][\w]*)=/)
    if (!nameMatch) {
      // Skip unknown junk to avoid infinite loops
      i += 1
      continue
    }
    const name = nameMatch[1]
    i += nameMatch[0].length
    const valueStart = i
    const valueEnd = scanValueEnd(attrs, valueStart)
    if (valueEnd < 0) break
    const rawValue = attrs.slice(valueStart, valueEnd)
    i = valueEnd

    if (name === 'style') {
      const t = rawValue.trim()
      if (t.startsWith('{') && t.endsWith('}')) {
        const inner = t.slice(1, -1).trim()
        // style={{ … }} → inner starts with `{`
        if (inner.startsWith('{') && inner.endsWith('}')) {
          style = parseStyleObjectBody(inner.slice(1, -1))
        }
      }
      continue
    }
    props[name] = parseAttrValue(rawValue)
  }
  return { props, style }
}

function parseTokens(tokens: Token[], start = 0): { node: SiteKitCompositionNode; next: number } | null {
  const tok = tokens[start]
  if (!tok || tok.kind !== 'open') return null
  const type = EXPORT_TO_TYPE[tok.tag] ?? (tok.tag.startsWith('Site') ? tok.tag : null)
  if (!type) return null
  const { props, style } = parseAttrs(tok.attrs)
  if (tok.selfClosing) {
    return {
      node: { type, props, ...(style ? { style } : {}) },
      next: start + 1,
    }
  }
  const children: SiteKitCompositionNode[] = []
  let i = start + 1
  let textChild: string | undefined
  while (i < tokens.length) {
    const cur = tokens[i]
    if (cur.kind === 'close') {
      if (cur.tag !== tok.tag) return null
      const node: SiteKitCompositionNode = {
        type,
        props: { ...props },
        ...(style ? { style } : {}),
      }
      if (children.length > 0) node.children = children
      else if (textChild !== undefined) node.props = { ...node.props, children: textChild }
      return { node, next: i + 1 }
    }
    if (cur.kind === 'text') {
      textChild = (textChild ?? '') + cur.value
      i += 1
      continue
    }
    const child = parseTokens(tokens, i)
    if (!child) return null
    children.push(child.node)
    i = child.next
  }
  return null
}

/** Parse Kit Playground TSX module → composition root (Site Kit tags only). */
export function parsePlaygroundTsxToComposition(source: string): PlaygroundParseResult {
  const jsx = extractReturnJsx(source)
  if (!jsx) return { ok: false, error: 'Could not find return (…) JSX in module' }
  const tokens = tokenizeJsx(jsx)
  if (!tokens || tokens.length === 0) return { ok: false, error: 'Empty or invalid JSX' }
  const parsed = parseTokens(tokens, 0)
  if (!parsed) return { ok: false, error: 'Failed to parse JSX tree' }
  if (parsed.next !== tokens.length) {
    return { ok: false, error: 'Unexpected tokens after root element' }
  }
  return { ok: true, composition: parsed.node }
}
