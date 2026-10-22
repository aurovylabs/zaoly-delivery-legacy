import 'server-only'
import { mkdir, readFile, rename as fsRename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { envGet } from '../env-resolve'
import { paths } from '../paths'
import {
  catalogToPackLeaves,
  emptyTokenPackFile,
  mergeTokenPack,
  overridesFromPackFile,
  type TokenOrigin,
  type TokenPackFile,
} from './pack-merge'
import { rewriteTokenPathRefs } from './token-expr'
import {
  ensureScenesSchema,
  getScenePool,
  isPostgresSceneStore,
} from '../scene/pg-store'
import type { ZaolyPackLeaf } from '../inspect/token-catalog'

let schemaReady: Promise<void> | null = null
/** Serialize file-store mutations inside one Node process. */
let fileWriteChain: Promise<unknown> = Promise.resolve()

export async function ensureTokenLeavesSchema(): Promise<void> {
  if (!isPostgresSceneStore()) return
  if (!schemaReady) {
    schemaReady = (async () => {
      await ensureScenesSchema()
      const pool = getScenePool()
      await pool.query(`
        CREATE TABLE IF NOT EXISTS token_leaves (
          path TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          value TEXT NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `)
    })().catch((err) => {
      schemaReady = null
      throw err
    })
  }
  await schemaReady
}

function tokenPackFilePath(): string {
  const override = envGet(paths.envTokenPackStorePath)?.trim()
  if (override) {
    return path.isAbsolute(override) ? override : path.join(process.cwd(), override)
  }
  return path.join(process.cwd(), paths.tokenPackStoreRelPath)
}

async function withFileStoreLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = fileWriteChain.then(fn, fn)
  fileWriteChain = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

async function readFilePack(): Promise<TokenPackFile> {
  try {
    const raw = await readFile(tokenPackFilePath(), 'utf8')
    const parsed = JSON.parse(raw) as TokenPackFile
    if (!parsed || parsed.version !== 1 || !parsed.leaves || typeof parsed.leaves !== 'object') {
      return emptyTokenPackFile()
    }
    return parsed
  } catch {
    return emptyTokenPackFile()
  }
}

/** Atomic replace: write temp sibling, then rename over destination. */
async function writeFilePack(file: TokenPackFile): Promise<void> {
  const dest = tokenPackFilePath()
  await mkdir(path.dirname(dest), { recursive: true })
  const tmp = `${dest}.${process.pid}.${Date.now()}.tmp`
  const payload = `${JSON.stringify(file, null, 2)}\n`
  await writeFile(tmp, payload, 'utf8')
  await fsRename(tmp, dest)
}

function asActiveLeaf(leaf: ZaolyPackLeaf): ZaolyPackLeaf {
  return {
    path: leaf.path,
    type: leaf.type,
    value: leaf.value,
    status: 'active',
  }
}

export async function listTokenOverrides(): Promise<ZaolyPackLeaf[]> {
  if (isPostgresSceneStore()) {
    await ensureTokenLeavesSchema()
    const result = await getScenePool().query<{
      path: string
      type: string
      value: string
    }>(`SELECT path, type, value FROM token_leaves ORDER BY path`)
    return result.rows.map((row) => ({
      path: row.path,
      type: row.type,
      value: row.value,
      status: 'active',
    }))
  }
  return overridesFromPackFile(await readFilePack())
}

export async function loadMergedLocalPack(): Promise<{
  tokens: ZaolyPackLeaf[]
  origins: Record<string, TokenOrigin>
}> {
  const overrides = await listTokenOverrides()
  return mergeTokenPack(catalogToPackLeaves(), overrides)
}

export async function upsertTokenOverride(leaf: ZaolyPackLeaf): Promise<ZaolyPackLeaf> {
  const [saved] = await upsertTokenOverridesBatch([leaf])
  return saved!
}

/** Upsert many overrides in one file rewrite / one PG transaction. */
export async function upsertTokenOverridesBatch(
  leaves: ZaolyPackLeaf[],
): Promise<ZaolyPackLeaf[]> {
  const next = leaves.map(asActiveLeaf)
  if (next.length === 0) return []
  if (isPostgresSceneStore()) {
    await ensureTokenLeavesSchema()
    const client = await getScenePool().connect()
    try {
      await client.query('BEGIN')
      for (const leaf of next) {
        await client.query(
          `INSERT INTO token_leaves (path, type, value, updated_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (path) DO UPDATE SET type = EXCLUDED.type, value = EXCLUDED.value, updated_at = NOW()`,
          [leaf.path, leaf.type, leaf.value],
        )
      }
      await client.query('COMMIT')
      return next
    } catch (err) {
      try {
        await client.query('ROLLBACK')
      } catch {
        /* ignore */
      }
      throw err
    } finally {
      client.release()
    }
  }
  return withFileStoreLock(async () => {
    const file = await readFilePack()
    for (const leaf of next) {
      file.leaves[leaf.path] = { type: leaf.type, value: leaf.value }
    }
    file.updatedAt = new Date().toISOString()
    await writeFilePack(file)
    return next
  })
}

export async function deleteTokenOverride(tokenPath: string): Promise<boolean> {
  if (isPostgresSceneStore()) {
    await ensureTokenLeavesSchema()
    const result = await getScenePool().query(`DELETE FROM token_leaves WHERE path = $1`, [
      tokenPath,
    ])
    return (result.rowCount ?? 0) > 0
  }
  return withFileStoreLock(async () => {
    const file = await readFilePack()
    if (!(tokenPath in file.leaves)) return false
    delete file.leaves[tokenPath]
    file.updatedAt = new Date().toISOString()
    await writeFilePack(file)
    return true
  })
}

async function renameTokenOverridePg(opts: {
  fromPath: string
  leaf: ZaolyPackLeaf
}): Promise<{ token: ZaolyPackLeaf; rewritten: number }> {
  const fromPath = opts.fromPath.trim()
  const token = asActiveLeaf(opts.leaf)
  await ensureTokenLeavesSchema()
  const client = await getScenePool().connect()
  try {
    await client.query('BEGIN')
    await client.query(
      `INSERT INTO token_leaves (path, type, value, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (path) DO UPDATE SET type = EXCLUDED.type, value = EXCLUDED.value, updated_at = NOW()`,
      [token.path, token.type, token.value],
    )
    const result = await client.query<{ path: string; type: string; value: string }>(
      `SELECT path, type, value FROM token_leaves`,
    )
    let rewritten = 0
    for (const row of result.rows) {
      if (row.path === fromPath || row.path === token.path) continue
      const nextValue = rewriteTokenPathRefs(row.value, fromPath, token.path)
      if (nextValue === row.value) continue
      await client.query(
        `UPDATE token_leaves SET value = $2, updated_at = NOW() WHERE path = $1`,
        [row.path, nextValue],
      )
      rewritten += 1
    }
    if (fromPath && fromPath !== token.path) {
      await client.query(`DELETE FROM token_leaves WHERE path = $1`, [fromPath])
    }
    await client.query('COMMIT')
    return { token, rewritten }
  } catch (err) {
    try {
      await client.query('ROLLBACK')
    } catch {
      /* ignore rollback errors */
    }
    throw err
  } finally {
    client.release()
  }
}

/**
 * Move a local override to a new path and rewrite `{from}` refs in sibling overrides.
 * Fixture-only sources: upserts `leaf` only (fork); delete is a no-op when no override existed.
 * File store: single atomic rewrite. Postgres: one transaction.
 */
export async function renameTokenOverride(opts: {
  fromPath: string
  leaf: ZaolyPackLeaf
}): Promise<{ token: ZaolyPackLeaf; rewritten: number }> {
  if (isPostgresSceneStore()) {
    return renameTokenOverridePg(opts)
  }

  const fromPath = opts.fromPath.trim()
  const token = asActiveLeaf(opts.leaf)
  return withFileStoreLock(async () => {
    const file = await readFilePack()
    file.leaves[token.path] = { type: token.type, value: token.value }
    let rewritten = 0
    for (const [leafPath, leaf] of Object.entries(file.leaves)) {
      if (leafPath === fromPath || leafPath === token.path) continue
      const nextValue = rewriteTokenPathRefs(leaf.value, fromPath, token.path)
      if (nextValue === leaf.value) continue
      file.leaves[leafPath] = { type: leaf.type, value: nextValue }
      rewritten += 1
    }
    if (fromPath && fromPath !== token.path) {
      delete file.leaves[fromPath]
    }
    file.updatedAt = new Date().toISOString()
    await writeFilePack(file)
    return { token, rewritten }
  })
}
