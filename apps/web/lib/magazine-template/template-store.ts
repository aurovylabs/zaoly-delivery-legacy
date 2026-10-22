import fs from 'node:fs'
import path from 'node:path'
import type {
  CompositionScene,
  MagazineTemplate,
  MagazineTemplateSummary,
  MagazineTemplateValidationIssue,
} from '@zaoly/contracts'
import {
  MAGAZINE_TEMPLATE_COMPAT_VERSION,
} from '@zaoly/contracts'
import { paths } from '../paths'
import { extractSlotSchema } from './extract-slot-schema'
import { validateMagazineTemplateScene } from './validate-template'
import { resolveZaolyUiSource } from '../runtime-config'

const templates = new Map<string, MagazineTemplate[]>()
let hydrated = false
let durableEnabled = true

function resolveStorePath(): string {
  const env = process.env[paths.envMagazineTemplateStorePath]?.trim()
  if (env) return path.isAbsolute(env) ? env : path.join(process.cwd(), env)
  return path.join(process.cwd(), paths.magazineTemplateStoreRelPath)
}

function loadFromDisk(): MagazineTemplate[] {
  if (!durableEnabled) return []
  try {
    const file = resolveStorePath()
    if (!fs.existsSync(file)) return []
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as {
      templates?: MagazineTemplate[]
    }
    if (!Array.isArray(parsed.templates)) return []
    return parsed.templates.filter(
      (t) => t && typeof t.templateId === 'string' && t.sceneSnapshot?.root,
    )
  } catch {
    return []
  }
}

function persistToDisk(): void {
  if (!durableEnabled) return
  try {
    const file = resolveStorePath()
    fs.mkdirSync(path.dirname(file), { recursive: true })
    const all: MagazineTemplate[] = []
    for (const versions of templates.values()) {
      for (const t of versions) all.push(structuredClone(t))
    }
    fs.writeFileSync(
      file,
      `${JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), templates: all }, null, 2)}\n`,
      'utf8',
    )
  } catch {
    // memory remains SoT
  }
}

function seed(): void {
  if (hydrated) return
  hydrated = true
  for (const t of loadFromDisk()) {
    const list = templates.get(t.templateId) ?? []
    list.push(t)
    templates.set(t.templateId, list)
  }
  for (const [id, list] of templates) {
    list.sort((a, b) => a.version - b.version)
    templates.set(id, list)
  }
}

