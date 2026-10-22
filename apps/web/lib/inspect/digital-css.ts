/**
 * Token pack channel → CSS (P40 digital / P42 print).
 * Port the **value contract** from the suite design-tokens spec.
 * Do not copy upstream app modules; do not emit `--bg0` or invent Pantone→hex.
 */

export type TypographyFacet = 'family' | 'size' | 'weight' | 'lineHeight' | 'letterSpacing'

export type TokenChannel = 'digital' | 'print'

export type PackLeafInput = {
  path?: string
  type: string
  /** JSON string or already-parsed object (fixture / live pack). */
  value: unknown
  status?: string
}

/** Narrow inspect/catalog rows so `next build` can pass them into leaf CSS helpers. */
export function asPackLeafInput(tok: {
  path?: string
  type?: string
  value?: unknown
  status?: string
}): PackLeafInput | null {
  if (typeof tok.type !== 'string' || tok.value == null) return null
  const type = tok.type
  return { path: tok.path, type, value: tok.value, status: tok.status }
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function str(v: unknown): string | undefined {
  if (typeof v === 'string' && v.trim()) return v.trim()
  if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  return undefined
}

function parseValue(raw: unknown): unknown {
  if (raw == null) return null
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw !== 'string') return raw
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed) as unknown
    } catch {
      return trimmed
    }
  }
  return trimmed
}

function channelPayload(parsed: unknown, channel: TokenChannel): unknown {
  const rec = asRecord(parsed)
  if (!rec) return channel === 'digital' ? parsed : undefined
  if (channel in rec) return rec[channel]
  return channel === 'digital' ? parsed : undefined
}

