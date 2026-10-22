/**
 * Durable Site Kit override store for Storybook live preview.
 * Postgres is production SSOT when ZAOLY_DATABASE_URL is set; disk is dev/cache.
 * Spec: specs/api/site-kit-write.md · knowledge/site-kit-storybook-coolify.md
 */
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { paths } from '../paths'
import {
  creationDatabaseUrl,
  getScenePool,
  isPostgresSceneStore,
} from '../scene/pg-store'
import { exportNameFromCompositionId, isAllowedOverrideId } from './override-ids'
import type { CompositionCatalogEntry } from './composition-write'
import {
  compositionCatalogKey,
  compositionComponentId,
  compositionScopeKey,
  compositionStoryTitle,
  isNamespacedCompositionOverrideId,
  parseCompositionComponentId,
} from '@zaoly/site-kit/composition-codegen'
import { sanitizeKitOverrideComponentSet } from '@zaoly/site-kit/master-variants'

export type SiteKitOverrideBody = {
  componentId: string
  args?: Record<string, unknown>
  tokenBindings?: Record<string, string>
  composition?: Record<string, unknown>
  /** Master named variants / Component Set cells for Storybook Live/Catalog. */
  variants?: {
    id: string
    name: string
    composition: Record<string, unknown>
    combination?: Record<string, string>
  }[]
  defaultVariantId?: string
  /** Phase 3 Component Set axes — Storybook axis controls. */
  axes?: { id: string; name: string; values: string[] }[]
  exportName?: string
  storyTitle?: string
  /** Collection scope for Patterns; null/omitted = legacy unscoped. */
  platformProjectId?: string | null
  updatedAt?: string | null
}

let schemaReady: Promise<void> | null = null

/** Soft-sanitize Component Set fields on read/write (never drops the override). */
export function sanitizeOverrideComponentSetFields(
  body: SiteKitOverrideBody,
): SiteKitOverrideBody {
  if (!body.variants?.length && !body.axes?.length) return body
  const cleaned = sanitizeKitOverrideComponentSet({
    variants: body.variants,
    axes: body.axes,
    defaultVariantId: body.defaultVariantId,
  })
  const next: SiteKitOverrideBody = { ...body }
  if (cleaned.variants?.length) {
    next.variants = cleaned.variants.map((v) => ({
      id: v.id,
      name: v.name,
      composition: (v.composition ?? {}) as Record<string, unknown>,
      ...(v.combination ? { combination: v.combination } : {}),
    }))
  } else {
    delete next.variants
  }
  if (cleaned.axes?.length) next.axes = cleaned.axes
  else delete next.axes
  if (cleaned.defaultVariantId) next.defaultVariantId = cleaned.defaultVariantId
  else delete next.defaultVariantId
  return next
}

export function parseOverrideUpdatedAt(value: string | null | undefined): number {
  if (!value) return 0
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : 0
}

/** Pick the body with the latest `updatedAt` (ties favor the second argument). */
export function pickNewerOverrideBody(
  left: SiteKitOverrideBody | null,
  right: SiteKitOverrideBody | null,
): SiteKitOverrideBody | null {
  if (!left) return right
  if (!right) return left
  const leftAt = parseOverrideUpdatedAt(left.updatedAt)
  const rightAt = parseOverrideUpdatedAt(right.updatedAt)
  return rightAt >= leftAt ? right : left
}

function mergeCatalogEntry(
  existing: CompositionCatalogEntry | undefined,
  incoming: CompositionCatalogEntry,
): CompositionCatalogEntry {
  if (!existing) return incoming
  const existingNs = isNamespacedCompositionOverrideId(existing.componentId)
  const incomingNs = isNamespacedCompositionOverrideId(incoming.componentId)
  // Prefer SK-S2 namespaced id over legacy Composition{Name} for the same catalog key.
  if (incomingNs && !existingNs) return incoming
  if (existingNs && !incomingNs) return existing
  const existingAt = parseOverrideUpdatedAt(existing.updatedAt)
  const incomingAt = parseOverrideUpdatedAt(incoming.updatedAt)
  return incomingAt >= existingAt ? incoming : existing
}

