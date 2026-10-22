/**
 * Save named Site Kit compositions (React + CSF + override).
 * Spec: `specs/domain/site-kit-compositions.md` · `specs/api/site-kit-write.md`
 */
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  generateCompositionModule as generateCompositionModuleCore,
  generateCompositionStory as generateCompositionStoryCore,
  compositionCatalogKey,
  compositionExportNamesFromFilenames,
  compositionScopeKey,
  compositionStoryTitle,
  generateCompositionCollectionBarrel,
} from '@zaoly/site-kit/composition-codegen'
import { validateKitComponentSetPayload } from '@zaoly/site-kit/master-variants'
import {
  compositionComponentId,
  validateCompositionName,
  validateCompositionTree,
  validateNamedCompositionVariants,
  type CompositionNamedVariant,
} from './composition-write-validation'
import { SITE_KIT_CATALOG } from './site-kit-catalog'
import {
  listCompositionOverridesFromStore,
  readSiteKitOverride,
  writeSiteKitOverride,
} from './override-store'
import {
  requestSiteKitStorybookRebuild,
  type StorybookRedeployResult,
} from './storybook-redeploy'
import { resolveSiteKitRoot } from './write'
import type { SiteKitCompositionNode } from './sync-tree'
import { asSiteKitCompositionNode } from '../library/site-kit-preview-node'

const NAME_RE = /^[A-Z][A-Za-z0-9]*$/

export type { CompositionNamedVariant } from './composition-write-validation'
export {
  compositionCatalogKey,
  compositionComponentId,
  compositionMasterSourceKey,
  compositionScopeKey,
  compositionVariantStoryName,
  normalizeCompositionName,
  storyExportName,
  validateCompositionName,
  validateCompositionTree,
  validateNamedCompositionVariants,
} from './composition-write-validation'

export type CompositionCatalogEntry = {
  name: string
  exportName: string
  storyTitle: string
  componentId: string
  /** Collection bind; null = legacy unscoped Pattern. */
  platformProjectId: string | null
  updatedAt: string | null
  /** Override composition tree for Library / Storybook live preview. */
  previewRoot?: SiteKitCompositionNode | null
}

export type ListSiteKitCompositionsFilter = {
  /** Exact Collection match (editor / library picker). */
  platformProjectId?: string
  /** Only legacy unscoped Patterns (unbound editor). */
  unscoped?: boolean
  /** Home: union of viewer Collection ids. */
  platformProjectIds?: string[]
}

export type SaveCompositionResult =
  | {
      ok: true
      exportName: string
      wrote: string[]
      storyTitle: string
      componentId: string
      platformProjectId: string
      variantCount?: number
      writesGit: false
      diskWritten: boolean
      warning?: string
      storybookRedeploy: StorybookRedeployResult
    }
  | { ok: false; code: string; error: string }

export function generateCompositionModule(
  exportName: string,
  root: SiteKitCompositionNode,
  options?: { componentsImportPath?: string },
): string {
  return generateCompositionModuleCore(exportName, root, SITE_KIT_CATALOG, {
    componentsImportPath: options?.componentsImportPath,
  })
}

export function generateCompositionStory(
  exportName: string,
  variants?: CompositionNamedVariant[],
  options?: {
    platformProjectId?: string | null
    componentId?: string
    previewImportPath?: string
    axes?: { id: string; name: string; values: string[] }[]
  },
): string {
  return generateCompositionStoryCore(exportName, SITE_KIT_CATALOG, variants, {
    platformProjectId: options?.platformProjectId,
    componentId: options?.componentId,
    previewImportPath: options?.previewImportPath,
    axes: options?.axes,
  })
}

export function filterCompositionCatalog(
  entries: CompositionCatalogEntry[],
  filter?: ListSiteKitCompositionsFilter,
): CompositionCatalogEntry[] {
  if (!filter) return entries
  if (filter.unscoped) {
    return entries.filter((e) => e.platformProjectId == null)
  }
  if (filter.platformProjectId) {
    const id = filter.platformProjectId.trim()
    return entries.filter((e) => e.platformProjectId === id)
  }
  if (filter.platformProjectIds) {
    if (filter.platformProjectIds.length === 0) return []
    const allowed = new Set(
      filter.platformProjectIds.map((id) => id.trim()).filter(Boolean),
    )
    return entries.filter(
      (e) => e.platformProjectId != null && allowed.has(e.platformProjectId),
    )
  }
  return entries
}

async function upsertCompositionsBarrel(
  compositionsDir: string,
  exportName: string,
): Promise<void> {
  const barrelPath = path.join(compositionsDir, 'index.ts')
  let source = ''
  try {
    source = await readFile(barrelPath, 'utf8')
  } catch {
    source = '/** Site Kit user compositions — generated exports. */\n'
  }
  const line = `export { ${exportName} } from './${exportName}'`
  if (!source.includes(line)) {
    source = `${source.trimEnd()}\n${line}\n`
    await writeFile(barrelPath, source, 'utf8')
  }
}

