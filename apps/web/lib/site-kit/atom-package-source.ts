/**
 * Read-only package atom source for Kit Handoff (SK-V18).
 * Spec: site-kit-playground.md · paths via catalog `storyFile` only (path-confined).
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import {
  atomBaseTypeFromOverrideId,
  isCompositionOverrideId,
  isNamespacedAtomOverrideId,
} from './override-ids'
import { findSiteKitEntry, resolveSiteKitRoot, type SiteKitCatalogEntry } from './write'
import { paths } from '../paths'

/** Map `src/components/Button.stories.tsx` → `src/components/Button.tsx`. */
export function componentSourceRelPathFromStoryFile(storyFile: string): string | null {
  const trimmed = storyFile.trim().replace(/\\/g, '/')
  if (!trimmed.startsWith('src/components/')) return null
  if (trimmed.includes('..')) return null
  const withoutStories = trimmed.replace(/\.stories\.tsx$/i, '.tsx')
  if (withoutStories === trimmed) return null
  if (!withoutStories.endsWith('.tsx')) return null
  return withoutStories
}

export function catalogEntryForAtomSource(componentId: string): SiteKitCatalogEntry | null {
  const id = componentId.trim()
  if (!id) return null
  if (isCompositionOverrideId(id)) return null
  if (isNamespacedAtomOverrideId(id)) {
    const base = atomBaseTypeFromOverrideId(id)
    return base ? findSiteKitEntry(base) ?? null : null
  }
  return findSiteKitEntry(id) ?? null
}

export type AtomPackageSourceResult =
  | {
      ok: true
      componentId: string
      catalogId: string
      exportName: string
      packageName: string
      relPath: string
      source: string
    }
  | { ok: false; code: 'unknown-component' | 'not-atom' | 'missing-file' | 'path-denied' }

/**
 * Load the package implementation for a Site Kit atom (or Collection atom fork → seed).
 * Patterns return `not-atom`. Never writes.
 */
export async function readAtomPackageSource(
  componentId: string,
  options?: { kitRoot?: string; cwd?: string },
): Promise<AtomPackageSourceResult> {
  const entry = catalogEntryForAtomSource(componentId)
  if (!entry) {
    if (isCompositionOverrideId(componentId.trim())) {
      return { ok: false, code: 'not-atom' }
    }
    return { ok: false, code: 'unknown-component' }
  }

  const relPath = componentSourceRelPathFromStoryFile(entry.storyFile)
  if (!relPath) return { ok: false, code: 'path-denied' }

  const kitRoot = options?.kitRoot ?? resolveSiteKitRoot(options?.cwd)
  const abs = path.resolve(kitRoot, relPath)
  const componentsRoot = path.resolve(kitRoot, 'src/components')
  if (!abs.startsWith(componentsRoot + path.sep) && abs !== componentsRoot) {
    return { ok: false, code: 'path-denied' }
  }

  try {
    const source = await readFile(abs, 'utf8')
    return {
      ok: true,
      componentId: componentId.trim(),
      catalogId: entry.id,
      exportName: entry.exportName,
      packageName: paths.siteKitPackageName,
      relPath,
      source,
    }
  } catch {
    return { ok: false, code: 'missing-file' }
  }
}
