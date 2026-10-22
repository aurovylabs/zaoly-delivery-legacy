import fs from 'node:fs'
import path from 'node:path'
import type { CompositionScene } from '@zaoly/contracts'
import { paths } from '../paths'
import { createEmptyArtboardScene } from './demo-scene'
import { isEditorBreakpoint, isPrintPresetId } from './breakpoints'
import { normalizeScene } from './scene-normalize'
import { prepareScenePagesForPersist } from './scene-pages'
import {
  isPostgresSceneStore,
  pgDeleteScene,
  pgGetScene,
  pgListScenes,
  pgSceneCount,
  pgUpsertScene,
  __resetPgPoolForTests,
} from './pg-store'

export type SceneStoreBackend = 'postgres' | 'json'

/** In-memory + JSON file or Postgres when `ZAOLY_DATABASE_URL` is set. */
const scenes = new Map<string, CompositionScene>()
let hydrated = false
let durableEnabled = true
let pgSeeded = false

export function sceneStoreBackend(): SceneStoreBackend {
  return isPostgresSceneStore() ? 'postgres' : 'json'
}

function resolveStorePath(): string {
  const env = process.env[paths.envSceneStorePath]?.trim()
  if (env) return path.isAbsolute(env) ? env : path.join(process.cwd(), env)
  return path.join(process.cwd(), paths.sceneStoreRelPath)
}

function loadJsonScenesFromDisk(): CompositionScene[] {
  if (!durableEnabled) return []
  try {
    const file = resolveStorePath()
    if (!fs.existsSync(file)) return []
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as { scenes?: unknown[] }
    if (!Array.isArray(parsed.scenes)) return []
    const out: CompositionScene[] = []
    for (const raw of parsed.scenes) {
      const scene = normalizeScene(raw as Record<string, unknown>)
      if (scene) out.push(scene)
    }
    return out
  } catch {
    return []
  }
}

function persistToDisk(): void {
  if (!durableEnabled) return
  try {
    const file = resolveStorePath()
    const dir = path.dirname(file)
    fs.mkdirSync(dir, { recursive: true })
    const payload = {
      version: 1,
      updatedAt: new Date().toISOString(),
      scenes: Array.from(scenes.values()).map((s) => structuredClone(s)),
    }
    fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  } catch {
    // Memory remains source of truth if disk is read-only (e.g. some containers).
  }
}

function seedJson(): void {
  if (hydrated) return
  hydrated = true
  for (const scene of loadJsonScenesFromDisk()) scenes.set(scene.id, scene)
  if (scenes.size > 0) return
  const demo = createEmptyArtboardScene()
  scenes.set(demo.id, demo)
  persistToDisk()
}

async function seedPg(): Promise<void> {
  if (pgSeeded) return
  pgSeeded = true
  if ((await pgSceneCount()) > 0) return
  const fromDisk = loadJsonScenesFromDisk()
  if (fromDisk.length > 0) {
    for (const scene of fromDisk) await pgUpsertScene(scene)
    return
  }
  await pgUpsertScene(createEmptyArtboardScene())
}

