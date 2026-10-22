/**
 * Read-only JSON + CSS dumps of the Zaoly local token pack.
 * Spec: specs/domain/zaoly-token-studio.md
 */
import { digitalCssForLeaf } from '../inspect/digital-css'
import { readTypographyDigitalDraft } from '../inspect/digital-edit'
import type { ZaolyPackLeaf } from '../inspect/token-catalog'
import { paths } from '../paths'
import { compileTokenExprToCss, looksLikeTokenExpr, pathToZaolyCssVar } from './token-expr'
import { readArtboardSummary } from './artboard-presets'
import { formatMediaBreakpointCssVars, readMediaSummary } from './media-breakpoints'

export type StudioPackExtension = {
  type: string
  value: string
}

export type PackExportView = 'cards' | 'json' | 'css'

function dtcgType(type: string): string {
  if (type === 'color') return 'color'
  if (type === 'spacing' || type === 'size' || type === 'radius') return 'dimension'
  if (type === 'opacity') return 'number'
  if (type === 'shadow' || type === 'glow') return 'shadow'
  if (type === 'typography') return 'typography'
  if (type === 'motion') return 'duration'
  if (type === 'effect') return 'string'
  if (type === 'asset') return 'string'
  return type
}

/** Digital CSS string for export (typography as family/weight/size/lh shorthand). */
export function leafExportCssValue(leaf: ZaolyPackLeaf): string {
  if (leaf.type === 'typography') {
    const d = readTypographyDigitalDraft(leaf.value)
    return [d.family, d.weight, d.digitalSize, d.lineHeight].filter(Boolean).join(' ')
  }
  // Artboard presets are geometry metadata — include in JSON dump, never as CSS vars.
  if (leaf.type === 'artboard') {
    return readArtboardSummary(leaf.value)
  }
  if (leaf.type === 'media') {
    return readMediaSummary(leaf.value)
  }
  return digitalCssForLeaf(leaf) ?? ''
}

function setNested(
  root: Record<string, unknown>,
  tokenPath: string,
  entry: Record<string, unknown>,
): void {
  const parts = tokenPath.split('.').filter(Boolean)
  if (parts.length === 0) return
  let cur: Record<string, unknown> = root
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i]!
    const next = cur[key]
    if (!next || typeof next !== 'object' || Array.isArray(next) || '$value' in (next as object)) {
      cur[key] = {}
    }
    cur = cur[key] as Record<string, unknown>
  }
  cur[parts[parts.length - 1]!] = entry
}

/** Nested DTCG-style JSON (`$type` / `$value` + Zaoly studio extension) for the pack. */
export function formatTokenPackJson(leaves: ZaolyPackLeaf[]): string {
  const root: Record<string, unknown> = {}
  const sorted = [...leaves].sort((a, b) => a.path.localeCompare(b.path))
  for (const leaf of sorted) {
    const value = leafExportCssValue(leaf)
    if (!value) continue
    const studio: StudioPackExtension = { type: leaf.type, value: leaf.value }
    setNested(root, leaf.path, {
      $type: dtcgType(leaf.type),
      $value: value,
      $extensions: {
        [paths.tokenPackStudioExtensionKey]: studio,
      },
    })
  }
  return `${JSON.stringify(root, null, 2)}\n`
}

/** Trigger a browser file download for a pack dump. */
export function downloadTokenPackText(filename: string, text: string, mime: string): void {
  if (typeof document === 'undefined') return
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** `:root` block of `--zaoly-*` custom properties (refs → `var()`). */
export function formatTokenPackCss(leaves: ZaolyPackLeaf[]): string {
  const sorted = [...leaves].sort((a, b) => a.path.localeCompare(b.path))
  const lines: string[] = [':root {']
  for (const leaf of sorted) {
    if (leaf.type === 'artboard') continue
    if (leaf.type === 'media') continue
    const raw = leafExportCssValue(leaf)
    if (!raw) continue
    const css = looksLikeTokenExpr(raw) ? compileTokenExprToCss(raw) : raw
    lines.push(`  ${pathToZaolyCssVar(leaf.path)}: ${css};`)
  }
  lines.push(...formatMediaBreakpointCssVars(leaves))
  lines.push('}', '')
  return lines.join('\n')
}
