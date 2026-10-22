/** RAF-batched viewport commits — `specs/domain/editor-performance.md` P83. */

export type ViewportTransform = {
  zoom: number
  panX: number
  panY: number
}

export type ViewportCommit = (next: Partial<ViewportTransform>) => void

export function createRafViewportCommit(
  getCurrent: () => ViewportTransform,
  apply: (next: ViewportTransform) => void,
): ViewportCommit {
  let pending: ViewportTransform | null = null
  let rafId: number | null = null

  return (partial: Partial<ViewportTransform>) => {
    const base = pending ?? getCurrent()
    pending = { ...base, ...partial }
    if (rafId != null) return
    rafId = requestAnimationFrame(() => {
      rafId = null
      const next = pending
      pending = null
      if (next) apply(next)
    })
  }
}

/** Flush any pending RAF commit synchronously (tests / gesture end). */
export function flushRafViewportCommit(
  commit: ViewportCommit,
  getPending: () => ViewportTransform | null,
  apply: (next: ViewportTransform) => void,
): void {
  const pending = getPending()
  if (pending) apply(pending)
}