export async function ensureOverridesSchema(): Promise<void> {
  if (!isPostgresSceneStore()) return
  if (!schemaReady) {
    schemaReady = getScenePool()
      .query(
        `CREATE TABLE IF NOT EXISTS site_kit_overrides (
          component_id TEXT PRIMARY KEY,
          body JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL
        )`,
      )
      .then(() => undefined)
      .catch((err) => {
        schemaReady = null
        throw err
      })
  }
  await schemaReady
}

function overrideDir(cwd: string): string {
  return path.resolve(cwd, paths.siteKitOverridesRelPath)
}

async function writeDiskOverride(
  componentId: string,
  body: SiteKitOverrideBody,
  cwd: string,
): Promise<string> {
  const dir = overrideDir(cwd)
  await mkdir(dir, { recursive: true })
  const file = path.join(dir, `${componentId}.json`)
  await writeFile(file, JSON.stringify(body, null, 2), 'utf8')
  return path.relative(cwd, file)
}

async function readDiskOverride(
  componentId: string,
  cwd: string,
): Promise<SiteKitOverrideBody | null> {
  try {
    const raw = await readFile(path.join(overrideDir(cwd), `${componentId}.json`), 'utf8')
    return JSON.parse(raw) as SiteKitOverrideBody
  } catch {
    return null
  }
}

async function writePgOverride(
  componentId: string,
  body: SiteKitOverrideBody,
): Promise<void> {
  await ensureOverridesSchema()
  const updatedAt = body.updatedAt || new Date().toISOString()
  await getScenePool().query(
    `INSERT INTO site_kit_overrides (component_id, body, updated_at)
     VALUES ($1, $2::jsonb, $3::timestamptz)
     ON CONFLICT (component_id) DO UPDATE
     SET body = EXCLUDED.body, updated_at = EXCLUDED.updated_at`,
    [componentId, JSON.stringify(body), updatedAt],
  )
}

async function readPgOverride(componentId: string): Promise<SiteKitOverrideBody | null> {
  if (!creationDatabaseUrl()) return null
  await ensureOverridesSchema()
  const result = await getScenePool().query<{ body: SiteKitOverrideBody }>(
    `SELECT body FROM site_kit_overrides WHERE component_id = $1`,
    [componentId],
  )
  const row = result.rows[0]
  return row?.body ?? null
}

export async function readSiteKitOverride(
  componentId: string,
  options?: { cwd?: string },
): Promise<SiteKitOverrideBody | null> {
  if (!isAllowedOverrideId(componentId)) return null
  const cwd = options?.cwd ?? process.cwd()

  const exact = await readSiteKitOverrideExact(componentId, { cwd })
  if (exact) return exact

  // SK-S2: namespaced id → legacy Composition{Name} when scopeKey matches body.platformProjectId
  const parsed = parseCompositionComponentId(componentId)
  if (!parsed || parsed.legacy || !parsed.scopeKey) return null
  const legacyId = compositionComponentId(parsed.exportName)
  const legacy = await readSiteKitOverrideExact(legacyId, { cwd })
  const owner = legacy?.platformProjectId?.trim()
  if (!legacy || !owner) return null
  if (compositionScopeKey(owner) !== parsed.scopeKey) return null
  return { ...legacy, componentId }
}

async function readSiteKitOverrideExact(
  componentId: string,
  options?: { cwd?: string },
): Promise<SiteKitOverrideBody | null> {
  const cwd = options?.cwd ?? process.cwd()

  let fromPg: SiteKitOverrideBody | null = null
  if (isPostgresSceneStore()) {
    try {
      fromPg = await readPgOverride(componentId)
    } catch {
      // Fall through to disk — Storybook may still paint cached copy.
    }
  }

  const fromDisk = await readDiskOverride(componentId, cwd)
  const picked = pickNewerOverrideBody(fromPg, fromDisk)
  return picked ? sanitizeOverrideComponentSetFields(picked) : null
}

export async function writeSiteKitOverride(
  body: SiteKitOverrideBody,
  options?: { cwd?: string },
): Promise<
  | { ok: true; wrote: string[]; warning?: string }
  | { ok: false; code: string; error: string }
