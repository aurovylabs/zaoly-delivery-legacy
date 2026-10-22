/**
 * Ready-for-eng gate for editor code export (⌘E).
 * Spec: code-export-handoff.md
 */
import type { SceneNode } from '@zaoly/contracts'
import type { InspectTokenOption } from '../inspect/token-catalog'
import { lintSceneNode, type LintIssue, type LintIssueCode } from '../linter/scene-linter'

/** Codes that block “ready for eng” even when severity is warning/info. */
export const EXPORT_READY_BLOCKING_CODES: ReadonlySet<LintIssueCode> = new Set([
  'A11Y-ALT-MISSING',
  'DS-TOKEN-UNBOUND',
])

export type ExportReadyReport = {
  ready: boolean
  blockers: LintIssue[]
  other: LintIssue[]
}

export function isExportReadyBlocker(issue: LintIssue): boolean {
  if (issue.severity === 'error') return true
  return EXPORT_READY_BLOCKING_CODES.has(issue.code)
}

/**
 * Lint the export target tree (not the whole multi-page scene).
 * Errors + missing alt + unbound tokens → not ready.
 */
export function assessExportReady(
  root: SceneNode,
  catalog?: InspectTokenOption[],
): ExportReadyReport {
  const issues: LintIssue[] = []
  lintSceneNode(root, '#18181b', issues, catalog)
  const blockers = issues.filter(isExportReadyBlocker)
  const other = issues.filter((i) => !isExportReadyBlocker(i))
  return {
    ready: blockers.length === 0,
    blockers,
    other,
  }
}
