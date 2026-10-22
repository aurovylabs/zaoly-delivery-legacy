/**
 * Eng copy-pack for editor ⌘E (module + install/import + token pack CSS + Kit link).
 * Spec: code-export-handoff.md · zaoly-webdesign-cleanup.md W1
 */
import type { SceneMaster, SceneNode } from '@zaoly/contracts'
import type { InspectTokenOption, ZaolyPackLeaf } from '../inspect/token-catalog'
import { paths } from '../paths'
import { tokenPackCssForHandoff } from '../site-kit/zaoly-pack-ds-css'
import {
  formatMediaBreakpointCssVars,
  formatMediaBreakpointQueries,
} from '../tokens/media-breakpoints'
import { defaultMediaBreakpointLeaves } from '../tokens/media-breakpoints'
import {
  prepareSiteKitExportRoot,
  sceneNodeToSiteKitComposition,
  type ReactExportConsumer,
} from './codegen-react'

export type ExportCopyPackParts = {
  kitLink: string
  installCommand: string
  usageImport: string
  tokenPackCss: string
  /** Pack CSS media thresholds + @media stubs (Zaoly web design). */
  mediaBreakpointCss: string
  moduleSource: string
  consumer: ReactExportConsumer
  intentMarkdown?: string
}

/** First package import line from a generated module (if any). */
export function extractPackageImportLine(moduleSource: string): string {
  const match = moduleSource.match(/^import\s+\{[^}]+\}\s+from\s+['"][^'"]+['"];?/m)
  return match?.[0]?.trim() ?? ''
}

export function installCommandForConsumer(consumer: ReactExportConsumer): string {
  if (consumer === 'zaoly-ui') return 'pnpm add @zaoly/ui'
  return `pnpm add ${paths.siteKitPackageName}`
}

/**
 * Resolve token pack `:root { --ds-* }` for the export target (Site Kit coerce path).
 * Empty when catalog cannot resolve bindings.
 */
export function tokenPackCssForExportTarget(
  target: SceneNode,
  catalog: readonly InspectTokenOption[] | undefined,
  masters?: SceneMaster[] | null,
): string {
  if (!catalog?.length) return ''
  const prepared = prepareSiteKitExportRoot(target, masters)
  const composition = sceneNodeToSiteKitComposition(prepared)
  return tokenPackCssForHandoff(catalog, composition)
}

/** Absolute Kit URL when running in a browser; else staging Creation origin + path. */
export function resolveExportKitAbsoluteUrl(kitHref: string): string {
  const href = kitHref.startsWith('/') ? kitHref : `/${kitHref}`
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${href}`
  }
  return `${paths.ecosystemStagingZaoly}${href}`
}

/** Media vars + @media stubs from pack leaves (seeds when pack omitted). */
export function mediaBreakpointCssForExport(
  leaves?: readonly ZaolyPackLeaf[] | null,
): string {
  const pack = leaves?.length ? leaves : defaultMediaBreakpointLeaves()
  const vars = formatMediaBreakpointCssVars(pack)
  const root = [':root {', ...vars, '}'].join('\n')
  const queries = formatMediaBreakpointQueries(pack)
  return queries ? `${root}\n\n${queries}` : root
}

export function buildExportCopyPackParts(input: {
  moduleSource: string
  kitHref: string
  consumer: ReactExportConsumer
  tokenPackCss: string
  mediaBreakpointCss?: string
  packLeaves?: readonly ZaolyPackLeaf[] | null
  kitAbsoluteUrl?: string
  intentMarkdown?: string
}): ExportCopyPackParts {
  return {
    kitLink: input.kitAbsoluteUrl?.trim() || resolveExportKitAbsoluteUrl(input.kitHref),
    installCommand: installCommandForConsumer(input.consumer),
    usageImport: extractPackageImportLine(input.moduleSource),
    tokenPackCss: input.tokenPackCss.trim(),
    mediaBreakpointCss: (
      input.mediaBreakpointCss?.trim() || mediaBreakpointCssForExport(input.packLeaves)
    ).trim(),
    moduleSource: input.moduleSource.trim(),
    consumer: input.consumer,
    intentMarkdown: input.intentMarkdown?.trim() || undefined,
  }
}

/** Markdown clipboard pack eng can paste into a PR / ticket. */
export function formatExportCopyPack(parts: ExportCopyPackParts): string {
  const css =
    parts.tokenPackCss ||
    '/* no token pack --ds-* digital leaves resolved for this target */'
  const media =
    parts.mediaBreakpointCss ||
    '/* no media.breakpoint.* leaves */'
  const usage = parts.usageImport || '/* no package import line in module */'
  const sections = ['# Zaoly eng pack', '']
  if (parts.intentMarkdown) {
    sections.push('## Intent', parts.intentMarkdown, '')
  }
  sections.push(
    '## Kit',
    parts.kitLink,
    '',
    '## Install',
    parts.installCommand,
    '',
    '## Import',
    usage,
    '',
    '## Token pack CSS',
    css,
    '',
    '## Media breakpoints',
    media,
    '',
    '## Module',
    parts.moduleSource,
    '',
  )
  return sections.join('\n')
}

export function buildExportCopyPack(input: {
  moduleSource: string
  kitHref: string
  consumer: ReactExportConsumer
  tokenPackCss: string
  mediaBreakpointCss?: string
  packLeaves?: readonly ZaolyPackLeaf[] | null
  kitAbsoluteUrl?: string
  intentMarkdown?: string
}): string {
  return formatExportCopyPack(buildExportCopyPackParts(input))
}