> {
  const componentId = body.componentId
  if (!isAllowedOverrideId(componentId)) {
    return { ok: false, code: 'unknown-component', error: `Unknown componentId: ${componentId}` }
  }
  const cwd = options?.cwd ?? process.cwd()
  const payload: SiteKitOverrideBody = sanitizeOverrideComponentSetFields({
    ...body,
    componentId,
    updatedAt: body.updatedAt ?? new Date().toISOString(),
  })
  const wrote: string[] = []
  const pgRequired = isPostgresSceneStore()
  let pgOk = false

  if (pgRequired) {
    try {
      await writePgOverride(componentId, payload)
      pgOk = true
      wrote.push(`pg:site_kit_overrides/${componentId}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return {
        ok: false,
        code: 'pg-unavailable',
        error: `Override not saved — database unavailable (${message})`,
      }
    }
  }

  try {
    wrote.push(await writeDiskOverride(componentId, payload, cwd))
  } catch (err) {
    if (pgOk) {
      return {
        ok: true,
        wrote,
        warning: 'Override saved to database; local disk cache failed',
      }
    }
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, code: 'disk-unwritable', error: message }
  }

  return { ok: true, wrote }
}

export async function listCompositionOverridesFromStore(options?: {
  cwd?: string;
}): Promise<CompositionCatalogEntry[]> {
  const byKey = new Map<string, CompositionCatalogEntry>()

  if (isPostgresSceneStore()) {
    try {
      await ensureOverridesSchema()
      const result = await getScenePool().query<{
        component_id: string
        body: SiteKitOverrideBody
        updated_at: Date | string
      }>(`SELECT component_id, body, updated_at FROM site_kit_overrides`)
      for (const row of result.rows) {
        const exportName =
          row.body.exportName ||
          exportNameFromCompositionId(row.component_id) ||
          ''
        if (!exportName) continue
        if (!row.component_id.startsWith('Composition')) continue
        const platformProjectId =
          typeof row.body.platformProjectId === 'string' && row.body.platformProjectId.trim()
            ? row.body.platformProjectId.trim()
            : null
        const entry: CompositionCatalogEntry = {
          name: exportName,
          exportName,
          storyTitle:
            row.body.storyTitle || compositionStoryTitle(exportName, platformProjectId),
          componentId: row.component_id,
          platformProjectId,
          updatedAt:
            typeof row.updated_at === 'string'
              ? row.updated_at
              : row.updated_at.toISOString(),
        }
        const key = compositionCatalogKey(platformProjectId, exportName)
        byKey.set(key, mergeCatalogEntry(byKey.get(key), entry))
      }
    } catch {
      // ignore — disk fallback below
    }
  }

  const cwd = options?.cwd ?? process.cwd()
  try {
    const files = await readdir(overrideDir(cwd))
    for (const file of files) {
      if (!file.startsWith('Composition') || !file.endsWith('.json')) continue
      try {
        const raw = await readFile(path.join(overrideDir(cwd), file), 'utf8')
        const body = JSON.parse(raw) as SiteKitOverrideBody
        const exportName =
          body.exportName ||
          exportNameFromCompositionId(body.componentId || file.replace(/\.json$/, '')) ||
          ''
        if (!exportName) continue
        const componentId =
          body.componentId ||
          compositionComponentId(exportName, body.platformProjectId)
        const platformProjectId =
          typeof body.platformProjectId === 'string' && body.platformProjectId.trim()
            ? body.platformProjectId.trim()
            : null
        const entry: CompositionCatalogEntry = {
          name: exportName,
          exportName,
          storyTitle: body.storyTitle || compositionStoryTitle(exportName, platformProjectId),
          componentId,
          platformProjectId,
          updatedAt: body.updatedAt ?? null,
        }
        const key = compositionCatalogKey(platformProjectId, exportName)
        byKey.set(key, mergeCatalogEntry(byKey.get(key), entry))
      } catch {
        // skip corrupt file
      }
    }
  } catch {
    // no dir
  }

  return [...byKey.values()].sort((a, b) => {
    const byName = a.exportName.localeCompare(b.exportName)
    if (byName !== 0) return byName
    return (a.platformProjectId ?? '').localeCompare(b.platformProjectId ?? '')
  })
}

export function __resetOverrideSchemaForTests(): void {
  schemaReady = null
}
