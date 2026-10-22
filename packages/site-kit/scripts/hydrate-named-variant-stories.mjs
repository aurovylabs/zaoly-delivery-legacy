#!/usr/bin/env node
/**
 * Before `storybook build`: fetch CREATION overrides and regenerate atom CSF
 * substories for Master named variants / Component Sets (Coolify static image).
 * Spec: site-kit.md · knowledge/master-component-sets-phase3.md
 */
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  generateAtomNamedVariantCsf,
  sanitizeKitOverrideComponentSet,
} from '../src/master-variants/index.ts'
import { SITE_KIT_CATALOG } from '../src/catalog.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const kitRoot = path.resolve(__dirname, '..')
const CATALOG = SITE_KIT_CATALOG

const ORIGIN = (
  process.env.STORYBOOK_ZAOLY_ORIGIN ||
  'https://creation-v3.projects-a.plygrnd.tech'
).replace(/\/$/, '')

async function fetchOverride(componentId) {
  const url = `${ORIGIN}/api/site-kit/overrides/${encodeURIComponent(componentId)}`
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    return await res.json()
  } catch (err) {
    console.warn(`[hydrate] fetch failed ${componentId}:`, err?.message || err)
    return null
  }
}

async function main() {
  console.log(`[hydrate] CREATION origin ${ORIGIN}`)
  let hydrated = 0
  for (const entry of CATALOG) {
    const override = await fetchOverride(entry.id)
    const cleaned = sanitizeKitOverrideComponentSet({
      variants: Array.isArray(override?.variants) ? override.variants : undefined,
      axes: Array.isArray(override?.axes) ? override.axes : undefined,
      defaultVariantId:
        typeof override?.defaultVariantId === 'string'
          ? override.defaultVariantId
          : undefined,
    })
    const variants = (cleaned.variants ?? []).filter((v) => v?.name && v?.composition?.type)
    if (variants.length < 2) continue

    const ordered =
      cleaned.defaultVariantId &&
      variants.some((v) => v.id === cleaned.defaultVariantId)
        ? [
            variants.find((v) => v.id === cleaned.defaultVariantId),
            ...variants.filter((v) => v.id !== cleaned.defaultVariantId),
          ]
        : variants

    const args =
      override.args && typeof override.args === 'object' ? { ...override.args } : {}
    delete args.masterVariant
    delete args.variantName
    delete args.variant

    const axes = cleaned.axes

    const source = generateAtomNamedVariantCsf({
      exportName: entry.exportName,
      title: entry.title,
      args,
      variants: ordered,
      axes,
      defaultVariantId: cleaned.defaultVariantId,
      headerComment: axes
        ? '/** Hydrated from CREATION — Master Component Set (axis controls). */'
        : '/** Hydrated from CREATION — Master named variants as CSF substories + Controls.variant. */',
    })
    const abs = path.join(kitRoot, entry.storyFile)
    await writeFile(abs, source, 'utf8')
    hydrated += 1
    console.log(
      `[hydrate] ${entry.id} → ${ordered.map((v) => v.name).join(', ')}${axes ? ` · ${axes.length} axis` : ''}`,
    )
  }
  console.log(`[hydrate] done — ${hydrated} atom CSF file(s) with named-variant / component-set substories`)
}

main().catch((err) => {
  console.error('[hydrate] fatal', err)
  process.exit(1)
})
