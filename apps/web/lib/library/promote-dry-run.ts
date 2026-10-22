/**
 * Library promote dry-run — Phase 3.
 * Spec: `specs/api/library-promote.md` · `specs/domain/library-composition-roundtrip.md`
 * MUST NOT write git or open PRs (`writesGit` is always false).
 */

import {
  EDITOR_PALETTE_TYPES,
  extendableCssProperty,
  isExtendablePrimitiveProp,
  type CompositionScene,
  type SceneNode,
} from '@zaoly/contracts'
import { catalogInsertType, insertableCatalogEntries } from '@zaoly/ui'
import { resolveZaolyUiSource } from '../runtime-config'
import {
  collectPrimitiveExtends,
  componentSourcePathForType,
  ExtendUnrepresentableError,
  extendTestPathForType,
  renderExtendTest,
} from './promote-extend'
import {
  PROMOTED_TEMPLATE_STORY_PATH,
  promotedStoryPathForType,
  renderPromotedArgsStory,
  renderPromotedTemplateStory,
} from './promote-files'
import type { PromotePullRequest } from './github-promote'

export type PromoteKind = 'P1' | 'P2' | 'P3' | 'P4'

export type PromoteIssueCode =
  | 'dev-track'
  | 'collection-branding'
  | 'missing-node'
  | 'invalid-kind'
  | 'report-payload'
  | 'github-unconfigured'
  | 'github-failed'
  | 'extend-unrepresentable'

export type PromoteIssue = {
  code: PromoteIssueCode
  message: string
  nodeId?: string
}

export type PromoteFileOp = {
  path: string
  kind: 'args' | 'template-story' | 'extend-api' | 'extend-test'
  nodeId?: string
  type?: string
  args?: Record<string, unknown>
  sanitizedScene?: unknown
  contents?: string
  extends?: Array<{ name: string; value: string; cssProperty: string; tsType?: string }>
}

export type PromoteProposal = {
  writesGit: boolean
  kind: PromoteKind
  zaolyUiSource: string
  files: PromoteFileOp[]
  pullRequest?: PromotePullRequest
}

export type PromoteDryRunOk = { ok: true; proposal: PromoteProposal }
export type PromoteDryRunFail = { ok: false; error: string; issues: PromoteIssue[] }
export type PromoteDryRunResult = PromoteDryRunOk | PromoteDryRunFail

export type PromoteDryRunInput = {
  kind?: unknown
  scene?: unknown
  nodeId?: unknown
  zaolyUiSource?: unknown
}

const KNOWN_TYPES = new Set<string>([
  ...EDITOR_PALETTE_TYPES,
  'PrintQuickCheck',
  ...insertableCatalogEntries().flatMap((entry) => {
    const insertType = catalogInsertType(entry)
    return insertType && insertType !== entry.id ? [entry.id, insertType] : [entry.id]
  }),
])

const PAYLOAD_KEYS = new Set([
  'rows',
  'personas',
  'items',
  'kpis',
  'traits',
  'slices',
  'data',
  'columns',
])

const HEX_RE = /#(?:[0-9a-f]{3,8})\b/i
const LIVE_URL_RE = /^https?:\/\//i
const COLLECTION_ID_RE = /^(plx-|proj-)/i

function isScene(value: unknown): value is CompositionScene {
  if (!value || typeof value !== 'object') return false
  const s = value as CompositionScene
  return typeof s.id === 'string' && s.root != null && typeof s.root.id === 'string'
}

function walk(node: SceneNode, visit: (n: SceneNode) => void): void {
  visit(node)
  for (const child of node.children ?? []) walk(child, visit)
}

function findNode(root: SceneNode, id: string): SceneNode | null {
  let hit: SceneNode | null = null
  walk(root, (n) => {
    if (n.id === id) hit = n
  })
  return hit
}

function stringHasHex(value: unknown): boolean {
  if (typeof value === 'string') return HEX_RE.test(value)
  if (Array.isArray(value)) return value.some(stringHasHex)
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).some(stringHasHex)
  }
  return false
}

function collectBrandingIssues(node: SceneNode, issues: PromoteIssue[]): void {
  if (stringHasHex(node.props) || stringHasHex(node.style)) {
    issues.push({
      code: 'collection-branding',
      message: 'Raw hex paint cannot be promoted into the library',
      nodeId: node.id,
    })
  }
}

