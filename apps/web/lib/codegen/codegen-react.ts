/**
 * Editor ⌘E React export — App DS (`@zaoly/ui`) or Site Kit (SK-V13 grammar).
 * Spec: code-export-handoff.md
 */
import type { SceneMaster, SceneNode } from '@zaoly/contracts'
import { SITE_KIT_CATALOG } from '@zaoly/site-kit'
import {
  generateCompositionModule,
  type SiteKitCompositionNode,
} from '@zaoly/site-kit/composition-codegen'
import { paths } from '../paths'
import { expandSceneTree } from '../scene/expand-instances'
import { coerceEditorNodeToSiteKit } from '../site-kit/coerce-editor-tree-to-site-kit'

const KNOWN_UI_PRIMITIVES = new Set([
  'Stack',
  'Grid',
  'Card',
  'Text',
  'Button',
  'Image',
  'Badge',
  'Divider',
])

const BG_MEDIA_KEYS = new Set([
  'backgroundImage',
  'backgroundSize',
  'backgroundPosition',
  'backgroundRepeat',
  'backgroundOverlay',
])

/** Same threshold as Kit `JSX_PRETTY_ATTR_THRESHOLD` (SK-V8). */
export const REACT_EXPORT_PRETTY_ATTR_THRESHOLD = 48

/** Default handoff consumer — Site Kit + token pack `--ds-*`. */
export type ReactExportConsumer = 'site-kit' | 'zaoly-ui'

export const DEFAULT_REACT_EXPORT_CONSUMER: ReactExportConsumer = 'site-kit'

export type GenerateReactOptions = {
  consumer?: ReactExportConsumer
  masters?: SceneMaster[] | null
}

function cleanName(name?: string, fallback = 'Component'): string {
  if (!name) return fallback
  const cleaned = name.replace(/[^a-zA-Z0-9]/g, '')
  if (!cleaned) return fallback
  return cleaned[0].toUpperCase() + cleaned.slice(1)
}

function normalizeTagName(rawType: string): string {
  const stripped = rawType.startsWith('Site') ? rawType.replace('Site', '') : rawType
  if (stripped === 'Heading' || stripped === 'Lede') return 'Text'
  if (stripped === 'Container' || stripped === 'Box' || stripped === 'Panel') return 'Stack'
  return stripped
}

function collectUsedPrimitives(node: SceneNode, acc = new Set<string>()): Set<string> {
  const normalized = normalizeTagName(node.type)
  if (KNOWN_UI_PRIMITIVES.has(normalized)) {
    acc.add(normalized)
  }
  if (node.children) {
    for (const child of node.children) {
      collectUsedPrimitives(child, acc)
    }
  }
  return acc
}

type JsxAttr = { source: string }