export async function saveSiteKitComposition(
  input: {
    name: string
    root: SiteKitCompositionNode
    platformProjectId?: string | null
    variants?: CompositionNamedVariant[]
    defaultVariantId?: string
    axes?: { id: string; name: string; values: string[] }[]
  },
  options?: { kitRoot?: string; cwd?: string },
): Promise<SaveCompositionResult> {
  const nameCheck = validateCompositionName(input.name)
  if (!nameCheck.ok) return nameCheck
  const { exportName } = nameCheck
  const treeCheck = validateCompositionTree(input.root)
  if (!treeCheck.ok) return treeCheck

  const platformProjectId = input.platformProjectId?.trim() || ''
  if (!platformProjectId) {
    return {
      ok: false,
      code: 'missing-platform-project-id',
      error: 'Bind a Collection before saving a Pattern',
    }
  }

  let namedVariants =
    input.variants && input.variants.length >= 2 ? input.variants : undefined
  let axes = namedVariants && input.axes?.length ? input.axes : undefined
  if (namedVariants) {
    const variantNames = validateNamedCompositionVariants(namedVariants, exportName)
    if (!variantNames.ok) return variantNames
    for (const v of namedVariants) {
      const check = validateCompositionTree(v.composition)
      if (!check.ok) {
        return {
          ok: false,
          code: 'invalid-tree',
          error: `Variant "${v.name}": ${check.error}`,
        }
      }
    }
    const setCheck = validateKitComponentSetPayload(namedVariants, axes)
    if (!setCheck.ok) {
      return { ok: false, code: setCheck.code, error: setCheck.error }
    }
    namedVariants = setCheck.variants.map((v) => ({
      id: v.id,
      name: v.name,
      composition: v.composition as unknown as SiteKitCompositionNode,
      ...(v.combination ? { combination: v.combination } : {}),
    }))
    axes = setCheck.axes
  }

  const componentId = compositionComponentId(exportName, platformProjectId)
  const storyTitle = compositionStoryTitle(exportName, platformProjectId)
  const kitRoot = options?.kitRoot ?? resolveSiteKitRoot(options?.cwd)
  const cwd = options?.cwd ?? process.cwd()
  const wrote: string[] = []
  let diskWritten = false

  const defaultVariantId =
    namedVariants &&
    (namedVariants.find((v) => v.id === input.defaultVariantId)?.id ??
      namedVariants[0]?.id)
  const primaryRoot =
    namedVariants && defaultVariantId
      ? (namedVariants.find((v) => v.id === defaultVariantId)?.composition ??
        input.root)
      : input.root

  // SK-S2: Collection-scoped disk path — avoids flat Hero.tsx clash across Collections.
  const scopeKey = compositionScopeKey(platformProjectId)
  const compositionsRel = `src/compositions/c/${scopeKey}`
  const moduleRel = `${compositionsRel}/${exportName}.tsx`
  const storyRel = `${compositionsRel}/${exportName}.stories.tsx`
  const barrelRel = `${compositionsRel}/index.ts`
  const moduleAbs = path.resolve(kitRoot, moduleRel)
  const storyAbs = path.resolve(kitRoot, storyRel)
  const barrelAbs = path.resolve(kitRoot, barrelRel)
  for (const abs of [moduleAbs, storyAbs, barrelAbs]) {
    const rel = path.relative(kitRoot, abs)
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      return { ok: false, code: 'path-escape', error: 'Composition path escapes kit root' }
    }
  }

  try {
    const compositionsDir = path.resolve(kitRoot, compositionsRel)
    await mkdir(compositionsDir, { recursive: true })
    const componentsBarrel = path.join(kitRoot, 'src/components/index.ts')
    try {
      await readFile(componentsBarrel, 'utf8')
    } catch {
      await mkdir(path.dirname(componentsBarrel), { recursive: true })
      const lines = SITE_KIT_CATALOG.map(
        (e) => `export { ${e.exportName} } from './${e.exportName}'`,
      )
      await writeFile(
        componentsBarrel,
        `/** Barrel for composition codegen. */\n${lines.join('\n')}\n`,
        'utf8',
      )
      wrote.push('src/components/index.ts')
    }

    await writeFile(
      moduleAbs,
      generateCompositionModule(exportName, primaryRoot, {
        componentsImportPath: '../../../components',
      }),
      'utf8',
    )
    wrote.push(moduleRel)
    await writeFile(
      storyAbs,
      generateCompositionStory(exportName, namedVariants, {
        platformProjectId,
        componentId,
        previewImportPath: '../../../components/CompositionPreview',
        axes,
      }),
      'utf8',
    )
    wrote.push(storyRel)

    // SK-S5: Collection package barrel `@zaoly/site-kit/c/{scopeKey}`
    let exportNames: string[] = [exportName]
    try {
      const files = await readdir(compositionsDir)
      exportNames = compositionExportNamesFromFilenames(files)
      if (!exportNames.includes(exportName)) exportNames.push(exportName)
    } catch {
      // first module in scope
    }
    await writeFile(
      barrelAbs,
      generateCompositionCollectionBarrel(exportNames),
      'utf8',
    )
    wrote.push(barrelRel)
    diskWritten = true
  } catch {
    // Coolify image may be read-only — override still succeeds
  }

  const override = await writeSiteKitOverride(
    {
      componentId,
      exportName,
      storyTitle,
      platformProjectId,
      args: {},
      composition: primaryRoot as unknown as Record<string, unknown>,
      ...(namedVariants
        ? {
            variants: namedVariants.map((v) => ({
              id: v.id,
              name: v.name,
              composition: v.composition as unknown as Record<string, unknown>,
              ...(v.combination ? { combination: { ...v.combination } } : {}),
            })),
            defaultVariantId,
          }
        : {}),
      ...(namedVariants && axes?.length
        ? {
            axes: axes.map((a) => ({
              id: a.id,
              name: a.name,
              values: [...a.values],
            })),
          }
        : {}),
      updatedAt: new Date().toISOString(),
    },
    { cwd },
  )
  if (!override.ok) return override
  wrote.push(...override.wrote)

  const storybookRedeploy = await requestSiteKitStorybookRebuild(
    `composition:${componentId}`,
  )

  return {
    ok: true,
    exportName,
    wrote,
    storyTitle,
    componentId,
    platformProjectId,
    ...(namedVariants ? { variantCount: namedVariants.length } : {}),
    writesGit: false,
    diskWritten,
    ...(!diskWritten
      ? {
          warning:
            'Override saved; disk files skipped (read-only environment). Storybook rebuild will hydrate from override.',
        }
      : {}),
    storybookRedeploy,
  }
}

