import type { SceneOp } from '@zaoly/contracts'
import { inspectFieldsForType } from './field-catalog'

/** HTML5 DnD MIME for Token Studio → canvas bind (CT-19). */
export const BRAND_TOKEN_DND_MIME = 'application/x-zaoly-brand-token'

export type BrandTokenDragPayload = {
  path: string
  type: string
}

/** Active drag payload — browsers hide custom MIME getData during dragover. */
let activeBrandTokenDrag: BrandTokenDragPayload | null = null

export function setActiveBrandTokenDrag(payload: BrandTokenDragPayload | null): void {
  activeBrandTokenDrag = payload
}

export function getActiveBrandTokenDrag(): BrandTokenDragPayload | null {
  return activeBrandTokenDrag
}

export function parseBrandTokenDragPayload(raw: string): BrandTokenDragPayload | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  try {
    const parsed = JSON.parse(trimmed) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    const path = String((parsed as { path?: unknown }).path ?? '').trim()
    const type = String((parsed as { type?: unknown }).type ?? '').trim()
    if (!path || !type) return null
    return { path, type }
  } catch {
    return null
  }
}

export function encodeBrandTokenDragPayload(payload: BrandTokenDragPayload): string {
  return JSON.stringify({ path: payload.path, type: payload.type })
}

export function hasBrandTokenDrag(transfer: DataTransfer): boolean {
  return Array.from(transfer.types).includes(BRAND_TOKEN_DND_MIME)
}

export function brandTokenPayloadFromDrop(transfer: DataTransfer): BrandTokenDragPayload | null {
  const fromMime = parseBrandTokenDragPayload(transfer.getData(BRAND_TOKEN_DND_MIME))
  if (fromMime) return fromMime
  return getActiveBrandTokenDrag()
}

const COLOR_KEYS = ['background', 'color', 'borderColor'] as const
const SPACING_KEYS = ['gap', 'padding', 'margin'] as const
const SIZE_KEYS = ['width', 'height'] as const
const TYPO_KEYS = [
  'fontFamily',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
] as const

export type TokenDropPlan =
  | { ok: true; keys: string[]; label: string }
  | { ok: false; label: string }

function bindableFieldNames(nodeType: string): Set<string> {
  const names = new Set<string>()
  for (const field of inspectFieldsForType(nodeType)) {
    if (field.tokenGroup) names.add(field.name)
  }
  return names
}

function firstPresent(priority: readonly string[], available: Set<string>): string | null {
  for (const key of priority) {
    if (available.has(key)) return key
  }
  return null
}

function bindLabel(keys: string[], packType: string): string {
  if (packType === 'typography') return 'Bind type'
  if (keys[0] === 'background') return 'Bind fill'
  if (keys[0] === 'color') return 'Bind color'
  if (keys[0] === 'borderColor') return 'Bind stroke'
  if (keys[0] === 'gap') return 'Bind gap'
  if (keys[0] === 'padding') return 'Bind padding'
  if (keys[0] === 'margin') return 'Bind margin'
  if (keys[0] === 'radius') return 'Bind radius'
  if (keys[0] === 'opacity') return 'Bind opacity'
  if (keys[0] === 'width' || keys[0] === 'height') return 'Bind size'
  return `Bind ${keys[0]}`
}

function colorKeyPriority(nodeType: string): readonly string[] {
  // Text leaves prefer ink; surfaces/layout prefer fill (CT-19).
  if (
    /^(Site)?Text$|^(Site)?Heading$|^Lede$|^(Site)?Link$|^Link$/i.test(nodeType)
  ) {
    return ['color', 'background', 'borderColor']
  }
  return COLOR_KEYS
}

/**
 * CT-19: pick default Inspect binding key(s) for a token pack leaf type on a node type.
 */
export function planTokenDrop(packType: string, nodeType: string): TokenDropPlan {
  const type = packType.trim().toLowerCase()
  const available = bindableFieldNames(nodeType)

  if (type === 'typography') {
    const keys = TYPO_KEYS.filter((k) => available.has(k))
    if (!keys.length) return { ok: false, label: "Can't drop" }
    return { ok: true, keys: [...keys], label: bindLabel(keys, type) }
  }

  let key: string | null = null
  if (type === 'color') key = firstPresent(colorKeyPriority(nodeType), available)
  else if (type === 'spacing') key = firstPresent(SPACING_KEYS, available)
  else if (type === 'radius') key = available.has('radius') ? 'radius' : null
  else if (type === 'opacity') key = available.has('opacity') ? 'opacity' : null
  else if (type === 'size') key = firstPresent(SIZE_KEYS, available)
  else return { ok: false, label: "Can't drop" }

  if (!key) return { ok: false, label: "Can't drop" }
  return { ok: true, keys: [key], label: bindLabel([key], type) }
}

/** Scene ops matching Inspect `setToken` (base breakpoint, single node). */
export function buildTokenBindOps(
  nodeId: string,
  keys: string[],
  tokenPath: string,
): SceneOp[] {
  const ops: SceneOp[] = []
  for (const key of keys) {
    ops.push({ op: 'set_prop', nodeId, key, value: '' })
    ops.push({ op: 'set_token_binding', nodeId, key, tokenPath })
  }
  return ops
}
