import { csfStringLiteral, sanitizeKitAxes } from '../master-variants/validate-wire'
import { tokenPathToCssVarRef } from './token-path-css-var'
import { compositionStoryTitle } from './story-title'
import { compositionVariantStoryName } from './validate'
import type {
  CompositionNamedVariant,
  SiteKitCatalogEntry,
  SiteKitCompositionNode,
} from './types'

/** Pretty-print threshold for complex prop values and attribute length (SK-V8). */
export const JSX_PRETTY_ATTR_THRESHOLD = 48

export function jsxPropExpression(value: unknown, valueIndent = 0): string {
  if (value === null || value === undefined) return 'undefined'
  if (typeof value === 'string') return JSON.stringify(value)
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  const compact = JSON.stringify(value)
  if (compact.length < JSX_PRETTY_ATTR_THRESHOLD) return compact
  const pretty = JSON.stringify(value, null, 2)
  if (valueIndent <= 0) return pretty
  const pad = '  '.repeat(valueIndent)
  return pretty
    .split('\n')
    .map((line, i) => (i === 0 ? line : `${pad}${line}`))
    .join('\n')
}

export function escapeJsxText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/{/g, '&#123;')
    .replace(/}/g, '&#125;')
}

function formatStyleExpression(
  style: Record<string, string | number>,
  attrIndent: number,
): { expression: string; multiline: boolean } {
  const entries = Object.entries(style).map(
    ([k, v]) => `${k}: ${typeof v === 'string' ? JSON.stringify(v) : v}`,
  )
  if (entries.length === 0) return { expression: '', multiline: false }
  // Expression is the object literal only; caller wraps as style={…} → style={{ … }}.
  if (entries.length < 2) {
    return { expression: `{ ${entries[0]} }`, multiline: false }
  }
  const pad = '  '.repeat(attrIndent)
  const inner = '  '.repeat(attrIndent + 1)
  const body = entries.map((e) => `${inner}${e},`).join('\n')
  return {
    expression: `{\n${body}\n${pad}}`,
    multiline: true,
  }
}

function collectExportNames(
  node: SiteKitCompositionNode,
  typeToExport: Record<string, string>,
  into: Set<string>,
): void {
  const tag = typeToExport[node.type]
  if (tag) into.add(tag)
  for (const child of node.children ?? []) collectExportNames(child, typeToExport, into)
}

/** Apply token pack path bindings onto style as `var(--ds-…)` (SK-V13). */
export function styleWithTokenBindings(
  style: Record<string, string | number> | undefined,
  tokenBindings: Record<string, string> | undefined,
): Record<string, string | number> | undefined {
  if (!tokenBindings || Object.keys(tokenBindings).length === 0) {
    return style && Object.keys(style).length > 0 ? { ...style } : undefined
  }
  const next: Record<string, string | number> = { ...(style ?? {}) }
  for (const [key, path] of Object.entries(tokenBindings)) {
    const trimmed = typeof path === 'string' ? path.trim() : ''
    if (!key || !trimmed) continue
    next[key] = tokenPathToCssVarRef(trimmed)
  }
  return next
}

/** Collect token pack path maps keyed by stable node path (`root`, `root/0`, …). */
export function collectTokenBindingsExport(
  node: SiteKitCompositionNode,
  path = 'root',
  into: Record<string, Record<string, string>> = {},
): Record<string, Record<string, string>> {
  const bindings = node.tokenBindings
  if (bindings && Object.keys(bindings).length > 0) {
    const cleaned: Record<string, string> = {}
    for (const [k, v] of Object.entries(bindings)) {
      if (typeof v === 'string' && v.trim()) cleaned[k] = v.trim()
    }
    if (Object.keys(cleaned).length > 0) {
      into[path] = cleaned
    }
  }
  ;(node.children ?? []).forEach((child, index) => {
    collectTokenBindingsExport(child, `${path}/${index}`, into)
  })
  return into
}

function formatTokenBindingsExport(map: Record<string, Record<string, string>>): string {
  if (Object.keys(map).length === 0) return ''
  const pretty = JSON.stringify(map, null, 2)
  return `
/** token pack paths used by this module (SSOT keys; paint via --ds-*). */
export const tokenBindings = ${pretty} as const
`
}

type JsxAttr = { name: string; expression: string }

