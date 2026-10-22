/**
 * P4 — extend an existing catalog primitive with inspect chrome.
 * Spec: specs/domain/library-composition-roundtrip.md Phase 8
 * Reject if the patch is not span-accurate (Zaoly Art. 7).
 */

import {
  contractPropsForType,
  extendableCssProperty,
  extendablePrimitiveProps,
  isAllowedExtendableValue,
  isExtendablePrimitiveProp,
  isPromoteTokenPath,
  libraryCssValueForTokenPath,
  type SceneNode,
} from '@zaoly/contracts'
import { isSafeTypeIdent } from './promote-files'

export class ExtendUnrepresentableError extends Error {
  readonly code = 'extend-unrepresentable' as const
  constructor(message: string) {
    super(message)
    this.name = 'ExtendUnrepresentableError'
  }
}

export type PrimitiveExtend = {
  name: string
  value: string
  cssProperty: string
  tsType: string
}

function cssValueForInspect(name: string, raw: string): string {
  const trimmed = raw.trim()
  const fromToken = libraryCssValueForTokenPath(trimmed)
  if (fromToken) return fromToken
  if (name === 'blur' && !trimmed.startsWith('blur(')) return `blur(${trimmed})`
  if (name === 'rotate' && !trimmed.startsWith('rotate(')) return `rotate(${trimmed})`
  return trimmed
}

function tsTypeForExtend(name: string): string {
  const def = extendablePrimitiveProps().find((p) => p.name === name)
  const union = (def?.options ?? []).map((o) => `'${o.value}'`).join(' | ')
  return union || 'string'
}

function considerExtendKey(
  known: Set<string>,
  out: Map<string, PrimitiveExtend>,
  key: string,
  raw: unknown,
): void {
  if (!isExtendablePrimitiveProp(key) || known.has(key)) return
  if (typeof raw !== 'string' || !raw.trim()) return
  const trimmed = raw.trim()
  if (isPromoteTokenPath(trimmed) && !libraryCssValueForTokenPath(trimmed)) {
    throw new ExtendUnrepresentableError(
      `No library CSS variable for token path ${trimmed}`,
    )
  }
  if (!isAllowedExtendableValue(key, trimmed) && !libraryCssValueForTokenPath(trimmed)) {
    return
  }
  const cssProperty = extendableCssProperty(key)
  if (!cssProperty) return
  out.set(key, {
    name: key,
    value: cssValueForInspect(key, trimmed),
    cssProperty,
    tsType: tsTypeForExtend(key),
  })
}

export function collectPrimitiveExtends(node: SceneNode): PrimitiveExtend[] {
  const known = new Set(contractPropsForType(node.type).map((p) => p.name))
  const out = new Map<string, PrimitiveExtend>()
  for (const [key, value] of Object.entries(node.props ?? {})) {
    considerExtendKey(known, out, key, value)
  }
  for (const [key, value] of Object.entries(node.tokenBindings ?? {})) {
    considerExtendKey(known, out, key, value)
  }
  return [...out.values()]
}

export function componentSourcePathForType(type: string): string {
  if (!isSafeTypeIdent(type)) {
    throw new ExtendUnrepresentableError(`Unsafe type ident: ${type}`)
  }
  if (type.startsWith('Print')) {
    throw new ExtendUnrepresentableError(
      `Print types live in a bundle file and cannot be P4-patched (${type})`,
    )
  }
  return `packages/ui/src/components/${type}.tsx`
}

export function extendTestPathForType(type: string): string {
  if (!isSafeTypeIdent(type)) {
    throw new ExtendUnrepresentableError(`Unsafe type ident: ${type}`)
  }
  return `packages/ui/src/components/${type}.promoted.extend.test.tsx`
}

function tsUnion(ext: PrimitiveExtend): string {
  return ext.tsType || `'${ext.value}'`
}

function stylePart(ext: PrimitiveExtend): string {
  if (ext.name === 'blur') return `filter: \`blur(\${${ext.name}})\``
  if (ext.name === 'rotate') return `transform: \`rotate(\${${ext.name}})\``
  if (ext.cssProperty === ext.name) return ext.name
  return `${ext.cssProperty}: ${ext.name}`
}

function styleMergeExpr(extendsList: PrimitiveExtend[]): string {
  const parts = extendsList.map(stylePart)
  return `{ ...style, ${parts.join(', ')} }`
}

