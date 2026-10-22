import fs from 'node:fs'
import path from 'node:path'
import type {
  CompositionScene,
  CreateSceneVersionInput,
  SceneNode,
  SceneVersionAuthor,
  SceneVersionCheckpoint,
  SceneVersionSummary,
} from '@zaoly/contracts'
import { paths } from '../paths'
import { getScene, upsertScene } from './scene-store'
import {
  pgGetSceneVersion,
  pgInsertSceneVersion,
  pgListSceneVersions,
  pgNextVersionNumber,
  versionStoreBackend,
  __resetSceneVersionsSchemaForTests,
} from './pg-version-store'

export { versionStoreBackend } from './pg-version-store'

const versionsMemoryMap = new Map<string, SceneVersionCheckpoint[]>()

function getVersionsRoot(): string {
  const explicit = process.env[paths.envVersionStorePath]?.trim()
  if (explicit) return explicit
  return path.join(process.cwd(), paths.sceneVersionsStoreRelPath)
}

function getStorageDir(sceneId: string): string {
  return path.join(getVersionsRoot(), sceneId)
}

function countNodes(node: SceneNode): number {
  let count = 1
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      count += countNodes(child)
    }
  }
  return count
}

function countSceneNodes(scene: CompositionScene): number {
  if (Array.isArray(scene.pages) && scene.pages.length > 0) {
    return scene.pages.reduce((acc, p) => acc + countNodes(p.root), 0)
  }
  return countNodes(scene.root)
}

function hydrateFromDisk(sceneId: string): SceneVersionCheckpoint[] {
  const dir = getStorageDir(sceneId)
  if (!fs.existsSync(dir)) return []
  try {
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'))
    const checkpoints: SceneVersionCheckpoint[] = []
    for (const file of files) {
      try {
        const raw = fs.readFileSync(path.join(dir, file), 'utf8')
        const parsed = JSON.parse(raw) as SceneVersionCheckpoint
        if (parsed?.id && parsed?.snapshot) {
          checkpoints.push(parsed)
        }
      } catch {
        // Ignore corrupted file
      }
    }
    checkpoints.sort((a, b) => b.versionNumber - a.versionNumber)
    return checkpoints
  } catch {
    return []
  }
}

function ensureHydrated(sceneId: string): SceneVersionCheckpoint[] {
  let list = versionsMemoryMap.get(sceneId)
  if (!list) {
    list = hydrateFromDisk(sceneId)
    versionsMemoryMap.set(sceneId, list)
  }
  return list
}

function persistCheckpoint(sceneId: string, checkpoint: SceneVersionCheckpoint): void {
  try {
    const dir = getStorageDir(sceneId)
    fs.mkdirSync(dir, { recursive: true })
    const filePath = path.join(dir, `${checkpoint.id}.json`)
    fs.writeFileSync(filePath, JSON.stringify(checkpoint, null, 2), 'utf8')
  } catch (err) {
    console.error(`[version-store] Failed to write checkpoint ${checkpoint.id} to disk:`, err)
  }
}