function buildAttrs(
  props: Record<string, unknown>,
  style: Record<string, string | number> | undefined,
  attrIndent: number,
): { attrs: JsxAttr[]; styleKeyCount: number } {
  const attrs: JsxAttr[] = Object.entries(props).map(([key, value]) => ({
    name: key,
    expression: jsxPropExpression(value, attrIndent + 1),
  }))
  const styleKeyCount = style && Object.keys(style).length > 0 ? Object.keys(style).length : 0
  if (style && styleKeyCount > 0) {
    const formatted = formatStyleExpression(style, attrIndent)
    attrs.push({ name: 'style', expression: formatted.expression })
  }
  return { attrs, styleKeyCount }
}

function shouldMultilineOpen(attrs: JsxAttr[], styleKeyCount: number): boolean {
  if (attrs.length >= 2) return true
  if (styleKeyCount >= 2) return true
  return attrs.some((a) => `${a.name}={${a.expression}}`.length >= JSX_PRETTY_ATTR_THRESHOLD)
}

function renderOpenTag(
  pad: string,
  tag: string,
  attrs: JsxAttr[],
  multiline: boolean,
  selfClosing: boolean,
): string {
  if (attrs.length === 0) {
    return selfClosing ? `${pad}<${tag} />` : `${pad}<${tag}>`
  }
  if (!multiline) {
    const inline = attrs.map((a) => `${a.name}={${a.expression}}`).join(' ')
    return selfClosing ? `${pad}<${tag} ${inline} />` : `${pad}<${tag} ${inline}>`
  }
  const attrPad = `${pad}  `
  const lines = attrs.map((a) => `${attrPad}${a.name}={${a.expression}}`)
  const closer = selfClosing ? `${pad}/>` : `${pad}>`
  return [`${pad}<${tag}`, ...lines, closer].join('\n')
}

function renderJsx(
  node: SiteKitCompositionNode,
  typeToExport: Record<string, string>,
  indent: number,
): string {
  const pad = '  '.repeat(indent)
  const tag = typeToExport[node.type] ?? 'div'
  const props = { ...(node.props ?? {}) }
  const textChildren = props.children
  delete props.children
  delete props.slot

  const attrIndent = indent + 1
  const style = styleWithTokenBindings(node.style, node.tokenBindings)
  const { attrs, styleKeyCount } = buildAttrs(props, style, attrIndent)
  const multiline = shouldMultilineOpen(attrs, styleKeyCount)

  const kids = node.children ?? []
  if (kids.length > 0) {
    const open = renderOpenTag(pad, tag, attrs, multiline, false)
    const body = kids.map((c) => renderJsx(c, typeToExport, indent + 1)).join('\n')
    return `${open}\n${body}\n${pad}</${tag}>`
  }
  if (typeof textChildren === 'string' || typeof textChildren === 'number') {
    const open = renderOpenTag(pad, tag, attrs, multiline, false)
    const text = escapeJsxText(String(textChildren))
    if (multiline) {
      return `${open}\n${pad}  ${text}\n${pad}</${tag}>`
    }
    return `${open}${text}</${tag}>`
  }
  return renderOpenTag(pad, tag, attrs, multiline, true)
}

export function generateCompositionModule(
  exportName: string,
  root: SiteKitCompositionNode,
  catalog: readonly SiteKitCatalogEntry[],
  options?: { headerComment?: string; componentsImportPath?: string },
): string {
  const typeToExport: Record<string, string> = {}
  for (const entry of catalog) typeToExport[entry.id] = entry.exportName

  const names = new Set<string>()
  collectExportNames(root, typeToExport, names)
  const imports = [...names].sort().join(', ')
  const jsx = renderJsx(root, typeToExport, 2)
  const bindingsMap = collectTokenBindingsExport(root)
  const bindingsBlock = formatTokenBindingsExport(bindingsMap)
  const header = options?.headerComment ?? '/** Generated by CREATION — reviewable React handoff. */'
  const componentsFrom = options?.componentsImportPath ?? '../components'
  return `${header}
import { ${imports} } from '${componentsFrom}'
${bindingsBlock}
export function ${exportName}() {
  return (
${jsx}
  )
}

export default ${exportName}
`
}

