import type {
  CompositionScene,
  SceneComment,
  SceneMaster,
  SceneMasterAxis,
  SceneMasterVariant,
  SceneNode,
} from '@zaoly/contracts'
import { artboardCssSize, isEditorBreakpoint, isPrintPresetId, resolvePrintPreset, resolveSceneBreakpoint } from './breakpoints'
import { migrateMasterAxesFromPhase2 } from './master-variants'
import { normalizePageFrames } from './scene-board'
import { normalizePagesFromRaw, resolveActivePageId } from './scene-pages'
import { hydrateAtomicSlots } from './slots'

function normalizeCombination(raw: unknown): Record<string, string> | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof k === 'string' && k && typeof v === 'string' && v) out[k] = v
  }
  return Object.keys(out).length ? out : undefined
}

function normalizeAxis(raw: unknown): SceneMasterAxis | null {
  if (!raw || typeof raw !== 'object') return null
  const a = raw as Record<string, unknown>
  if (typeof a.id !== 'string' || !a.id) return null
  const name = typeof a.name === 'string' && a.name.trim() ? a.name.trim() : 'Axis'
  const valuesRaw = Array.isArray(a.values) ? a.values : []
  const values = valuesRaw
    .filter((v): v is string => typeof v === 'string' && Boolean(v.trim()))
    .map((v) => v.trim())
  if (!values.length) return null
  return { id: a.id, name, values }
}

function normalizeVariant(raw: unknown): SceneMasterVariant | null {
  if (!raw || typeof raw !== 'object') return null
  const v = raw as Record<string, unknown>
  const root = v.root as SceneNode | undefined
  if (typeof v.id !== 'string' || !v.id || !root?.id || !root?.type) return null
  const name = typeof v.name === 'string' && v.name.trim() ? v.name.trim() : 'Variant'
  const combination = normalizeCombination(v.combination)
  return {
    id: v.id,
    name,
    root: hydrateAtomicSlots(root),
    ...(combination ? { combination } : {}),
  }
}

function normalizeMasters(raw: unknown): SceneMaster[] | undefined {
  if (!Array.isArray(raw) || !raw.length) return undefined
  const out: SceneMaster[] = []
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue
    const m = entry as Record<string, unknown>
    const root = m.root as SceneNode | undefined
    if (typeof m.id !== 'string' || !m.id || !root?.id || !root?.type) continue
    const variantsRaw = Array.isArray(m.variants) ? m.variants : []
    const variants = variantsRaw
      .map(normalizeVariant)
      .filter((v): v is SceneMasterVariant => Boolean(v))
    const defaultVariantId =
      typeof m.defaultVariantId === 'string' &&
      m.defaultVariantId &&
      variants.some((v) => v.id === m.defaultVariantId)
        ? m.defaultVariantId
        : variants[0]?.id
    const axesRaw = Array.isArray(m.axes) ? m.axes : []
    const axes = axesRaw
      .map(normalizeAxis)
      .filter((a): a is SceneMasterAxis => Boolean(a))
    let master: SceneMaster = {
      id: m.id,
      name: typeof m.name === 'string' && m.name.trim() ? m.name : root.type,
      root: hydrateAtomicSlots(root),
      ...(typeof m.sourceKey === 'string' && m.sourceKey ? { sourceKey: m.sourceKey } : {}),
      ...(typeof m.pulledAt === 'string' && m.pulledAt ? { pulledAt: m.pulledAt } : {}),
      ...(typeof m.kitRevision === 'string' && m.kitRevision
        ? { kitRevision: m.kitRevision }
        : {}),
      ...(variants.length
        ? {
            variants,
            defaultVariantId: defaultVariantId!,
            root: hydrateAtomicSlots(
              variants.find((v) => v.id === defaultVariantId)?.root ?? root,
            ),
          }
        : {}),
      ...(axes.length ? { axes } : {}),
    }
    // Phase 2 → Phase 3: materialize Variant axis + combinations (idempotent).
    master = migrateMasterAxesFromPhase2(master)
    out.push(master)
  }
  return out.length ? out : undefined
}

