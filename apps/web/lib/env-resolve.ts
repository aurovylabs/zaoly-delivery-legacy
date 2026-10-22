/**
 * Read env by canonical key only (`ZAOLY_*` / `NEXT_PUBLIC_ZAOLY_*`).
 * No CREATION_* / PLEXON_* aliases — see `knowledge/legacy-naming-leftovers.md`.
 */
export function envGet(primaryKey: string): string | undefined {
  const primary = process.env[primaryKey]
  if (primary != null && String(primary).trim() !== '') return primary
  return primary
}