function applyStyleOnInnerPanel(source: string, returnIdx: number, styleExpr: string): string {
  const panelIdx = source.indexOf('<Panel', returnIdx)
  if (panelIdx < 0) return source
  const tagEnd = source.indexOf('>', panelIdx)
  if (tagEnd < 0) {
    throw new ExtendUnrepresentableError('inner Panel tag is not closed')
  }
  const tag = source.slice(panelIdx, tagEnd)
  if (tag.includes(`style={${styleExpr}}`)) return source
  if (/\bstyle=\{/.test(tag)) {
    throw new ExtendUnrepresentableError(
      'inner Panel already has a style= binding — refuse to guess a merge',
    )
  }
  const insertAt = panelIdx + '<Panel'.length
  return `${source.slice(0, insertAt)}\n        style={${styleExpr}}${source.slice(insertAt)}`
}

export function applyExtendToComponentSource(
  source: string,
  type: string,
  extendsList: PrimitiveExtend[],
): string {
  if (!isSafeTypeIdent(type) || extendsList.length === 0) {
    throw new ExtendUnrepresentableError('Nothing to extend')
  }
  if (!source.includes(`export type ${type}Props = {`)) {
    throw new ExtendUnrepresentableError(
      `${type} is not a single Props object (union or missing type) — Dev-track`,
    )
  }
  if (!source.includes(`export function ${type}(`)) {
    throw new ExtendUnrepresentableError(`${type} function export not found`)
  }

  let next = source
  const typeNeedle = `export type ${type}Props = {`
  const typeStart = next.indexOf(typeNeedle)
  const afterType = next.slice(typeStart + typeNeedle.length)
  const closeObj = afterType.search(/\n\}(?:\s*&|\s*\n)/)
  if (closeObj < 0) {
    throw new ExtendUnrepresentableError(`${type} Props object close not found`)
  }
  const closeAbs = typeStart + typeNeedle.length + closeObj
  let typeBlock = next.slice(typeStart, closeAbs)
  for (const ext of extendsList) {
    if (new RegExp(`\\b${ext.name}\\?:`).test(typeBlock)) continue
    const line = `  ${ext.name}?: ${tsUnion(ext)}\n`
    next = `${next.slice(0, closeAbs)}\n${line}${next.slice(closeAbs)}`
    typeBlock += line
  }

  const fnStart = next.indexOf(`export function ${type}({`)
  if (fnStart < 0) {
    throw new ExtendUnrepresentableError(`${type} does not destructure props — cannot patch`)
  }
  const restIdx = next.indexOf('...rest', fnStart)
  const fnClose = next.indexOf(`}: ${type}Props`, fnStart)
  if (restIdx < 0 || fnClose < 0 || restIdx > fnClose) {
    throw new ExtendUnrepresentableError(`${type} destructure has no ...rest before Props close`)
  }
  const insertNames = ['style', ...extendsList.map((e) => e.name)].filter(
    (name) => !new RegExp(`\\b${name}\\s*[,=]`).test(next.slice(fnStart, restIdx)),
  )
  if (insertNames.length) {
    const insert = `${insertNames.join(',\n  ')},\n  `
    next = `${next.slice(0, restIdx)}${insert}${next.slice(restIdx)}`
  }

  const returnIdx = next.indexOf('return', fnStart)
  const restJsx = returnIdx >= 0 ? next.indexOf('{...rest}', returnIdx) : -1
  if (restJsx < 0) {
    throw new ExtendUnrepresentableError(`${type} root does not spread ...rest`)
  }
  const styleExpr = styleMergeExpr(extendsList)
  const beforeRest = next.slice(Math.max(returnIdx, restJsx - 160), restJsx)
  if (!beforeRest.includes(`style={${styleExpr}}`)) {
    if (/\bstyle=\{/.test(beforeRest)) {
      throw new ExtendUnrepresentableError(
        `${type} root already has a style= binding — refuse to guess a merge`,
      )
    }
    next = `${next.slice(0, restJsx)}style={${styleExpr}} ${next.slice(restJsx)}`
  }

  return applyStyleOnInnerPanel(next, returnIdx, styleExpr)
}

export function renderExtendTest(input: {
  type: string
  extendsList: PrimitiveExtend[]
}): string {
  const type = input.type
  if (!isSafeTypeIdent(type)) {
    throw new ExtendUnrepresentableError(`Unsafe type ident: ${type}`)
  }
  const first = input.extendsList[0]
  const argEntries = input.extendsList.map((ext) => `    ${ext.name}: '${ext.value}',`).join('\n')
  const expectStyle = first
    ? `  expect(el.style.${first.cssProperty}).toBe('${first.value}')`
    : ''
  return `import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ${type} } from './${type}'

describe('${type} promoted extend', () => {
  it('applies Creation inspector chrome as a named prop', () => {
    const { container } = render(
      <${type}
${argEntries}
      >
        ${type}
      </${type}>,
    )
    const el = container.firstElementChild as HTMLElement
${expectStyle}
  })
})
`
}
