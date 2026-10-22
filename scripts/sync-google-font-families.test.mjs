#!/usr/bin/env node
/**
 * Node tests for Google font catalog sync (Web → macOS Resources).
 * Run: node --test scripts/sync-google-font-families.test.mjs
 */

import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import {
  MACOS_GOOGLE_FONT_FAMILIES_REL,
  WEB_GOOGLE_FONT_FAMILIES_REL,
  assertValidGoogleFontCatalog,
  catalogsMatch,
  macosAppPresent,
  macosCatalogPath,
  syncGoogleFontFamilies,
  webCatalogPath,
} from './sync-google-font-families.mjs'

test('path constants mirror paths.ts relative locations', () => {
  assert.equal(
    WEB_GOOGLE_FONT_FAMILIES_REL,
    'apps/web/lib/fonts/google-font-families.json',
  )
  assert.equal(
    MACOS_GOOGLE_FONT_FAMILIES_REL,
    'apps/macos/Resources/google-font-families.json',
  )
  assert.ok(webCatalogPath().endsWith(WEB_GOOGLE_FONT_FAMILIES_REL))
  assert.ok(macosCatalogPath().endsWith(MACOS_GOOGLE_FONT_FAMILIES_REL))
})

test('assertValidGoogleFontCatalog accepts non-empty string arrays', () => {
  assertValidGoogleFontCatalog(['Inter', 'Roboto'])
  assert.throws(() => assertValidGoogleFontCatalog([]), /non-empty/)
  assert.throws(() => assertValidGoogleFontCatalog('Inter'), /array/)
  assert.throws(() => assertValidGoogleFontCatalog(['']), /non-empty string/)
  assert.throws(() => assertValidGoogleFontCatalog([1]), /non-empty string/)
})

test('syncGoogleFontFamilies copies Web catalog byte-identically', () => {
  const root = mkdtempSync(join(tmpdir(), 'gf-sync-'))
  try {
    const webDir = join(root, 'apps/web/lib/fonts')
    mkdirSync(webDir, { recursive: true })
    mkdirSync(join(root, 'apps/macos'), { recursive: true })
    const payload = '[\n  "Inter",\n  "Roboto"\n]\n'
    writeFileSync(join(webDir, 'google-font-families.json'), payload, 'utf8')

    const before = catalogsMatch(root)
    assert.equal(before.match, false)
    assert.equal(before.reason, 'missing_macos')

    const synced = syncGoogleFontFamilies(root)
    assert.equal(synced.familyCount, 2)

    const after = catalogsMatch(root)
    assert.equal(after.match, true)
    assert.equal(
      readFileSync(macosCatalogPath(root), 'utf8'),
      payload,
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('web-only tree skips macOS catalog requirement', () => {
  const root = mkdtempSync(join(tmpdir(), 'gf-web-only-'))
  try {
    const webDir = join(root, 'apps/web/lib/fonts')
    mkdirSync(webDir, { recursive: true })
    writeFileSync(join(webDir, 'google-font-families.json'), '["Inter"]\n', 'utf8')
    assert.equal(macosAppPresent(root), false)
    const result = catalogsMatch(root)
    assert.equal(result.match, true)
    assert.equal(result.reason, 'web_only_tree')
    const synced = syncGoogleFontFamilies(root)
    assert.equal(synced.skipped, 'no_macos')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('repo Web and macOS catalogs match after sync helpers', () => {
  const result = catalogsMatch()
  assert.equal(
    result.match,
    true,
    `catalogs out of sync (${result.reason ?? 'diff'}); run npm run sync:google-fonts`,
  )
  if (macosAppPresent()) {
    assert.notEqual(result.reason, 'web_only_tree')
  } else {
    assert.equal(result.reason, 'web_only_tree')
  }
})
