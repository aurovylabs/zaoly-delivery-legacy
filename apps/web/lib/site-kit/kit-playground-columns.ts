/**
 * Kit Playground resizable columns (SK-V21).
 * Spec: `specs/domain/site-kit-playground.md`
 * Columns MUST never exceed the playground body width (100% container).
 */
import { paths } from '../paths'

export type KitColumnLayout = {
  /** Nav column width in CSS pixels. */
  sidebarPx: number
  /** Fraction of leftover width for the editor (preview gets the rest). */
  editorShare: number
}

export const KIT_COLUMN_DEFAULTS: KitColumnLayout = {
  sidebarPx: 224,
  editorShare: 0.52,
}

export const KIT_COLUMN_LIMITS = {
  sidebarMin: 160,
  sidebarMax: 420,
  paneMinPx: 200,
  handlePx: 6,
} as const

/** Max sidebar so two panes + handles still fit in `bodyWidth`. */
export function maxSidebarForBody(bodyWidth: number): number {
  const handles = KIT_COLUMN_LIMITS.handlePx * 2
  const room = bodyWidth - handles - KIT_COLUMN_LIMITS.paneMinPx * 2
  return Math.min(
    KIT_COLUMN_LIMITS.sidebarMax,
    Math.max(KIT_COLUMN_LIMITS.sidebarMin, Math.floor(room)),
  )
}

export function clampKitColumnLayout(
  raw: Partial<KitColumnLayout> | null | undefined,
  bodyWidth?: number,
): KitColumnLayout {
  const sidebarMax =
    typeof bodyWidth === 'number' && Number.isFinite(bodyWidth) && bodyWidth > 0
      ? maxSidebarForBody(bodyWidth)
      : KIT_COLUMN_LIMITS.sidebarMax
  const sidebarMin = Math.min(KIT_COLUMN_LIMITS.sidebarMin, sidebarMax)
  const sidebarPx = Math.round(
    Math.min(
      sidebarMax,
      Math.max(
        sidebarMin,
        typeof raw?.sidebarPx === 'number' && Number.isFinite(raw.sidebarPx)
          ? raw.sidebarPx
          : KIT_COLUMN_DEFAULTS.sidebarPx,
      ),
    ),
  )
  const editorShare =
    typeof raw?.editorShare === 'number' && Number.isFinite(raw.editorShare)
      ? Math.min(0.85, Math.max(0.15, raw.editorShare))
      : KIT_COLUMN_DEFAULTS.editorShare
  return { sidebarPx, editorShare }
}

export function readKitColumnLayout(bodyWidth?: number): KitColumnLayout {
  if (typeof sessionStorage === 'undefined') {
    return clampKitColumnLayout(KIT_COLUMN_DEFAULTS, bodyWidth)
  }
  try {
    const raw = sessionStorage.getItem(paths.kitPlaygroundColumnsStorageKey)
    if (!raw) return clampKitColumnLayout(KIT_COLUMN_DEFAULTS, bodyWidth)
    return clampKitColumnLayout(JSON.parse(raw) as Partial<KitColumnLayout>, bodyWidth)
  } catch {
    return clampKitColumnLayout(KIT_COLUMN_DEFAULTS, bodyWidth)
  }
}

export function writeKitColumnLayout(layout: KitColumnLayout, bodyWidth?: number): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(
      paths.kitPlaygroundColumnsStorageKey,
      JSON.stringify(clampKitColumnLayout(layout, bodyWidth)),
    )
  } catch {
    /* quota / private mode */
  }
}

/** Drag sidebar ↔ editor edge by pointer delta. Always fits in `bodyWidth`. */
export function applySidebarResize(
  layout: KitColumnLayout,
  deltaX: number,
  bodyWidth: number,
): KitColumnLayout {
  const maxSidebar = maxSidebarForBody(bodyWidth)
  const minSidebar = Math.min(KIT_COLUMN_LIMITS.sidebarMin, maxSidebar)
  const sidebarPx = Math.round(
    Math.min(maxSidebar, Math.max(minSidebar, layout.sidebarPx + deltaX)),
  )
  return clampKitColumnLayout({ ...layout, sidebarPx }, bodyWidth)
}

/** Drag editor ↔ preview split; `clientX` relative to body left edge. */
export function applyEditorPreviewSplit(
  layout: KitColumnLayout,
  clientXInBody: number,
  bodyWidth: number,
): KitColumnLayout {
  const clamped = clampKitColumnLayout(layout, bodyWidth)
  const handles = KIT_COLUMN_LIMITS.handlePx * 2
  const remaining = bodyWidth - clamped.sidebarPx - handles
  if (remaining <= KIT_COLUMN_LIMITS.paneMinPx * 2) {
    return clamped
  }
  const x = clientXInBody - clamped.sidebarPx - KIT_COLUMN_LIMITS.handlePx
  const minShare = KIT_COLUMN_LIMITS.paneMinPx / remaining
  const maxShare = 1 - minShare
  const editorShare = Math.min(maxShare, Math.max(minShare, x / remaining))
  return clampKitColumnLayout({ ...clamped, editorShare }, bodyWidth)
}

/** CSS vars for the playground body flex layout (fills ≤100% width). */
export function kitColumnCssVars(layout: KitColumnLayout): Record<string, string> {
  const clamped = clampKitColumnLayout(layout)
  const previewShare = 1 - clamped.editorShare
  return {
    ['--kit-col-sidebar' as string]: `${clamped.sidebarPx}px`,
    ['--kit-col-editor-fr' as string]: String(clamped.editorShare),
    ['--kit-col-preview-fr' as string]: String(previewShare),
  }
}
