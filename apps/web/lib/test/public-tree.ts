/**
 * Public / open-source tree detection (no internal `knowledge/`).
 * Spec: `specs/domain/zaoly-community-distribution.md`
 */
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))

/** Monorepo root (`zaoly/` or public delivery checkout). */
export const repoRootFromWebLib = path.resolve(here, '../../../..')

export function isPublicTree(root: string = repoRootFromWebLib): boolean {
  return !existsSync(path.join(root, 'knowledge'))
}

/**
 * Vitest files that assert internal knowledge docs or hosted defaults.
 * Skipped automatically when `knowledge/` is absent (public distribution).
 */
export const PUBLIC_TREE_EXCLUDED_TESTS = [
  '**/__tests__/cache-components-adoption.test.ts',
  '**/__tests__/chart-studio-panel.test.ts',
  '**/__tests__/client-page-share-spec.test.ts',
  '**/__tests__/concurrent-edit-w6.test.ts',
  '**/__tests__/dependency-bump-2026-10-10.test.ts',
  '**/__tests__/ds-deposit-semantic-map.test.ts',
  '**/__tests__/editor-palette-charts.test.ts',
  '**/__tests__/editor-zoom-crash-hardening.test.ts',
  '**/__tests__/inspector-hud-layout-ownership.test.ts',
  '**/__tests__/library-composition-roundtrip.test.ts',
  '**/__tests__/project-team-api.test.ts',
  '**/__tests__/responsive-closeout.test.ts',
  '**/__tests__/specs-inventory.test.ts',
  '**/__tests__/standalone-boot.test.ts',
  '**/__tests__/system-mail.test.ts',
  '**/__tests__/zaoly-platform-admin-spec.test.ts',
  '**/__tests__/zaoly-starter-token-pack-spec.test.ts',
  '**/__tests__/zaoly-token-studio-spec.test.ts',
  '**/__tests__/zaoly-user-management-spec.test.ts',
] as const
