#!/usr/bin/env node
/**
 * Before `storybook build`: fetch CREATION composition overrides and regenerate
 * React modules + CSF stories under src/compositions/ (Coolify static image).
 * Spec: site-kit-compositions.md · knowledge/site-kit-storybook-coolify.md
 */
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildTypeToExport,
  compositionComponentId,
  compositionExportNamesFromFilenames,
  compositionScopeKey,
  generateCompositionCollectionBarrel,
  generateCompositionModule,
  generateCompositionStory,
  compositionStoryTitle,
} from '../src/composition-codegen/index.ts'
import { sanitizeKitOverrideComponentSet } from '../src/master-variants/index.ts'
import { SITE_KIT_CATALOG } from '../src/catalog.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const kitRoot = path.resolve(__dirname, '..')
const TYPE_TO_EXPORT = buildTypeToExport(SITE_KIT_CATALOG)

const ORIGIN = (
  process.env.STORYBOOK_ZAOLY_ORIGIN ||
  'https://creation-v3.projects-a.plygrnd.tech'
).replace(/\/$/, '')

/** Optional provisioning secret for SK-S1 hydrate (no public catalog dump). */
function hydrateHeaders() {
  const secret =
    process.env.ZAOLY_SITE_KIT_HYDRATE_SECRET?.trim() ||
    process.env.ZAOLY_SERVICE_SECRET?.trim() ||
    ''
  const contract =
    process.env.ZAOLY_FEDERATION_CONTRACT_VERSION?.trim() || '2026-05-zaoly-federation-v3'
  if (!secret) return {}
  return {
    'X-Service-Secret': secret,
    'X-Federation-Contract-Version': contract,
  }
}

const BAKED = new Set(['Live', 'Catalog'])

async function fetchJson(url) {
  try {
    const res = await fetch(url, { cache: 'no-store', headers: hydrateHeaders() })
    if (!res.ok) {
      console.warn(`[hydrate-compositions] ${res.status} ${url}`)
      return null
    }
    return await res.json()
  } catch (err) {
    console.warn(`[hydrate-compositions] fetch failed ${url}:`, err?.message || err)
    return null
  }
}

async function ensureComponentsBarrel() {
  const barrelPath = path.join(kitRoot, 'src/components/index.ts')
  try {
    await readFile(barrelPath, 'utf8')
    return
  } catch {
    // create thin re-export barrel for composition imports
  }
  const lines = Object.entries(TYPE_TO_EXPORT).map(
    ([, exportName]) => `export { ${exportName} } from './${exportName}'`,
  )
  await writeFile(
    barrelPath,
    `/** Barrel for composition codegen. */\n${lines.join('\n')}\n`,
    'utf8',
  )
}