function collectUnknownTypeIssues(node: SceneNode, issues: PromoteIssue[]): void {
  if (!KNOWN_TYPES.has(node.type)) {
    issues.push({
      code: 'dev-track',
      message: `Unknown type ${node.type} requires ds:add / Dev-track`,
      nodeId: node.id,
    })
  }
}

function isPayloadKey(key: string): boolean {
  return PAYLOAD_KEYS.has(key)
}

function isLiveUrl(value: unknown): boolean {
  return typeof value === 'string' && LIVE_URL_RE.test(value)
}

function isCollectionId(value: unknown): boolean {
  return typeof value === 'string' && COLLECTION_ID_RE.test(value)
}

function isScalarLayoutValue(value: unknown): boolean {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  )
}

/** Contract layout/type props only — no payloads, hex, live URLs, Collection ids. */
function layoutTypeArgs(node: SceneNode): Record<string, unknown> {
  const args: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(node.props ?? {})) {
    if (isPayloadKey(key)) continue
    if (isLiveUrl(value) || isCollectionId(value)) continue
    if (key === 'dataSlot' && typeof value === 'string') {
      args.dataSlot = value
      continue
    }
    if (isScalarLayoutValue(value) && value !== '' && !stringHasHex(value)) {
      args[key] = value
    }
  }
  const styleFromExtend: Record<string, string> = {}
  for (const [key, value] of Object.entries(args)) {
    if (!isExtendablePrimitiveProp(key) || typeof value !== 'string') continue
    const css = extendableCssProperty(key)
    if (css) styleFromExtend[css] = value
  }
  if (node.tokenBindings && Object.keys(node.tokenBindings).length) {
    args.tokenBindings = { ...node.tokenBindings }
  }
  if (node.style) {
    const style: Record<string, string | number> = {}
    for (const [key, value] of Object.entries(node.style)) {
      if (typeof value === 'number') style[key] = value
      else if (typeof value === 'string' && !HEX_RE.test(value) && !LIVE_URL_RE.test(value)) {
        style[key] = value
      }
    }
    if (Object.keys(style).length) args.style = { ...styleFromExtend, ...style }
  } else if (Object.keys(styleFromExtend).length) {
    args.style = styleFromExtend
  }
  return args
}

function sanitizeNode(node: SceneNode): SceneNode {
  const props: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(node.props ?? {})) {
    if (isPayloadKey(key)) {
      props[key] = null
      continue
    }
    if (isLiveUrl(value) || isCollectionId(value) || stringHasHex(value)) continue
    props[key] = value
  }
  const next: SceneNode = {
    id: node.id,
    type: node.type,
    ...(node.name ? { name: node.name } : {}),
    ...(Object.keys(props).length ? { props } : {}),
    ...(node.tokenBindings ? { tokenBindings: { ...node.tokenBindings } } : {}),
    ...(node.hidden ? { hidden: true } : {}),
    ...(node.locked ? { locked: true } : {}),
  }
  if (node.children?.length) {
    next.children = node.children.map(sanitizeNode)
  }
  return next
}

function fail(issues: PromoteIssue[], fallback: string): PromoteDryRunFail {
  return {
    ok: false,
    error: issues[0]?.message ?? fallback,
    issues,
  }
}

