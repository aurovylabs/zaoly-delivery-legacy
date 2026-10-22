import type {
  CompositionScene,
  MagazineTemplateValidationIssue,
  SceneNode,
} from '@zaoly/contracts'
import { hasPrintableContent } from '../magazine-pdf/collect-print-pages'

const TEXT_ALIGN_OK = new Set(['left', 'center', 'right', 'justify'])

/**
 * Capability-matrix validation stub (Phase 4).
 * Hard-fails: missing Collection scope, no Mag pages.
 * Soft-records legacy textAlign (does not block publish).
 */
export function validateMagazineTemplateScene(
  scene: CompositionScene,
  options?: { requirePlatformProjectId?: boolean },
): { ok: true; softIssues: MagazineTemplateValidationIssue[] } | {
  ok: false
  issues: MagazineTemplateValidationIssue[]
} {
  const issues: MagazineTemplateValidationIssue[] = []
  const softIssues: MagazineTemplateValidationIssue[] = []
  const requirePp = options?.requirePlatformProjectId !== false

  if (requirePp && !(scene.platformProjectId && String(scene.platformProjectId).trim())) {
    issues.push({
      code: 'missing_platform_project',
      message: 'platformProjectId required for publish',
    })
  }

  if (!hasPrintableContent(scene.root)) {
    issues.push({
      code: 'no_printable_pages',
      message: 'Scene has no printable Mag pages (PrintPage / PrintCover)',
    })
  }

  walkTextAlign(scene.root, softIssues)

  if (issues.length) return { ok: false, issues: [...issues, ...softIssues] }
  return { ok: true, softIssues }
}

function walkTextAlign(node: SceneNode, soft: MagazineTemplateValidationIssue[]): void {
  const align = node.props?.textAlign
  if (typeof align === 'string' && align.trim() !== '') {
    const v = align.trim()
    if (!TEXT_ALIGN_OK.has(v)) {
      soft.push({
        code: 'text_align_legacy',
        message: `Node ${node.id} textAlign "${v}" should be left|center|right|justify`,
        nodeId: node.id,
      })
    }
  }
  for (const child of node.children ?? []) walkTextAlign(child, soft)
}
