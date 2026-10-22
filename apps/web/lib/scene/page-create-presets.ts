/**
 * Add-page size presets — specs/domain/scene-pages.md · artboard-presets.md
 */
import type { SceneBreakpointId, SceneOp } from '@zaoly/contracts'
import type { ZaolyPackLeaf } from '../inspect/token-catalog'
import {
  artboardPresetsFromLeaves,
  defaultArtboardPresetLeaves,
  type ArtboardPreset,
} from '../tokens/artboard-presets'
import { EDITOR_BREAKPOINT_WIDTHS, type DigitalEditorBreakpoint } from './breakpoints'

export type PageCreatePresetId = string

export type PageCreatePreset = {
  id: PageCreatePresetId
  path: string
  label: string
  labelKey?: string
  breakpoint?: DigitalEditorBreakpoint
  width: number
  height: number
}

function toPageCreatePreset(preset: ArtboardPreset): PageCreatePreset {
  return {
    id: preset.id,
    path: preset.path,
    label: preset.label,
    width: preset.width,
    height: preset.height,
    ...(preset.lane ? { breakpoint: preset.lane } : {}),
  }
}

/** Fallback when pack resolution is unavailable (tests / offline). */
export const PAGE_CREATE_PRESETS: readonly PageCreatePreset[] = defaultArtboardPresetLeaves()
  .map((leaf) => {
    const parsed = artboardPresetsFromLeaves([leaf])[0]
    return parsed ? toPageCreatePreset(parsed) : null
  })
  .filter((p): p is PageCreatePreset => p != null)

export type PageCreateSizeMode = 'preset' | 'custom'

export type PageCreateInput = {
  name?: string
  mode: PageCreateSizeMode
  presetId?: PageCreatePresetId
  customWidth?: number
  customHeight?: number
}

export type PageCreateResolved = {
  name?: string
  breakpoint?: SceneBreakpointId
  frameWidth: number
  frameHeight: number
}

/** Resolve dialog presets from a merged token pack (seed + local artboard leaves). */
export function pageCreatePresetsFromPack(
  leaves: readonly ZaolyPackLeaf[] | null | undefined,
): PageCreatePreset[] {
  const fromPack = artboardPresetsFromLeaves(leaves ?? [])
  if (fromPack.length > 0) return fromPack.map(toPageCreatePreset)
  return [...PAGE_CREATE_PRESETS]
}

export function resolvePageCreatePreset(
  id: PageCreatePresetId,
  presets: readonly PageCreatePreset[] = PAGE_CREATE_PRESETS,
): PageCreatePreset {
  const found = presets.find((p) => p.id === id || p.path === id)
  if (found) return found
  return presets[0] ?? {
    id: 'desktop',
    path: 'artboard.preset.desktop',
    label: 'Desktop',
    breakpoint: 'desktop',
    width: EDITOR_BREAKPOINT_WIDTHS.desktop,
    height: 900,
  }
}

export function resolvePageCreateInput(
  input: PageCreateInput,
  presets: readonly PageCreatePreset[] = PAGE_CREATE_PRESETS,
): PageCreateResolved | { error: string } {
  const name = input.name?.trim() || undefined
  if (input.mode === 'custom') {
    const w = input.customWidth
    const h = input.customHeight
    if (w == null || h == null || !Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
      return { error: 'custom-dims' }
    }
    return { name, frameWidth: Math.round(w), frameHeight: Math.round(h) }
  }
  const preset = resolvePageCreatePreset(input.presetId ?? 'desktop', presets)
  return {
    name,
    ...(preset.breakpoint ? { breakpoint: preset.breakpoint } : {}),
    frameWidth: preset.width,
    frameHeight: preset.height,
  }
}

/** Build a single `add_page` op from dialog input. */
export function buildAddPageOp(
  input: PageCreateInput,
  presets: readonly PageCreatePreset[] = PAGE_CREATE_PRESETS,
): SceneOp | { error: string } {
  const resolved = resolvePageCreateInput(input, presets)
  if ('error' in resolved) return resolved
  return {
    op: 'add_page',
    ...(resolved.name ? { name: resolved.name } : {}),
    ...(resolved.breakpoint ? { breakpoint: resolved.breakpoint } : {}),
    frameWidth: resolved.frameWidth,
    frameHeight: resolved.frameHeight,
  }
}

/**
 * Apply a pack artboard preset to an existing page (frame Inspect).
 * Spec: specs/domain/artboard-presets.md
 */
export function planApplyArtboardPresetToPage(
  pageId: string,
  preset: PageCreatePreset,
): SceneOp[] {
  const ops: SceneOp[] = [
    {
      op: 'set_page_frame',
      pageId,
      width: preset.width,
      height: preset.height,
    },
  ]
  if (preset.breakpoint) {
    ops.push({
      op: 'set_page_breakpoint',
      pageId,
      breakpoint: preset.breakpoint,
    })
  }
  return ops
}
