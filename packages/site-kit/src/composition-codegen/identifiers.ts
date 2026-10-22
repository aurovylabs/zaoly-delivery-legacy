/** Valid JS/TS export identifier (WS-3). */
export const EXPORT_IDENTIFIER_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/

export const MAX_IDENTIFIER_LEN = 48

const RESERVED_STORY_EXPORTS = new Set(['default', 'meta'])

/**
 * Designer-friendly label → PascalCase export id.
 * Leading digits move to suffix (`3-up` → `Up3`, not invalid `3Up`).
 */
export function normalizeExportIdentifier(raw: string, fallback = 'Variant'): string {
  const trimmed = raw.trim()
  if (!trimmed) return fallback
  if (/^[A-Z][A-Za-z0-9]*$/.test(trimmed) && trimmed.length <= MAX_IDENTIFIER_LEN) {
    return trimmed
  }
  const parts = trimmed.split(/[^A-Za-z0-9]+/).filter(Boolean)
  if (!parts.length) return fallback
  let exportName = parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
  exportName = exportName.slice(0, MAX_IDENTIFIER_LEN)
  if (exportName && !/^[A-Za-z_]/.test(exportName)) {
    const digitPrefix = exportName.match(/^(\d+)/)?.[1] ?? ''
    const rest = exportName.slice(digitPrefix.length)
    if (rest) {
      const namedRest = rest.charAt(0).toUpperCase() + rest.slice(1)
      exportName = `${namedRest}${digitPrefix}`
    } else {
      exportName = `N${exportName}`
    }
    exportName = exportName.slice(0, MAX_IDENTIFIER_LEN)
  }
  if (!EXPORT_IDENTIFIER_RE.test(exportName)) return fallback
  if (RESERVED_STORY_EXPORTS.has(exportName.toLowerCase())) {
    return `${exportName}Story`
  }
  return exportName
}

export function storyExportName(raw: string): string {
  return normalizeExportIdentifier(raw, 'Variant')
}
