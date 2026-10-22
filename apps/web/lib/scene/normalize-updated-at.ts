/** Canonical ISO lock string for optimistic concurrency (`baseUpdatedAt`). */
export function normalizeSceneUpdatedAt(value: string | Date | null | undefined): string {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : value.toISOString()
  }
  if (typeof value !== 'string' || !value.trim()) return ''
  const ms = Date.parse(value)
  return Number.isNaN(ms) ? value.trim() : new Date(ms).toISOString()
}

export function sceneUpdatedAtEquals(a: string | Date | null | undefined, b: string | Date | null | undefined): boolean {
  const left = normalizeSceneUpdatedAt(a)
  const right = normalizeSceneUpdatedAt(b)
  return Boolean(left) && left === right
}