function formatStyleObject(mergedStyle: Record<string, unknown>, attrIndent: number): string {
  const entries = Object.entries(mergedStyle)
    .filter(([_, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}: ${typeof v === 'number' ? v : JSON.stringify(v)}`)
  if (entries.length === 0) return ''
  if (entries.length < 2) {
    return `style={{ ${entries[0]} }}`
  }
  const pad = ' '.repeat(attrIndent)
  const inner = ' '.repeat(attrIndent + 2)
  const body = entries.map((e) => `${inner}${e},`).join('\n')
  return `style={{\n${body}\n${pad}}}`
}

function buildAttrs(
  nodeType: string,
  props?: Record<string, unknown>,
  style?: Record<string, unknown>,
  tokenBindings?: Record<string, string>,
  attrIndent = 0,
): { attrs: JsxAttr[]; styleKeyCount: number } {
  const parts: JsxAttr[] = []
  const mergedStyle: Record<string, unknown> = { ...(style || {}) }

  if (props?.backgroundImage) {
    const bgImg = String(props.backgroundImage).trim()
    const rawUrl = bgImg.startsWith('url(') ? bgImg.slice(4, -1).replace(/["']/g, '') : bgImg
    const overlay = props.backgroundOverlay ? String(props.backgroundOverlay).trim() : ''

    if (overlay && overlay !== 'none') {
      mergedStyle.backgroundImage = `${overlay}, url('${rawUrl}')`
    } else {
      mergedStyle.backgroundImage = `url('${rawUrl}')`
    }

    mergedStyle.backgroundSize = props.backgroundSize || 'cover'
    mergedStyle.backgroundPosition = props.backgroundPosition || 'center'
    mergedStyle.backgroundRepeat = props.backgroundRepeat || 'no-repeat'
  }

  if (nodeType === 'Heading' && !props?.role) {
    parts.push({ source: 'role="title"' })
  } else if (nodeType === 'Lede' && !props?.role) {
    parts.push({ source: 'role="lede"' })
  }

  if (tokenBindings) {
    for (const [k, tokenPath] of Object.entries(tokenBindings)) {
      if (tokenPath && !props?.[k]) {
        parts.push({ source: `${k}="${tokenPath}"` })
        if (mergedStyle[k]) {
          delete mergedStyle[k]
        }
      }
    }
  }

  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (
        k === 'children' ||
        k === 'text' ||
        k === 'id' ||
        BG_MEDIA_KEYS.has(k) ||
        v === undefined ||
        v === null
      ) {
        continue
      }
      if (typeof v === 'boolean') {
        if (v) parts.push({ source: k })
        else parts.push({ source: `${k}={false}` })
      } else if (typeof v === 'number') {
        parts.push({ source: `${k}={${v}}` })
      } else if (typeof v === 'string') {
        parts.push({ source: `${k}="${v.replace(/"/g, '&quot;')}"` })
      }
    }
  }

  const styleKeyCount = Object.keys(mergedStyle).filter(
    (k) => mergedStyle[k] !== undefined && mergedStyle[k] !== null && mergedStyle[k] !== '',
  ).length
  const styleSource = formatStyleObject(mergedStyle, attrIndent)
  if (styleSource) {
    parts.push({ source: styleSource })
  }

  return { attrs: parts, styleKeyCount }
}

function shouldMultilineOpen(attrs: JsxAttr[], styleKeyCount: number): boolean {
  if (attrs.length >= 2) return true
  if (styleKeyCount >= 2) return true
  return attrs.some((a) => a.source.length >= REACT_EXPORT_PRETTY_ATTR_THRESHOLD)
}

function renderOpenTag(
  pad: string,
  tagName: string,
  attrs: JsxAttr[],
  multiline: boolean,
  selfClosing: boolean,
): string {
  if (attrs.length === 0) {
    return selfClosing ? `${pad}<${tagName} />` : `${pad}<${tagName}>`
  }
  if (!multiline) {
    const inline = attrs.map((a) => a.source).join(' ')
    return selfClosing ? `${pad}<${tagName} ${inline} />` : `${pad}<${tagName} ${inline}>`
  }
  const attrPad = `${pad}  `
  const lines = attrs.map((a) => `${attrPad}${a.source}`)
  const closer = selfClosing ? `${pad}/>` : `${pad}>`
  return [`${pad}<${tagName}`, ...lines, closer].join('\n')
}

export function generateReactJsx(node: SceneNode, indentLevel = 2): string {
  const pad = ' '.repeat(indentLevel)
  const tagName = normalizeTagName(node.type)
  const attrIndent = indentLevel + 2
  const { attrs, styleKeyCount } = buildAttrs(
    node.type,
    node.props as Record<string, unknown> | undefined,
    node.style as Record<string, unknown> | undefined,
    node.tokenBindings as Record<string, string> | undefined,
    attrIndent,
  )
  const multiline = shouldMultilineOpen(attrs, styleKeyCount)

  const textContent = (node.props?.children as string) || (node.props?.text as string) || ''
  const hasChildren = Boolean(node.children && node.children.length > 0)

  if (!hasChildren && !textContent) {
    return renderOpenTag(pad, tagName, attrs, multiline, true)
  }

  const open = renderOpenTag(pad, tagName, attrs, multiline, false)

  if (!hasChildren && textContent) {
    return `${open}${textContent}</${tagName}>`
  }

  const childrenJsx = (node.children || [])
    .map((c) => generateReactJsx(c, indentLevel + 2))
    .join('\n')

  return `${open}\n${childrenJsx}\n${pad}</${tagName}>`
}

