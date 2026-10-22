/**
 * Design-token path → CSS custom property (`--ds-{path-with-dashes}`).
 * Knowledge: `token-layers.md` · SK-V13 Kit module handoff.
 */

/** Token path → CSS custom property name (with leading `--`). */
export function tokenPathToCssVar(path: string): string {
  const trimmed = path.trim()
  if (!trimmed) return '--ds-'
  const dashed = trimmed.replace(/\./g, '-').replace(/[^a-zA-Z0-9_-]+/g, '-')
  return `--ds-${dashed}`
}

/** Token path → `var(--ds-…)` for inline style values. */
export function tokenPathToCssVarRef(path: string): string {
  return `var(${tokenPathToCssVar(path)})`
}
