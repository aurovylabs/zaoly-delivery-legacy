/**
 * SK-S5 — scoped package import paths for Collection Patterns.
 * Spec: specs/domain/site-kit-collection-scope.md
 */
import { compositionScopeKey } from './validate'

/** npm package name for Site Kit (never hardcode in consumers — use helpers). */
export const SITE_KIT_PACKAGE_NAME = '@zaoly/site-kit'

/**
 * Canonical Pattern module import:
 * `@zaoly/site-kit/c/{scopeKey}/{ExportName}`
 * `scopeKey` = `compositionScopeKey(platformProjectId)` (disk + package align).
 */
export function compositionPackageImportPath(
  exportName: string,
  platformProjectId: string,
): string {
  const name = exportName.trim()
  const scope = compositionScopeKey(platformProjectId)
  return `${SITE_KIT_PACKAGE_NAME}/c/${scope}/${name}`
}

/** Collection barrel: `@zaoly/site-kit/c/{scopeKey}` */
export function compositionPackageCollectionImportPath(
  platformProjectId: string,
): string {
  return `${SITE_KIT_PACKAGE_NAME}/c/${compositionScopeKey(platformProjectId)}`
}

/** Relative disk dir under kit root for a Collection’s Pattern modules. */
export function compositionScopedDiskRelDir(platformProjectId: string): string {
  return `src/compositions/c/${compositionScopeKey(platformProjectId)}`
}

/**
 * Generate `src/compositions/c/{scopeKey}/index.ts` barrel.
 * Never mixes Collections — one scopeKey per file.
 */
export function generateCompositionCollectionBarrel(
  exportNames: readonly string[],
): string {
  const names = [
    ...new Set(
      exportNames
        .map((n) => n.trim())
        .filter((n) => /^[A-Z][A-Za-z0-9]*$/.test(n)),
    ),
  ].sort((a, b) => a.localeCompare(b))

  const header =
    '/** SK-S5 Collection Pattern barrel — import via @zaoly/site-kit/c/{scopeKey}. */\n'
  if (!names.length) {
    return `${header}export {}\n`
  }
  const lines = names.map((n) => `export { ${n} } from './${n}'`)
  return `${header}${lines.join('\n')}\n`
}

/** Filenames in a scope dir → export names (skips stories + index). */
export function compositionExportNamesFromFilenames(
  filenames: readonly string[],
): string[] {
  const names: string[] = []
  for (const file of filenames) {
    if (!file.endsWith('.tsx')) continue
    if (file.endsWith('.stories.tsx')) continue
    if (file === 'index.tsx') continue
    const base = file.slice(0, -'.tsx'.length)
    if (/^[A-Z][A-Za-z0-9]*$/.test(base)) names.push(base)
  }
  return names
}