function styleAsComposition(
  style: SceneNode['style'],
): Record<string, string | number> | undefined {
  if (!style) return undefined
  const next: Record<string, string | number> = {}
  for (const [k, v] of Object.entries(style)) {
    if (v === undefined || v === null || v === '') continue
    if (typeof v === 'string' || typeof v === 'number') next[k] = v
  }
  return Object.keys(next).length > 0 ? next : undefined
}

/** Scene tree → Site Kit composition node for SK-V13 module codegen. */
export function sceneNodeToSiteKitComposition(node: SceneNode): SiteKitCompositionNode {
  const props: Record<string, unknown> = { ...(node.props ?? {}) }
  if (props.children == null && typeof props.text === 'string') {
    props.children = props.text
  }
  if (props.children == null && typeof props.label === 'string') {
    props.children = props.label
  }
  delete props.text
  delete props.label
  delete props.id

  const style: Record<string, string | number> = { ...(styleAsComposition(node.style) ?? {}) }

  if (props.backgroundImage) {
    const bgImg = String(props.backgroundImage).trim()
    const rawUrl = bgImg.startsWith('url(') ? bgImg.slice(4, -1).replace(/["']/g, '') : bgImg
    const overlay = props.backgroundOverlay ? String(props.backgroundOverlay).trim() : ''
    if (overlay && overlay !== 'none') {
      style.backgroundImage = `${overlay}, url('${rawUrl}')`
    } else {
      style.backgroundImage = `url('${rawUrl}')`
    }
    style.backgroundSize = (props.backgroundSize as string) || 'cover'
    style.backgroundPosition = (props.backgroundPosition as string) || 'center'
    style.backgroundRepeat = (props.backgroundRepeat as string) || 'no-repeat'
  }

  for (const key of BG_MEDIA_KEYS) {
    delete props[key]
  }

  return {
    type: node.type,
    name: node.name,
    props,
    style: Object.keys(style).length > 0 ? style : undefined,
    tokenBindings: node.tokenBindings,
    children: node.children?.map(sceneNodeToSiteKitComposition),
  }
}

export function prepareSiteKitExportRoot(
  node: SceneNode,
  masters?: SceneMaster[] | null,
): SceneNode {
  const expanded = masters?.length ? expandSceneTree(node, masters) : node
  return coerceEditorNodeToSiteKit(expanded)
}

export function generateSiteKitReactModule(
  node: SceneNode,
  componentName?: string,
  masters?: SceneMaster[] | null,
): string {
  const name = cleanName(componentName || node.name, 'ExportedComponent')
  const prepared = prepareSiteKitExportRoot(node, masters)
  const composition = sceneNodeToSiteKitComposition(prepared)
  return generateCompositionModule(name, composition, SITE_KIT_CATALOG, {
    headerComment:
      '/** CREATION editor handoff — Site Kit + token pack var(--ds-*) (SK-V13). */',
    componentsImportPath: paths.siteKitPackageName,
  })
}

function generateZaolyUiReactComponent(node: SceneNode, componentName?: string): string {
  const name = cleanName(componentName || node.name, 'ExportedComponent')
  const jsx = generateReactJsx(node, 4)

  const used = Array.from(collectUsedPrimitives(node)).sort()
  const importList = used.length > 0 ? used.join(', ') : 'Stack'

  return `import React from 'react'
import { ${importList} } from '@zaoly/ui'

export function ${name}() {
  return (
${jsx}
  )
}
`
}

export function generateReactComponent(
  node: SceneNode,
  componentName?: string,
  options?: GenerateReactOptions,
): string {
  const consumer = options?.consumer ?? DEFAULT_REACT_EXPORT_CONSUMER
  if (consumer === 'site-kit') {
    return generateSiteKitReactModule(node, componentName, options?.masters)
  }
  return generateZaolyUiReactComponent(node, componentName)
}