export function generateCompositionStory(
  exportName: string,
  catalog: readonly SiteKitCatalogEntry[],
  variants?: CompositionNamedVariant[],
  options?: {
    hydrated?: boolean
    platformProjectId?: string | null
    storyTitle?: string
    componentId?: string
    previewImportPath?: string
    /** Phase 3 axes — Controls + live override resolve by combination. */
    axes?: { id: string; name: string; values: string[] }[]
  },
): string {
  void catalog
  const storyTitle =
    options?.storyTitle ??
    compositionStoryTitle(exportName, options?.platformProjectId)
  const storyTitleLit = csfStringLiteral(storyTitle)
  const liveComponentId = options?.componentId?.trim() ?? ''
  const previewFrom = options?.previewImportPath ?? '../components/CompositionPreview'
  const axes = sanitizeKitAxes(options?.axes)
  const defaultCombination = variants?.[0]?.combination
  const axisArgsEntries =
    axes && liveComponentId
      ? axes
          .map((a) => {
            const pick = defaultCombination?.[a.id] ?? a.values[0] ?? ''
            const key = /^[A-Za-z_$][\w$]*$/.test(a.id) ? a.id : JSON.stringify(a.id)
            return `    ${key}: ${JSON.stringify(pick)},`
          })
          .join('\n')
      : ''
  const argsBlock = liveComponentId
    ? `
  args: {
    componentId: ${JSON.stringify(liveComponentId)},
${axisArgsEntries}  },`
    : ''
  const axisArgTypes =
    axes
      ?.map((a) => {
        const key = /^[A-Za-z_$][\w$]*$/.test(a.id) ? a.id : JSON.stringify(a.id)
        return `    ${key}: {
      name: ${JSON.stringify(a.name)},
      description: 'Master Component Set axis',
      control: { type: 'select' },
      options: ${JSON.stringify(a.values)},
    },`
      })
      .join('\n') ?? ''
  const argTypesBlock = axisArgTypes
    ? `
  argTypes: {
${axisArgTypes}
  },`
    : ''

  if (!variants || variants.length < 2) {
    const hydratedNote = options?.hydrated ? '\n/** Hydrated from CREATION — Default only. */' : ''
    return `import type { Meta, StoryObj } from '@storybook/react-vite'
import { ${exportName} } from './${exportName}'
${hydratedNote}
const meta = {
  title: ${storyTitleLit},
  component: ${exportName},
  tags: ['site-kit', 'composition'],${argsBlock}${argTypesBlock}
} satisfies Meta<typeof ${exportName}>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
`
  }

  const storyExports = variants
    .map((v) => {
      const storyName = compositionVariantStoryName(v.name, exportName)
      return {
        storyName,
        constName: `TREE_${storyName.toUpperCase()}`,
        tree: v.composition,
        combination: v.combination,
      }
    })
    .filter((row, index, all) => all.findIndex((x) => x.storyName === row.storyName) === index)

  const consts = storyExports
    .map(
      (row) =>
        `const ${row.constName} = ${JSON.stringify(row.tree)} as SiteKitCompositionNode`,
    )
    .join('\n')

  const stories = storyExports
    .map((row) => {
      const storyAxisArgs =
        axes && row.combination
          ? axes
              .map((a) => {
                const pick = row.combination?.[a.id] ?? a.values[0] ?? ''
                const key = /^[A-Za-z_$][\w$]*$/.test(a.id) ? a.id : JSON.stringify(a.id)
                return `    ${key}: ${JSON.stringify(pick)},`
              })
              .join('\n')
          : ''
      const argsSection = storyAxisArgs
        ? `
  args: {
${storyAxisArgs}  },`
        : ''
      if (row.storyName === 'Default') {
        return `export const Default: Story = {${argsSection}
  render: () => <CompositionPreview node={${row.constName}} />,
}`
      }
      return `export const ${row.storyName}: Story = {${argsSection}
  render: () => <CompositionPreview node={${row.constName}} />,
}`
    })
    .join('\n\n')

  const hydratedNote = options?.hydrated
    ? axes
      ? '\n/** Hydrated from CREATION — Master Component Set CSF + axis controls. */'
      : '\n/** Hydrated from CREATION — Master named variants as CSF substories. */'
    : ''
  const tags = axes
    ? `['site-kit', 'composition', 'named-variants', 'component-set']`
    : `['site-kit', 'composition', 'named-variants']`

  return `import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  CompositionPreview,
  type SiteKitCompositionNode,
} from '${previewFrom}'
import { ${exportName} } from './${exportName}'

${consts}
${hydratedNote}
const meta = {
  title: ${storyTitleLit},
  component: ${exportName},
  tags: ${tags},${argsBlock}${argTypesBlock}
} satisfies Meta<typeof ${exportName}>

export default meta
type Story = StoryObj<typeof meta>

${stories}
`
}