async function main() {
  console.log(`[hydrate-compositions] CREATION origin ${ORIGIN}`)
  const scope = process.env.STORYBOOK_PLATFORM_PROJECT_ID?.trim()
  // SK-S3: never bake a world-readable Pattern CSF dump into the shared Storybook image.
  if (!scope) {
    console.warn(
      '[hydrate-compositions] SK-S3: skipping Pattern CSF bake (no STORYBOOK_PLATFORM_PROJECT_ID). Use Live/Catalog + zaolyViewToken, or set STORYBOOK_PLATFORM_PROJECT_ID for a single-Collection image.',
    )
    console.log('[hydrate-compositions] done — 0 composition(s)')
    return
  }
  const catalogUrl = `${ORIGIN}/api/site-kit/compositions?platformProjectId=${encodeURIComponent(scope)}`
  if (
    !process.env.ZAOLY_SITE_KIT_HYDRATE_SECRET?.trim() &&
    !process.env.ZAOLY_SERVICE_SECRET?.trim()
  ) {
    console.warn(
      '[hydrate-compositions] no ZAOLY_SITE_KIT_HYDRATE_SECRET / ZAOLY_SERVICE_SECRET — Pattern CSF bake skipped unless authorized (SK-S1)',
    )
  }
  const catalog = await fetchJson(catalogUrl)
  const entries = Array.isArray(catalog?.compositions) ? catalog.compositions : []
  if (!entries.length) {
    console.log('[hydrate-compositions] done — 0 composition(s)')
    return
  }

  await mkdir(path.join(kitRoot, 'src/compositions'), { recursive: true })
  await ensureComponentsBarrel()

  let hydrated = 0
  const byScope = new Map()

  for (const entry of entries) {
    const exportName = entry?.exportName?.trim()
    if (!exportName || BAKED.has(exportName)) continue
    if (!/^[A-Z][A-Za-z0-9]*$/.test(exportName)) continue

    const platformProjectId =
      typeof entry?.platformProjectId === 'string' && entry.platformProjectId.trim()
        ? entry.platformProjectId.trim()
        : null
    const componentId =
      entry.componentId || compositionComponentId(exportName, platformProjectId)
    const override = await fetchJson(
      `${ORIGIN}/api/site-kit/overrides/${encodeURIComponent(componentId)}`,
    )
    const composition = override?.composition
    if (!composition || typeof composition !== 'object' || !composition.type) {
      console.warn(`[hydrate-compositions] skip ${exportName}: no composition tree`)
      continue
    }

    const cleaned = sanitizeKitOverrideComponentSet({
      variants: Array.isArray(override?.variants) ? override.variants : undefined,
      axes: Array.isArray(override?.axes) ? override.axes : undefined,
      defaultVariantId:
        typeof override?.defaultVariantId === 'string'
          ? override.defaultVariantId
          : undefined,
    })
    const variants = (cleaned.variants ?? []).filter((v) => v?.name && v?.composition?.type)
    const namedVariants = variants.length >= 2 ? variants : undefined
    const ownerPid =
      typeof override?.platformProjectId === 'string' && override.platformProjectId.trim()
        ? override.platformProjectId.trim()
        : platformProjectId
    const storyTitle =
      (typeof override?.storyTitle === 'string' && override.storyTitle.trim()) ||
      (typeof entry?.storyTitle === 'string' && entry.storyTitle.trim()) ||
      compositionStoryTitle(exportName, ownerPid)

    // SK-S2: scoped disk path when Collection-bound — Storybook globs **/*.stories.tsx
    const relDir = ownerPid
      ? `src/compositions/c/${compositionScopeKey(ownerPid)}`
      : 'src/compositions'
    const moduleRel = `${relDir}/${exportName}.tsx`
    const storyRel = `${relDir}/${exportName}.stories.tsx`
    await mkdir(path.join(kitRoot, relDir), { recursive: true })
    const componentsImport = ownerPid ? '../../../components' : '../components'
    const previewImport = ownerPid
      ? '../../../components/CompositionPreview'
      : '../components/CompositionPreview'
    await writeFile(
      path.join(kitRoot, moduleRel),
      generateCompositionModule(exportName, composition, SITE_KIT_CATALOG, {
        headerComment: '/** Hydrated from CREATION — reviewable React handoff. */',
        componentsImportPath: componentsImport,
      }),
      'utf8',
    )
    await writeFile(
      path.join(kitRoot, storyRel),
      generateCompositionStory(exportName, SITE_KIT_CATALOG, namedVariants, {
        hydrated: true,
        platformProjectId: ownerPid,
        storyTitle,
        componentId,
        previewImportPath: previewImport,
        axes: cleaned.axes,
      }),
      'utf8',
    )
    if (ownerPid) {
      const sk = compositionScopeKey(ownerPid)
      const list = byScope.get(sk) || []
      list.push(exportName)
      byScope.set(sk, list)
    }
    hydrated += 1
    console.log(`[hydrate-compositions] ${componentId} → ${moduleRel}`)
  }

  // SK-S5: Collection barrels for package exports `@zaoly/site-kit/c/{scopeKey}`
  for (const [scopeKey, names] of byScope) {
    const dir = path.join(kitRoot, 'src/compositions/c', scopeKey)
    let exportNames = names
    try {
      const files = await readdir(dir)
      exportNames = compositionExportNamesFromFilenames(files)
      for (const n of names) {
        if (!exportNames.includes(n)) exportNames.push(n)
      }
    } catch {
      // use hydrated names only
    }
    await writeFile(
      path.join(dir, 'index.ts'),
      generateCompositionCollectionBarrel(exportNames),
      'utf8',
    )
    console.log(
      `[hydrate-compositions] barrel c/${scopeKey} (${exportNames.length} export(s))`,
    )
  }

  console.log(`[hydrate-compositions] done — ${hydrated} composition CSF file(s)`)
}

main().catch((err) => {
  console.error('[hydrate-compositions] fatal', err)
  process.exit(1)
})