/** CSS color we can paint. Never treat Pantone / CMYK / RAL / ink notes as CSS. */
function isCssColor(value: string): boolean {
  const v = value.trim()
  if (/^#([0-9a-fA-F]{3,8})$/.test(v)) return true
  if (/^(rgb|rgba|hsl|hsla|oklch|oklab)\(/i.test(v)) return true
  if (/^(transparent|currentColor)$/i.test(v)) return true
  return false
}

/** CSS length / clamp. `mm`/`pt` are paintable (CT-6). Space-separated shorthands OK. */
function isCssLength(value: string): boolean {
  const v = value.trim()
  if (v === '0') return true
  if (/^clamp\(/i.test(v)) return true
  const parts = v.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return false
  return parts.every(
    (part) =>
      part === '0' ||
      /^-?[\d.]+(px|rem|em|pt|pc|mm|cm|in|vw|vh|vmin|vmax|ch|ex|%)$/.test(part),
  )
}

function isCssOpacity(value: string): boolean {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 && n <= 1
}

function colorCss(channelValue: unknown, parsed: unknown, channel: TokenChannel): string | undefined {
  const rec = asRecord(channelValue)
  const css = str(rec?.css) || str(rec?.oklch) || str(rec?.hsl)
  if (css && (channel === 'digital' || isCssColor(css))) return css
  const rgb = str(rec?.rgba) || str(rec?.rgb)
  if (rgb && (channel === 'digital' || isCssColor(rgb))) return rgb
  const hex = str(rec?.hex)
  if (hex && (channel === 'digital' || isCssColor(hex))) return hex
  if (typeof channelValue === 'string') {
    const raw = channelValue.trim()
    if (channel === 'digital' && /^#([0-9a-fA-F]{3,8})$/.test(raw)) return raw
    if (isCssColor(raw)) return raw
  }
  if (typeof parsed === 'string' && channel === 'digital' && /^#([0-9a-fA-F]{3,8})$/.test(parsed.trim())) {
    return parsed.trim()
  }
  if (channel === 'digital') {
    const legacy = asRecord(parsed)
    return (
      str(legacy?.css) ||
      str(legacy?.oklch) ||
      str(legacy?.hsl) ||
      str(legacy?.rgba) ||
      str(legacy?.rgb) ||
      str(legacy?.hex)
    )
  }
  // Print has no CSS-paintable ink (Pantone/CMYK/RAL) — conservative digital hex (CT-6).
  return colorCss(channelPayload(parsed, 'digital'), parsed, 'digital')
}

function lengthCss(
  channelValue: unknown,
  parsed: unknown,
  channel: TokenChannel,
  kind: 'length' | 'opacity',
): string | undefined {
  const fromChannel = str(channelValue)
  if (fromChannel) {
    if (channel === 'digital') return fromChannel
    if (kind === 'opacity') return isCssOpacity(fromChannel) ? fromChannel : undefined
    return isCssLength(fromChannel) ? fromChannel : undefined
  }
  if (channel === 'print') return undefined
  if (typeof parsed === 'string') return str(parsed)
  return undefined
}

function typographyCss(
  parsed: unknown,
  facet: TypographyFacet | undefined,
  channel: TokenChannel,
): string | undefined {
  const rec = asRecord(parsed)
  if (!rec) return undefined
  const family = str(rec.family)
  const weight = str(rec.weight)
  const metricsRec = asRecord(channelPayload(parsed, channel)) ?? (channel === 'digital' ? rec : null)
  const metrics = {
    size: str(metricsRec?.size) ?? (channel === 'digital' ? str(rec.size) : undefined),
    lineHeight: str(metricsRec?.lineHeight) ?? (channel === 'digital' ? str(rec.lineHeight) : undefined),
    letterSpacing:
      str(metricsRec?.letterSpacing) ?? (channel === 'digital' ? str(rec.letterSpacing) : undefined),
    weight: str(metricsRec?.weight) ?? weight,
  }
  const which = facet ?? 'family'
  if (which === 'family') return family
  if (which === 'weight') return metrics.weight
  if (which === 'size') {
    const v = metrics.size
    if (!v) return undefined
    if (channel === 'print' && !isCssLength(v)) return undefined
    return v
  }
  if (which === 'lineHeight') {
    const v = metrics.lineHeight
    if (!v) return undefined
    if (channel === 'print' && !(isCssLength(v) || Number.isFinite(Number(v)))) return undefined
    return v
  }
  if (which === 'letterSpacing') {
    const v = metrics.letterSpacing
    if (!v) return undefined
    if (channel === 'print' && !(isCssLength(v) || v === 'normal')) return undefined
    return v
  }
  return undefined
}

function sizeCss(channelValue: unknown, parsed: unknown, ladderOnly: boolean, channel: TokenChannel): string | undefined {
  const rec = asRecord(channelValue) ?? (channel === 'digital' ? asRecord(parsed) : null)
  if (!rec && typeof channelValue === 'string') {
    const raw = channelValue.trim()
    if (!raw) return undefined
    if (channel === 'print' && !isCssLength(raw)) return undefined
    return raw
  }
  if (!rec) {
    if (channel === 'print') return undefined
    return typeof parsed === 'string' ? parsed.trim() || undefined : undefined
  }
  const min = str(rec.min)
  const preferred = str(rec.preferred)
  const max = str(rec.max)
  const pick = (v: string | undefined) => {
    if (!v) return undefined
    if (channel === 'print' && !isCssLength(v)) return undefined
    return v
  }
  const pMin = pick(min)
  const pPref = pick(preferred)
  const pMax = pick(max)
  if (!ladderOnly && pMin && pPref && pMax) return `clamp(${pMin}, ${pPref}, ${pMax})`
  return pPref || pMin || pMax
}

function shadowCss(channelValue: unknown, channel: TokenChannel): string | undefined {
  if (typeof channelValue === 'string' && channelValue.trim()) {
    if (channel === 'print' && !channelValue.trim().includes(' ')) return undefined
    return channelValue.trim()
  }
  const rec = asRecord(channelValue)
  if (!rec) return undefined
  const ox = str(rec.offsetX)
  const oy = str(rec.offsetY)
  const blur = str(rec.blur)
  const spread = str(rec.spread)
  const color = str(rec.color)
  const inset = rec.inset === true
  if (!ox && !oy && !blur && !spread && !color && !inset) return undefined
  if (channel === 'print') {
    const lengths = [ox, oy, blur, spread].filter(Boolean) as string[]
    if (lengths.some((v) => !isCssLength(v) && v !== '0')) return undefined
    if (color && !isCssColor(color)) return undefined
  }
  const core = `${ox || '0'} ${oy || '0'} ${blur || '0'} ${spread || '0'} ${color || 'rgba(0, 0, 0, 0.2)'}`
  return inset ? `inset ${core}` : core
}

function glowCss(channelValue: unknown, channel: TokenChannel): string | undefined {
  if (typeof channelValue === 'string' && channelValue.trim()) {
    return channelValue.trim()
  }
  const rec = asRecord(channelValue)
  if (!rec) return undefined
  const ox = str(rec.offsetX) || '0'
  const oy = str(rec.offsetY) || '0'
  const blur = str(rec.blur)
  const spread = str(rec.spread)
  const color = str(rec.color)
  if (!blur || !color) return undefined
  if (channel === 'print' && color && !isCssColor(color)) return undefined
  return `${ox} ${oy} ${blur} ${spread || '0'} ${color}`
}

const EFFECT_KINDS = new Set(['blur', 'brightness', 'saturate', 'contrast', 'grayscale'])

function effectCss(channelValue: unknown): string | undefined {
  if (typeof channelValue === 'string' && channelValue.trim()) {
    return channelValue.trim()
  }
  const rec = asRecord(channelValue)
  if (!rec) return undefined
  const kind = str(rec.kind)
  const amount = str(rec.amount)
  if (!kind || !amount || !EFFECT_KINDS.has(kind)) return undefined
  return `${kind}(${amount})`
}

function motionCss(channelValue: unknown): string | undefined {
  if (typeof channelValue === 'string' && channelValue.trim()) {
    return channelValue.trim()
  }
  const rec = asRecord(channelValue)
  if (!rec) return undefined
  const duration = str(rec.duration)
  const easing = str(rec.easing)
  if (!duration || !easing) return undefined
  return `${duration} ${easing}`
}

function cssForLeaf(
  leaf: PackLeafInput,
  facet: TypographyFacet | undefined,
  channel: TokenChannel,
): string | undefined {
  if (leaf.status && leaf.status !== 'active') return undefined
  const parsed = parseValue(leaf.value)
  if (parsed == null) return undefined
  const payload = channelPayload(parsed, channel)
  const type = leaf.type

  if (type === 'color') return colorCss(payload, parsed, channel)
  if (type === 'spacing' || type === 'radius' || type === 'border') {
    return lengthCss(payload, parsed, channel, 'length')
  }
  if (type === 'opacity') return lengthCss(payload, parsed, channel, 'opacity')
  if (type === 'typography') return typographyCss(parsed, facet, channel)
  if (type === 'shadow') return shadowCss(payload, channel)
  if (type === 'glow') return glowCss(payload, channel)
  if (type === 'effect') return effectCss(payload)
  if (type === 'motion') return motionCss(payload)
  if (type === 'size') return sizeCss(payload, parsed, false, channel)
  return undefined
}

/**
 * CSS string for canvas / TokenPicker from a token pack leaf (digital channel).
 * Pending → skip (CT-13). Missing facet → undefined (do not guess).
 */
export function digitalCssForLeaf(
  leaf: PackLeafInput,
  facet?: TypographyFacet,
): string | undefined {
  return cssForLeaf(leaf, facet, 'digital')
}

/**
 * CSS string from the token pack **print** channel (P42 / CT-6).
 * CSS-paintable print (`mm`/`pt`/`hex`) paints; Pantone/CMYK are not CSS.
 * Color without print hex MAY fall back to digital hex. Missing facet → skip.
 */
export function printCssForLeaf(
  leaf: PackLeafInput,
  facet?: TypographyFacet,
): string | undefined {
  return cssForLeaf(leaf, facet, 'print')
}

/** Channel for a canvas node: print inside PrintPage / Print* (incl. visual wrap). */
export function tokenChannelForNode(insidePrintPage: boolean, nodeType: string): TokenChannel {
  return insidePrintPage || nodeType.startsWith('Print') ? 'print' : 'digital'
}

export function cssForLeafChannel(
  leaf: PackLeafInput,
  facet: TypographyFacet | undefined,
  channel: TokenChannel,
): string | undefined {
  return cssForLeaf(leaf, facet, channel)
}

/** Single length for resize snap — preferred → min → max, never `clamp()`. Digital only. */
export function sizeLadderCss(leaf: PackLeafInput): string | undefined {
  if (leaf.status && leaf.status !== 'active') return undefined
  const parsed = parseValue(leaf.value)
  if (parsed == null) return undefined
  return sizeCss(channelPayload(parsed, 'digital'), parsed, true, 'digital')
}
