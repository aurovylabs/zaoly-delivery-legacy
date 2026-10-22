/**
 * Structural scene content audit for agent self-check (Welle 1).
 * Spec: specs/domain/scene-content-audit.md
 */
import type { CompositionScene, SceneNode } from '@zaoly/contracts'
import { expandCompositionScene } from './expand-instances'
import { materializeScenePages, resolveActivePageId } from './scene-pages'
import { computeSceneCraftStats, evaluateCraftThinFlags } from './craft-debug'

export type SceneContentAuditSeverity = 'error' | 'warning'

export type SceneContentAuditCode =
  | 'seed-copy'
  | 'generic-alt'
  | 'empty-select-options'
  | 'missing-cta'
  | 'missing-product-title'
  | 'craft-thin'

export type SceneContentAuditFinding = {
  nodeId: string
  severity: SceneContentAuditSeverity
  code: SceneContentAuditCode
  message: string
  propKey?: string
  value?: string
}

export type SceneContentAuditResult = {
  sceneId: string
  updatedAt: string
  activePageId: string | null
  ok: boolean
  findings: SceneContentAuditFinding[]
}

const SEED_STRINGS = new Set(
  [
    'get started',
    'option a',
    'option b',
    'text',
    'link',
    'new',
    'button',
    'email',
    'select',
    'image',
    'message',
  ].map((s) => s.toLowerCase()),
)

const GENERIC_ALT = new Set(['image', 'img', 'photo', 'bild', 'graphic', ''])

function norm(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return ''
}

function isSeedCopy(value: unknown): boolean {
  const s = norm(value)
  if (!s) return false
  return SEED_STRINGS.has(s.toLowerCase())
}

function walk(node: SceneNode, visit: (n: SceneNode) => void): void {
  visit(node)
  for (const child of node.children ?? []) walk(child, visit)
}

function selectOptionsLookSeed(props: Record<string, unknown> | undefined): boolean {
  if (!props) return true
  const options = props.options
  if (options == null) return true
  if (typeof options === 'string') {
    const lines = options
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    if (!lines.length) return true
    return lines.every((l) => isSeedCopy(l) || /^option\s*[a-z0-9]+$/i.test(l))
  }
  if (Array.isArray(options)) {
    if (!options.length) return true
    return options.every((o) => {
      if (o && typeof o === 'object' && 'label' in o) {
        return isSeedCopy((o as { label?: unknown }).label)
      }
      return isSeedCopy(o)
    })
  }
  return false
}

function isButtonType(type: string): boolean {
  return type === 'SiteButton' || type === 'Button'
}

function isTextType(type: string): boolean {
  return type === 'SiteText' || type === 'Text' || type === 'Heading'
}

function isSelectType(type: string): boolean {
  return type === 'SiteSelect' || type === 'Select'
}

function isImageType(type: string): boolean {
  return type === 'SiteImage' || type === 'Image' || type === 'SiteSvg'
}

function textRole(props: Record<string, unknown> | undefined): string {
  return norm(props?.role).toLowerCase()
}

function textChildren(props: Record<string, unknown> | undefined): string {
  return norm(props?.children)
}

/** Audit expanded active-page tree for seed copy and missing PDP signals. */
export function auditSceneContent(scene: CompositionScene): SceneContentAuditResult {
  const findings: SceneContentAuditFinding[] = []
  const expanded = expandCompositionScene(scene)
  let contentNodeCount = 0
  let buttonCount = 0
  let nonSeedButtonCount = 0
  let hasProductTitle = false

  walk(expanded, (node) => {
    if (node.hidden) return
    const type = node.type
    const props = node.props ?? {}

    if (isTextType(type) || isButtonType(type) || isSelectType(type) || isImageType(type)) {
      contentNodeCount += 1
    }

    const childrenProp = textChildren(props)
    if (childrenProp && isSeedCopy(childrenProp)) {
      findings.push({
        nodeId: node.id,
        severity: 'error',
        code: 'seed-copy',
        message: `Seed/Master-Copy noch sichtbar: "${childrenProp}"`,
        propKey: 'children',
        value: childrenProp,
      })
    }

    const placeholder = norm(props.placeholder)
    if (placeholder && isSeedCopy(placeholder)) {
      findings.push({
        nodeId: node.id,
        severity: 'error',
        code: 'seed-copy',
        message: `Seed-Placeholder: "${placeholder}"`,
        propKey: 'placeholder',
        value: placeholder,
      })
    }

    if (isButtonType(type)) {
      buttonCount += 1
      const label = childrenProp || norm(props.label)
      if (label && !isSeedCopy(label)) nonSeedButtonCount += 1
    }

    if (isTextType(type)) {
      const role = textRole(props)
      if (
        (role === 'title' || role === 'display' || props.level != null) &&
        childrenProp &&
        !isSeedCopy(childrenProp)
      ) {
        hasProductTitle = true
      }
    }

    if (isSelectType(type) && selectOptionsLookSeed(props)) {
      findings.push({
        nodeId: node.id,
        severity: 'error',
        code: 'empty-select-options',
        message: 'Select hat keine echten Optionen (Seed Option A/B oder leer)',
        propKey: 'options',
      })
    }

    if (isImageType(type)) {
      const alt = norm(props.alt).toLowerCase()
      if (GENERIC_ALT.has(alt) || isSeedCopy(props.alt)) {
        findings.push({
          nodeId: node.id,
          severity: 'warning',
          code: 'generic-alt',
          message: 'Image alt fehlt oder ist generisch — produktspezifisch setzen',
          propKey: 'alt',
          value: norm(props.alt),
        })
      }
    }
  })

  if (buttonCount > 0 && nonSeedButtonCount === 0) {
    findings.push({
      nodeId: expanded.id,
      severity: 'error',
      code: 'missing-cta',
      message: 'Alle Buttons nutzen noch Seed-Labels (z. B. Get started) — echte CTA setzen',
    })
  }

  if (contentNodeCount >= 3 && !hasProductTitle) {
    findings.push({
      nodeId: expanded.id,
      severity: 'warning',
      code: 'missing-product-title',
      message: 'Kein Titel/Display-Text mit echtem Inhalt gefunden',
    })
  }

  const craftStats = computeSceneCraftStats(expanded)
  const craftFlags = evaluateCraftThinFlags(craftStats)
  const thin = craftFlags.find((f) => f.code === 'craft-thin')
  if (thin) {
    findings.push({
      nodeId: expanded.id,
      severity: 'warning',
      code: 'craft-thin',
      message: thin.message,
    })
  } else if (craftFlags.length > 0) {
    findings.push({
      nodeId: expanded.id,
      severity: 'warning',
      code: 'craft-thin',
      message: `Craft density weak (${craftFlags.map((f) => f.code).join(', ')}) — increase type scale, surfaces, or grids`,
    })
  }

  const ok = !findings.some((f) => f.severity === 'error')
  const materialized = materializeScenePages(scene)
  const pages = materialized.pages ?? []
  const pageId = pages.length
    ? resolveActivePageId(pages, materialized.activePageId)
    : null
  return {
    sceneId: scene.id,
    updatedAt: scene.updatedAt,
    activePageId: pageId,
    ok,
    findings,
  }
}