function prepareScene(
  scene: CompositionScene,
  opts?: { touchUpdatedAt?: boolean },
): CompositionScene {
  if (scene.version !== 1) {
    throw new Error('Unsupported scene version')
  }
  if (!scene.id || !scene.root?.id || !scene.root?.type) {
    throw new Error('Scene requires id and root')
  }
  const bp =
    scene.activeBreakpoint && isEditorBreakpoint(scene.activeBreakpoint)
      ? scene.activeBreakpoint
      : undefined
  const preset =
    scene.activePrintPreset && isPrintPresetId(scene.activePrintPreset)
      ? scene.activePrintPreset
      : undefined
  const masters =
    Array.isArray(scene.masters) && scene.masters.length
      ? structuredClone(scene.masters)
      : undefined
  const comments =
    Array.isArray(scene.comments) && scene.comments.length
      ? structuredClone(scene.comments)
      : undefined
  const ownerUserId = scene.ownerUserId?.trim() || null
  const coverPageId = scene.coverPageId?.trim() || undefined
  const withPages = prepareScenePagesForPersist({
    id: scene.id,
    name: scene.name,
    version: 1,
    platformProjectId: scene.platformProjectId,
    ...(ownerUserId ? { ownerUserId } : {}),
    ...(bp ? { activeBreakpoint: bp } : {}),
    ...(preset ? { activePrintPreset: preset } : {}),
    ...(masters ? { masters } : {}),
    ...(comments ? { comments } : {}),
    ...(scene.pages?.length
      ? {
          pages: structuredClone(scene.pages),
          ...(scene.activePageId ? { activePageId: scene.activePageId } : {}),
          ...(coverPageId ? { coverPageId } : {}),
        }
      : coverPageId
        ? { coverPageId }
        : {}),
    root: structuredClone(scene.root),
    updatedAt: scene.updatedAt,
  })
  return {
    ...withPages,
    ...(ownerUserId ? { ownerUserId } : {}),
    ...(coverPageId && withPages.coverPageId == null ? { coverPageId } : {}),
    updatedAt:
      opts?.touchUpdatedAt === false ? scene.updatedAt : new Date().toISOString(),
  }
}

export async function listScenes(platformProjectId?: string | null): Promise<CompositionScene[]> {
  if (sceneStoreBackend() === 'postgres') {
    await seedPg()
    return pgListScenes(platformProjectId)
  }
  seedJson()
  const all = Array.from(scenes.values()).map((s) => structuredClone(s))
  if (platformProjectId == null || platformProjectId === '') return all
  return all.filter((s) => s.platformProjectId === platformProjectId)
}

export async function getScene(id: string): Promise<CompositionScene | null> {
  if (sceneStoreBackend() === 'postgres') {
    await seedPg()
    return pgGetScene(id)
  }
  seedJson()
  const hit = scenes.get(id)
  return hit ? structuredClone(hit) : null
}

export async function upsertScene(
  scene: CompositionScene,
  opts?: { touchUpdatedAt?: boolean },
): Promise<CompositionScene> {
  const existing = await getScene(scene.id)
  const withOwner: CompositionScene = {
    ...scene,
    ownerUserId:
      scene.ownerUserId?.trim() ||
      existing?.ownerUserId?.trim() ||
      null,
  }
  const saved = prepareScene(withOwner, opts)
  if (sceneStoreBackend() === 'postgres') {
    await seedPg()
    return pgUpsertScene(saved)
  }
  seedJson()
  scenes.set(saved.id, saved)
  persistToDisk()
  return structuredClone(saved)
}

export async function bindScenePlatformProject(
  id: string,
  platformProjectId: string | null,
): Promise<CompositionScene | null> {
  const current = await getScene(id)
  if (!current) return null
  return upsertScene({ ...current, platformProjectId })
}

export async function renameScene(
  id: string,
  name: string,
): Promise<CompositionScene | null> {
  const current = await getScene(id)
  if (!current) return null
  const next = name.trim()
  if (!next) throw new Error('name required')
  return upsertScene({ ...current, name: next })
}

/** Hard-delete. Returns false when the id was missing. */
export async function deleteScene(id: string): Promise<boolean> {
  if (sceneStoreBackend() === 'postgres') {
    await seedPg()
    return pgDeleteScene(id)
  }
  seedJson()
  const existed = scenes.delete(id)
  if (existed) persistToDisk()
  return existed
}

/** Absolute path currently used for JSON persistence (tests / ops). */
export function getSceneStorePath(): string {
  return resolveStorePath()
}

/**
 * Test helper — clear memory. Set `wipeDisk` to delete the JSON file.
 * Call with `{ durable: true }` without wipe to rehydrate from existing disk on next access.
 */
export function __resetSceneStoreForTests(options?: {
  durable?: boolean
  wipeDisk?: boolean
}): void {
  scenes.clear()
  hydrated = false
  pgSeeded = false
  durableEnabled = options?.durable !== false
  __resetPgPoolForTests()
  if (!options?.wipeDisk) return
  try {
    const file = resolveStorePath()
    if (fs.existsSync(file)) fs.unlinkSync(file)
  } catch {
    // ignore
  }
}