export async function listSiteKitCompositions(options?: {
  kitRoot?: string
  cwd?: string
} & ListSiteKitCompositionsFilter): Promise<CompositionCatalogEntry[]> {
  const kitRoot = options?.kitRoot ?? resolveSiteKitRoot(options?.cwd)
  const cwd = options?.cwd ?? process.cwd()
  const byKey = new Map<string, CompositionCatalogEntry>()

  // Legacy flat disk modules (unscoped) — SK-S2 scoped files live under compositions/c/{scopeKey}/.
  try {
    const dir = path.join(kitRoot, 'src/compositions')
    const files = await readdir(dir)
    for (const file of files) {
      if (!file.endsWith('.tsx') || file.endsWith('.stories.tsx') || file === 'index.ts') {
        continue
      }
      const exportName = file.replace(/\.tsx$/, '')
      if (!NAME_RE.test(exportName)) continue
      const entry: CompositionCatalogEntry = {
        name: exportName,
        exportName,
        storyTitle: compositionStoryTitle(exportName, null),
        componentId: compositionComponentId(exportName),
        platformProjectId: null,
        updatedAt: null,
      }
      byKey.set(compositionCatalogKey(null, exportName), entry)
    }
  } catch {
    // no compositions dir yet
  }

  for (const entry of await listCompositionOverridesFromStore({ cwd })) {
    if (!NAME_RE.test(entry.exportName)) continue
    const key = compositionCatalogKey(entry.platformProjectId, entry.exportName)
    const prev = byKey.get(key)
    byKey.set(key, prev ? { ...prev, ...entry, previewRoot: prev.previewRoot } : entry)
  }

  const sorted = [...byKey.values()].sort((a, b) => {
    const byName = a.exportName.localeCompare(b.exportName)
    if (byName !== 0) return byName
    return (a.platformProjectId ?? '').localeCompare(b.platformProjectId ?? '')
  })

  await Promise.all(
    sorted.map(async (entry) => {
      const override = await readSiteKitOverride(entry.componentId, { cwd })
      entry.previewRoot = asSiteKitCompositionNode(override?.composition)
      if (override?.platformProjectId !== undefined) {
        entry.platformProjectId = override.platformProjectId ?? null
        entry.storyTitle =
          override.storyTitle ||
          compositionStoryTitle(entry.exportName, entry.platformProjectId)
      }
      if (override?.componentId) {
        entry.componentId = override.componentId
      }
    }),
  )

  return filterCompositionCatalog(sorted, {
    platformProjectId: options?.platformProjectId,
    unscoped: options?.unscoped,
    platformProjectIds: options?.platformProjectIds,
  })
}
