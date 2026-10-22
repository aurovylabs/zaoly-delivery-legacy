#!/usr/bin/env node
/**
 * Sync Google Font family catalog: Web SSOT → macOS Resources twin.
 *
 * Usage:
 *   node scripts/sync-google-font-families.mjs          # copy Web → macOS
 *   node scripts/sync-google-font-families.mjs --check   # exit 1 if out of sync
 *
 * Path constants mirror `apps/web/lib/paths.ts`
 * (`googleFontFamiliesJsonRelPath` / `macosGoogleFontFamiliesJsonRelPath`).
 * Knowledge: `knowledge/paths.md` · `knowledge/canvas-smart-hud-macos.md`
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const REPO_ROOT = resolve(__dirname, '..')

/** mirrors paths.googleFontFamiliesJsonRelPath */
export const WEB_GOOGLE_FONT_FAMILIES_REL =
  'apps/web/lib/fonts/google-font-families.json'

/** mirrors paths.macosGoogleFontFamiliesJsonRelPath */
export const MACOS_GOOGLE_FONT_FAMILIES_REL =
  'apps/macos/Resources/google-font-families.json'

export function webCatalogPath(repoRoot = REPO_ROOT) {
  return join(repoRoot, WEB_GOOGLE_FONT_FAMILIES_REL)
}

export function macosCatalogPath(repoRoot = REPO_ROOT) {
  return join(repoRoot, MACOS_GOOGLE_FONT_FAMILIES_REL)
}

/** False in the public web-first tree (apps/macos is not shipped). */
export function macosAppPresent(repoRoot = REPO_ROOT) {
  return existsSync(join(repoRoot, 'apps/macos'))
}

/**
 * @param {unknown} value
 * @returns {asserts value is string[]}
 */
export function assertValidGoogleFontCatalog(value) {
  if (!Array.isArray(value)) {
    throw new Error('Google font catalog must be a JSON array')
  }
  if (value.length === 0) {
    throw new Error('Google font catalog must be a non-empty array')
  }
  for (let i = 0; i < value.length; i += 1) {
    if (typeof value[i] !== 'string' || value[i].trim() === '') {
      throw new Error(
        `Google font catalog entry at index ${i} must be a non-empty string`,
      )
    }
  }
}

export function readWebCatalog(repoRoot = REPO_ROOT) {
  const path = webCatalogPath(repoRoot)
  if (!existsSync(path)) {
    throw new Error(`Web Google font catalog missing: ${path}`)
  }
  const raw = readFileSync(path, 'utf8')
  const parsed = JSON.parse(raw)
  assertValidGoogleFontCatalog(parsed)
  return { path, raw, families: parsed }
}

export function catalogsMatch(repoRoot = REPO_ROOT) {
  const web = readWebCatalog(repoRoot)
  if (!macosAppPresent(repoRoot)) {
    return {
      match: true,
      webPath: web.path,
      macosPath: null,
      reason: 'web_only_tree',
    }
  }
  const macosPath = macosCatalogPath(repoRoot)
  if (!existsSync(macosPath)) {
    return { match: false, webPath: web.path, macosPath, reason: 'missing_macos' }
  }
  const macosRaw = readFileSync(macosPath, 'utf8')
  if (macosRaw === web.raw) {
    return { match: true, webPath: web.path, macosPath }
  }
  return { match: false, webPath: web.path, macosPath, reason: 'content_diff' }
}

export function syncGoogleFontFamilies(repoRoot = REPO_ROOT) {
  const web = readWebCatalog(repoRoot)
  if (!macosAppPresent(repoRoot)) {
    return {
      webPath: web.path,
      macosPath: null,
      familyCount: web.families.length,
      skipped: 'no_macos',
    }
  }
  const target = macosCatalogPath(repoRoot)
  mkdirSync(dirname(target), { recursive: true })
  copyFileSync(web.path, target)
  return {
    webPath: web.path,
    macosPath: target,
    familyCount: web.families.length,
  }
}

function main(argv = process.argv.slice(2)) {
  const checkOnly = argv.includes('--check')
  if (checkOnly) {
    const result = catalogsMatch()
    if (!result.match) {
      console.error(
        `Google font catalogs out of sync (${result.reason ?? 'diff'}):\n  web:   ${result.webPath}\n  macos: ${result.macosPath}\nRun: npm run sync:google-fonts`,
      )
      process.exit(1)
    }
    if (result.reason === 'web_only_tree') {
      console.log(
        `OK: Web Google font catalog present (${WEB_GOOGLE_FONT_FAMILIES_REL}; no apps/macos in this tree)`,
      )
      return
    }
    console.log(`OK: Google font catalogs match (${WEB_GOOGLE_FONT_FAMILIES_REL})`)
    return
  }

  const result = syncGoogleFontFamilies()
  if (result.skipped === 'no_macos') {
    console.log(
      `Skipped macOS sync (${result.familyCount} web families; no apps/macos in this tree)`,
    )
    return
  }
  console.log(
    `Synced ${result.familyCount} families → ${MACOS_GOOGLE_FONT_FAMILIES_REL}`,
  )
}

const isDirectRun =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isDirectRun) {
  try {
    main()
  } catch (err) {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  }
}