function buildCheckpoint(input: {
  sceneId: string
  scene: CompositionScene
  versionNumber: number
  name: string
  description?: string
  isAutoSave: boolean
  author: SceneVersionAuthor
}): SceneVersionCheckpoint {
  const versionId = `ver_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
  return {
    id: versionId,
    sceneId: input.sceneId,
    versionNumber: input.versionNumber,
    name: input.name,
    ...(input.description ? { description: input.description } : {}),
    isAutoSave: input.isAutoSave,
    author: input.author,
    pageCount: input.scene.pages?.length || 1,
    nodeCount: countSceneNodes(input.scene),
    createdAt: new Date().toISOString(),
    snapshot: JSON.parse(JSON.stringify(input.scene)) as CompositionScene,
  }
}

export async function listSceneVersions(sceneId: string): Promise<SceneVersionSummary[]> {
  if (versionStoreBackend() === 'postgres') {
    return pgListSceneVersions(sceneId)
  }
  const checkpoints = ensureHydrated(sceneId)
  return checkpoints.map((c) => ({
    id: c.id,
    sceneId: c.sceneId,
    versionNumber: c.versionNumber,
    name: c.name,
    description: c.description,
    isAutoSave: c.isAutoSave,
    author: c.author,
    pageCount: c.pageCount,
    nodeCount: c.nodeCount,
    createdAt: c.createdAt,
  }))
}

export async function getSceneVersion(
  sceneId: string,
  versionId: string,
): Promise<SceneVersionCheckpoint | null> {
  if (versionStoreBackend() === 'postgres') {
    return pgGetSceneVersion(sceneId, versionId)
  }
  const checkpoints = ensureHydrated(sceneId)
  return checkpoints.find((c) => c.id === versionId) ?? null
}

export async function createSceneVersion(
  sceneId: string,
  input: CreateSceneVersionInput,
  author?: SceneVersionAuthor,
  explicitSceneSnapshot?: CompositionScene,
): Promise<SceneVersionCheckpoint> {
  const scene = explicitSceneSnapshot ?? (await getScene(sceneId))
  if (!scene) {
    throw new Error(`Scene "${sceneId}" not found for version checkpoint.`)
  }

  const defaultAuthor: SceneVersionAuthor = author ?? {
    id: 'usr_designer',
    name: 'Lead Designer',
  }

  if (versionStoreBackend() === 'postgres') {
    const versionNumber = await pgNextVersionNumber(sceneId)
    const checkpoint = buildCheckpoint({
      sceneId,
      scene,
      versionNumber,
      name: input.name.trim() || `Version ${versionNumber}`,
      description: input.description?.trim(),
      isAutoSave: Boolean(input.isAutoSave),
      author: defaultAuthor,
    })
    return pgInsertSceneVersion(checkpoint)
  }

  const checkpoints = ensureHydrated(sceneId)
  const nextVersionNumber =
    checkpoints.length > 0
      ? Math.max(...checkpoints.map((c) => c.versionNumber)) + 1
      : 1

  const checkpoint = buildCheckpoint({
    sceneId,
    scene,
    versionNumber: nextVersionNumber,
    name: input.name.trim() || `Version ${nextVersionNumber}`,
    description: input.description?.trim(),
    isAutoSave: Boolean(input.isAutoSave),
    author: defaultAuthor,
  })

  checkpoints.unshift(checkpoint)
  persistCheckpoint(sceneId, checkpoint)
  return checkpoint
}

export async function restoreSceneVersion(
  sceneId: string,
  versionId: string,
  author?: SceneVersionAuthor,
): Promise<{ restored: CompositionScene; safetyBackup: SceneVersionCheckpoint }> {
  const checkpoint = await getSceneVersion(sceneId, versionId)
  if (!checkpoint) {
    throw new Error(`Version checkpoint "${versionId}" not found for scene "${sceneId}".`)
  }

  const currentScene = await getScene(sceneId)
  let safetyBackup: SceneVersionCheckpoint | null = null

  if (currentScene) {
    safetyBackup = await createSceneVersion(
      sceneId,
      {
        name: `Pre-restore Safety Snapshot (v${checkpoint.versionNumber})`,
        description: `Automatic safety backup created before restoring version "${checkpoint.name}".`,
        isAutoSave: true,
      },
      author,
      currentScene,
    )
  }

  const restoredScene: CompositionScene = {
    ...JSON.parse(JSON.stringify(checkpoint.snapshot)),
    id: sceneId,
    updatedAt: new Date().toISOString(),
  }

  await upsertScene(restoredScene)
  return {
    restored: restoredScene,
    safetyBackup: safetyBackup!,
  }
}

/** Test helper */
export function __resetVersionStoreForTests(): void {
  versionsMemoryMap.clear()
  __resetSceneVersionsSchemaForTests()
  try {
    const rootDir = getVersionsRoot()
    if (fs.existsSync(rootDir)) {
      fs.rmSync(rootDir, { recursive: true, force: true })
    }
  } catch {
    // Ignore cleanup errors
  }
}