function normalizeComments(raw: unknown): SceneComment[] | undefined {
  if (!Array.isArray(raw) || !raw.length) return undefined
  const out: SceneComment[] = []
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue
    const c = entry as Record<string, unknown>
    if (typeof c.id !== 'string' || typeof c.body !== 'string') continue
    const nodeId = typeof c.nodeId === 'string' ? c.nodeId : undefined
    const pinX = typeof c.pinX === 'number' && Number.isFinite(c.pinX) ? c.pinX : undefined
    const pinY = typeof c.pinY === 'number' && Number.isFinite(c.pinY) ? c.pinY : undefined
    // Keep node-anchored and/or spatial pins (P82b / P103 / client-share P8).
    if (!nodeId && (pinX === undefined || pinY === undefined)) continue
    const repliesRaw = Array.isArray(c.replies) ? c.replies : []
    const replies = repliesRaw
      .filter((r): r is Record<string, unknown> => Boolean(r) && typeof r === 'object')
      .filter(
        (r) =>
          typeof r.id === 'string' &&
          typeof r.body === 'string' &&
          typeof r.author === 'string' &&
          typeof r.createdAt === 'string',
      )
      .map((r) => ({
        id: r.id as string,
        body: r.body as string,
        author: r.author as string,
        createdAt: r.createdAt as string,
      }))
    out.push({
      id: c.id,
      ...(nodeId ? { nodeId } : {}),
      body: c.body,
      author: typeof c.author === 'string' ? c.author : 'unknown',
      createdAt: typeof c.createdAt === 'string' ? c.createdAt : new Date().toISOString(),
      resolved: Boolean(c.resolved),
      ...(pinX !== undefined && pinY !== undefined ? { pinX, pinY } : {}),
      ...(replies.length ? { replies } : { replies: [] }),
    })
  }
  return out.length ? out : undefined
}

/** Strip unknown top-level keys; keep contract fields only. */
export function normalizeScene(raw: Record<string, unknown> | null | undefined): CompositionScene | null {
  if (!raw?.id || !raw.root || typeof raw.root !== 'object' || !('id' in (raw.root as object))) return null
  const rootRaw = raw.root as SceneNode
  if (!rootRaw.id || !rootRaw.type) return null
  const root = hydrateAtomicSlots(rootRaw)
  const bpRaw = raw.activeBreakpoint
  const bp = typeof bpRaw === 'string' && isEditorBreakpoint(bpRaw) ? bpRaw : undefined
  const presetRaw = raw.activePrintPreset
  const preset =
    typeof presetRaw === 'string' && isPrintPresetId(presetRaw) ? presetRaw : undefined
  const masters = normalizeMasters(raw.masters)
  const comments = normalizeComments(raw.comments)
  const pagesRaw = normalizePagesFromRaw(raw.pages, root)
  const bpResolved = bp ?? resolveSceneBreakpoint(undefined)
  const presetResolved = preset ?? resolvePrintPreset(undefined)
  const artboardWidth = artboardCssSize(bpResolved, presetResolved).width
  const pages = normalizePageFrames(pagesRaw, artboardWidth)
  const activePageId = resolveActivePageId(pages, raw.activePageId)
  const activeRoot = pages.find((p) => p.id === activePageId)!.root
  const coverRaw = typeof raw.coverPageId === 'string' ? raw.coverPageId.trim() : ''
  const coverPageId =
    coverRaw && pages.some((p) => p.id === coverRaw) ? coverRaw : undefined
  const ownerRaw =
    typeof raw.ownerUserId === 'string'
      ? raw.ownerUserId.trim()
      : raw.ownerUserId === null
        ? null
        : undefined
  return {
    id: String(raw.id),
    name: typeof raw.name === 'string' ? raw.name : 'Untitled',
    version: 1,
    platformProjectId: (raw.platformProjectId as string | null | undefined) ?? null,
    ...(ownerRaw !== undefined ? { ownerUserId: ownerRaw || null } : {}),
    ...(bp ? { activeBreakpoint: bp } : {}),
    ...(preset ? { activePrintPreset: preset } : {}),
    ...(masters ? { masters } : {}),
    ...(comments ? { comments } : {}),
    pages,
    activePageId,
    ...(coverPageId ? { coverPageId } : {}),
    root: activeRoot,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
  }
}