function newId(): string {
  return `mtpl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function toSummary(t: MagazineTemplate): MagazineTemplateSummary {
  return {
    templateId: t.templateId,
    version: t.version,
    status: t.status,
    role: t.role,
    platformProjectId: t.platformProjectId,
    name: t.name,
    sourceSceneId: t.sourceSceneId,
    slotKeys: t.slotSchema.map((s) => s.dataSlot),
    compatVersion: t.compatVersion,
    publishedAt: t.publishedAt,
    zaolyUiSource: t.zaolyUiSource,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }
}

function cloneScene(scene: CompositionScene): CompositionScene {
  return structuredClone(scene)
}

export function listMagazineTemplates(opts: {
  platformProjectId?: string | null
  role?: string | null
  status?: 'published' | 'draft' | 'all'
}): MagazineTemplateSummary[] {
  seed()
  const status = opts.status ?? 'published'
  const out: MagazineTemplateSummary[] = []
  for (const versions of templates.values()) {
    for (const t of versions) {
      if (status !== 'all' && t.status !== status) continue
      if (
        opts.platformProjectId != null &&
        opts.platformProjectId !== '' &&
        t.platformProjectId !== opts.platformProjectId
      ) {
        continue
      }
      if (opts.role != null && opts.role !== '' && t.role !== opts.role) continue
      out.push(toSummary(t))
    }
  }
  return out.sort((a, b) => {
    if (a.platformProjectId !== b.platformProjectId) {
      return a.platformProjectId.localeCompare(b.platformProjectId)
    }
    if (a.role !== b.role) return String(a.role).localeCompare(String(b.role))
    if (a.templateId !== b.templateId) return a.templateId.localeCompare(b.templateId)
    return b.version - a.version
  })
}

export function getMagazineTemplateLatest(templateId: string): MagazineTemplate | null {
  seed()
  const list = templates.get(templateId)
  if (!list?.length) return null
  return structuredClone(list[list.length - 1]!)
}

export function getMagazineTemplateVersion(
  templateId: string,
  version: number,
): MagazineTemplate | null {
  seed()
  const list = templates.get(templateId)
  if (!list) return null
  const hit = list.find((t) => t.version === version && t.status === 'published')
  return hit ? structuredClone(hit) : null
}

/** Highest published version for collection + role (consumer discovery). */
export function findPublishedMagazineTemplate(opts: {
  platformProjectId: string
  role: string
}): MagazineTemplate | null {
  seed()
  let best: MagazineTemplate | null = null
  for (const versions of templates.values()) {
    for (const t of versions) {
      if (t.status !== 'published') continue
      if (t.platformProjectId !== opts.platformProjectId) continue
      if (t.role !== opts.role) continue
      if (!best || t.version > best.version || (t.version === best.version && t.updatedAt > best.updatedAt)) {
        best = t
      }
    }
  }
  return best ? structuredClone(best) : null
}

export function createMagazineTemplateDraft(input: {
  scene: CompositionScene
  role: string
  name?: string
  platformProjectId?: string | null
}): MagazineTemplate {
  seed()
  const now = new Date().toISOString()
  const platformProjectId =
    (input.platformProjectId ?? input.scene.platformProjectId ?? '').trim() || ''
  const snapshot = cloneScene({
    ...input.scene,
    platformProjectId: platformProjectId || input.scene.platformProjectId,
  })
  const draft: MagazineTemplate = {
    templateId: newId(),
    version: 0,
    status: 'draft',
    role: input.role.trim() || paths.magazineTemplateRoleQuickCheck,
    platformProjectId,
    name: input.name?.trim() || input.scene.name || 'Magazine template',
    sceneSnapshot: snapshot,
    sourceSceneId: input.scene.id,
    zaolyUiSource: resolveZaolyUiSource(),
    slotSchema: extractSlotSchema(snapshot),
    compatVersion: MAGAZINE_TEMPLATE_COMPAT_VERSION,
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
  }
  templates.set(draft.templateId, [draft])
  persistToDisk()
  return structuredClone(draft)
}

export function publishMagazineTemplate(
  templateId: string,
  options?: { scene?: CompositionScene },
):
  | { ok: true; template: MagazineTemplate }
  | { ok: false; error: string; issues?: MagazineTemplateValidationIssue[] } {
  seed()
  const list = templates.get(templateId)
  if (!list?.length) return { ok: false, error: 'Not found' }

  const latest = list[list.length - 1]!
  const baseScene = options?.scene
    ? cloneScene(options.scene)
    : cloneScene(latest.sceneSnapshot)

  const platformProjectId =
    (baseScene.platformProjectId ?? latest.platformProjectId ?? '').trim()
  const sceneForPublish: CompositionScene = {
    ...baseScene,
    platformProjectId: platformProjectId || baseScene.platformProjectId,
  }

  const validation = validateMagazineTemplateScene(sceneForPublish, {
    requirePlatformProjectId: true,
  })
  if (!validation.ok) {
    return { ok: false, error: validation.issues[0]?.message ?? 'Validation failed', issues: validation.issues }
  }

  const nextVersion =
    Math.max(0, ...list.filter((t) => t.status === 'published').map((t) => t.version)) + 1
  const now = new Date().toISOString()
  const published: MagazineTemplate = {
    templateId,
    version: nextVersion,
    status: 'published',
    role: latest.role,
    platformProjectId,
    name: latest.name,
    sceneSnapshot: cloneScene(sceneForPublish),
    sourceSceneId: latest.sourceSceneId ?? sceneForPublish.id,
    zaolyUiSource: resolveZaolyUiSource(),
    slotSchema: extractSlotSchema(sceneForPublish),
    compatVersion: paths.magazineTemplateCompatVersion,
    publishedAt: now,
    createdAt: latest.createdAt,
    updatedAt: now,
  }

  // Immutability: prior published entries stay; replace draft (v0) if present
  const nextList = list.filter((t) => !(t.status === 'draft' && t.version === 0))
  nextList.push(published)
  nextList.sort((a, b) => a.version - b.version)
  templates.set(templateId, nextList)
  persistToDisk()
  return { ok: true, template: structuredClone(published) }
}

/** Freeze check: published snapshot must not change when re-read. */
export function assertPublishedImmutable(
  templateId: string,
  version: number,
): { ok: true; snapshot: CompositionScene } | { ok: false; error: string } {
  const a = getMagazineTemplateVersion(templateId, version)
  if (!a) return { ok: false, error: 'Not found' }
  const b = getMagazineTemplateVersion(templateId, version)
  if (!b) return { ok: false, error: 'Not found' }
  if (JSON.stringify(a.sceneSnapshot) !== JSON.stringify(b.sceneSnapshot)) {
    return { ok: false, error: 'Snapshot mutated between reads' }
  }
  return { ok: true, snapshot: a.sceneSnapshot }
}

export function __resetMagazineTemplateStoreForTests(options?: {
  durable?: boolean
  wipeDisk?: boolean
}): void {
  templates.clear()
  hydrated = false
  durableEnabled = options?.durable !== false
  if (!options?.wipeDisk) return
  try {
    const file = resolveStorePath()
    if (fs.existsSync(file)) fs.unlinkSync(file)
  } catch {
    // ignore
  }
}

export function getMagazineTemplateStorePath(): string {
  return resolveStorePath()
}