export function dryRunLibraryPromote(input: PromoteDryRunInput): PromoteDryRunResult {
  const kind = input.kind
  if (kind !== 'P1' && kind !== 'P2' && kind !== 'P3' && kind !== 'P4') {
    return fail(
      [{ code: 'invalid-kind', message: 'kind must be P1, P2, P3, or P4' }],
      'invalid-kind',
    )
  }

  const zaolyUiSource =
    typeof input.zaolyUiSource === 'string' && input.zaolyUiSource.trim()
      ? input.zaolyUiSource.trim()
      : resolveZaolyUiSource()

  if (kind === 'P3') {
    return fail(
      [
        {
          code: 'dev-track',
          message: 'P3 new primitives require pnpm ds:add / Dev-track',
        },
      ],
      'dev-track',
    )
  }

  if (!isScene(input.scene)) {
    return fail(
      [{ code: 'invalid-kind', message: 'scene is required' }],
      'scene is required',
    )
  }

  const scene = input.scene
  const issues: PromoteIssue[] = []
  walk(scene.root, (n) => {
    collectUnknownTypeIssues(n, issues)
    collectBrandingIssues(n, issues)
  })

  if (kind === 'P1' || kind === 'P4') {
    const nodeId = typeof input.nodeId === 'string' ? input.nodeId.trim() : ''
    if (!nodeId) {
      return fail(
        [{ code: 'missing-node', message: `nodeId is required for ${kind}` }],
        'missing-node',
      )
    }
    const node = findNode(scene.root, nodeId)
    if (!node) {
      return fail(
        [{ code: 'missing-node', message: `Node ${nodeId} not found`, nodeId }],
        'missing-node',
      )
    }
    const nodeIssues = issues.filter((i) => i.nodeId === nodeId)
    if (nodeIssues.length) return fail(nodeIssues, nodeIssues[0]!.message)

    const path = promotedStoryPathForType(node.type)
    let extendsList: ReturnType<typeof collectPrimitiveExtends>
    try {
      extendsList = collectPrimitiveExtends(node)
    } catch (err) {
      const message =
        err instanceof ExtendUnrepresentableError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'P4 extend failed'
      return fail(
        [{ code: 'extend-unrepresentable', message, nodeId }],
        'extend-unrepresentable',
      )
    }
    const args = layoutTypeArgs(node)
    for (const ext of extendsList) {
      args[ext.name] = ext.value
    }
    if (kind === 'P4' && extendsList.length === 0) {
      return fail(
        [
          {
            code: 'extend-unrepresentable',
            message: 'P4 requires an inspector field that the primitive does not yet expose',
            nodeId,
          },
        ],
        'extend-unrepresentable',
      )
    }
    if (extendsList.length === 0) {
      return {
        ok: true,
        proposal: {
          writesGit: false,
          kind: 'P1',
          zaolyUiSource,
          files: [
            {
              path,
              kind: 'args',
              nodeId,
              type: node.type,
              args,
              contents: renderPromotedArgsStory({ type: node.type, args, zaolyUiSource }),
            },
          ],
        },
      }
    }

    try {
      const sourcePath = componentSourcePathForType(node.type)
      const testPath = extendTestPathForType(node.type)
      return {
        ok: true,
        proposal: {
          writesGit: false,
          kind: 'P4',
          zaolyUiSource,
          files: [
            {
              path,
              kind: 'args',
              nodeId,
              type: node.type,
              args,
              contents: renderPromotedArgsStory({ type: node.type, args, zaolyUiSource }),
              extends: extendsList.map((ext) => ({
                name: ext.name,
                value: ext.value,
                cssProperty: ext.cssProperty,
                tsType: ext.tsType,
              })),
            },
            {
              path: sourcePath,
              kind: 'extend-api',
              nodeId,
              type: node.type,
              extends: extendsList.map((ext) => ({
                name: ext.name,
                value: ext.value,
                cssProperty: ext.cssProperty,
                tsType: ext.tsType,
              })),
            },
            {
              path: testPath,
              kind: 'extend-test',
              nodeId,
              type: node.type,
              contents: renderExtendTest({ type: node.type, extendsList }),
              extends: extendsList.map((ext) => ({
                name: ext.name,
                value: ext.value,
                cssProperty: ext.cssProperty,
                tsType: ext.tsType,
              })),
            },
          ],
        },
      }
    } catch (err) {
      const message =
        err instanceof ExtendUnrepresentableError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'P4 extend failed'
      return fail(
        [{ code: 'extend-unrepresentable', message, nodeId }],
        'extend-unrepresentable',
      )
    }
  }

  const blocking = issues.filter((i) => i.code !== 'report-payload')
  if (blocking.length) return fail(blocking, blocking[0]!.message)

  const sanitized: CompositionScene = {
    ...scene,
    platformProjectId: null,
    root: sanitizeNode(scene.root),
  }

  return {
    ok: true,
    proposal: {
      writesGit: false,
      kind: 'P2',
      zaolyUiSource,
      files: [
        {
          path: PROMOTED_TEMPLATE_STORY_PATH,
          kind: 'template-story',
          sanitizedScene: sanitized,
          contents: renderPromotedTemplateStory({ sanitizedScene: sanitized, zaolyUiSource }),
        },
      ],
    },
  }
}
