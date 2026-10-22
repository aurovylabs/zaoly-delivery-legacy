/**
 * Playground source seed + developer handoff helpers.
 * Spec: `specs/domain/site-kit-playground.md` (SK-V10 / SK-V11)
 */
import {
  compositionPackageImportPath,
  compositionStoryTitle,
  generateCompositionModule,
  SITE_KIT_ALLOWED_PROPS,
  SITE_KIT_PACKAGE_NAME,
  type SiteKitCompositionNode,
} from '@zaoly/site-kit/composition-codegen'
import { SITE_KIT_CATALOG } from './site-kit-catalog'
import { siteKitAtomPreviewNode } from '../library/site-kit-atom-preview-nodes'
import type { SiteKitOverrideBody } from './override-store'
import { paths } from '../paths'
import { isRealPlatformProjectId } from '../platform-project-id'

export type PlaygroundHandoffFields = {
  packageName: string
  importPath: string
  installCommand: string
  usageImport: string
  allowedProps: string[]
  rootType: string | null
}

/** SK-V11 maintainer metadata (read-only). */
export type PlaygroundMaintainerFields = {
  updatedAt: string | null
  kitRevision: string
  storyTitle: string
  variantCount: number
  defaultVariantId: string | null
  /** Phase 3 Component Set axis count on the override (0 when flat named variants). */
  axisCount: number
}

export type PlaygroundSourceKind = 'atom' | 'pattern' | 'section'

export type PlaygroundSourcePayload = {
  ok: true
  componentId: string
  kind: PlaygroundSourceKind
  exportName: string
  source: string
  composition: SiteKitCompositionNode
  platformProjectId?: string | null
} & PlaygroundHandoffFields &
  PlaygroundMaintainerFields

/** Atom JSX in the expanded seed always imports from the package barrel. */
export const PLAYGROUND_ATOM_COMPONENTS_IMPORT = SITE_KIT_PACKAGE_NAME

export function kitRevisionForOverride(
  componentId: string,
  updatedAt: string | null | undefined,
): string {
  if (updatedAt?.trim()) return `override:${updatedAt.trim()}`
  return `catalog:${componentId}`
}

export function consumerImportPath(options: {
  kind: PlaygroundSourceKind
  exportName: string
  platformProjectId?: string | null
}): string {
  if (
    options.kind === 'pattern' &&
    options.platformProjectId &&
    isRealPlatformProjectId(options.platformProjectId)
  ) {
    return compositionPackageImportPath(options.exportName, options.platformProjectId)
  }
  return paths.siteKitPackageName
}

export function buildPlaygroundHandoff(options: {
  kind: PlaygroundSourceKind
  exportName: string
  composition: SiteKitCompositionNode
  platformProjectId?: string | null
}): PlaygroundHandoffFields {
  const packageName = paths.siteKitPackageName
  const importPath = consumerImportPath(options)
  const rootType = options.composition.type ?? null
  const allowed = rootType ? SITE_KIT_ALLOWED_PROPS[rootType] : undefined
  const usageImport =
    options.kind === 'section'
      ? `// Starter section — Save as Site Kit component in the editor to publish a Pattern.\n// import { ${options.exportName} } from '${importPath}'`
      : `import { ${options.exportName} } from '${importPath}'`
  return {
    packageName,
    importPath,
    installCommand: `pnpm add ${packageName}`,
    usageImport,
    allowedProps: allowed ? [...allowed].sort() : [],
    rootType,
  }
}

export function buildPlaygroundMaintainer(options: {
  componentId: string
  exportName: string
  platformProjectId?: string | null
  updatedAt?: string | null
  storyTitle?: string | null
  variants?: { id: string; name: string }[] | null
  defaultVariantId?: string | null
  axes?: { id: string; name: string; values: string[] }[] | null
}): PlaygroundMaintainerFields {
  const updatedAt = options.updatedAt?.trim() || null
  return {
    updatedAt,
    kitRevision: kitRevisionForOverride(options.componentId, updatedAt),
    storyTitle:
      options.storyTitle?.trim() ||
      compositionStoryTitle(options.exportName, options.platformProjectId),
    variantCount: Array.isArray(options.variants) ? options.variants.length : 0,
    defaultVariantId: options.defaultVariantId?.trim() || null,
    axisCount: Array.isArray(options.axes) ? options.axes.length : 0,
  }
}

export function exportNameForCatalogId(componentId: string): string | null {
  const hit = SITE_KIT_CATALOG.find((e) => e.id === componentId)
  return hit?.exportName ?? null
}

export function buildAtomPlaygroundSeed(
  componentId: string,
  override: SiteKitOverrideBody | null,
): PlaygroundSourcePayload | null {
  const entry = SITE_KIT_CATALOG.find((e) => e.id === componentId)
  if (!entry) return null
  const fromOverride =
    override?.composition && typeof override.composition === 'object'
      ? (override.composition as SiteKitCompositionNode)
      : null
  const composition = fromOverride ?? siteKitAtomPreviewNode(componentId)
  if (!composition) return null
  const source = generateCompositionModule(entry.exportName, composition, SITE_KIT_CATALOG, {
    headerComment:
      '/** CREATION Kit Playground seed — ephemeral edits are not saved. */',
    componentsImportPath: PLAYGROUND_ATOM_COMPONENTS_IMPORT,
  })
  const platformProjectId = override?.platformProjectId ?? null
  const handoff = buildPlaygroundHandoff({
    kind: 'atom',
    exportName: entry.exportName,
    composition,
    platformProjectId,
  })
  const maintainer = buildPlaygroundMaintainer({
    componentId,
    exportName: entry.exportName,
    platformProjectId,
    updatedAt: override?.updatedAt,
    storyTitle: override?.storyTitle,
    variants: override?.variants,
    defaultVariantId: override?.defaultVariantId,
    axes: override?.axes,
  })
  return {
    ok: true,
    componentId,
    kind: 'atom',
    exportName: entry.exportName,
    source,
    composition,
    platformProjectId,
    ...handoff,
    ...maintainer,
  }
}

export function buildPatternPlaygroundSeed(options: {
  componentId: string
  exportName: string
  composition: SiteKitCompositionNode
  platformProjectId?: string | null
  updatedAt?: string | null
  storyTitle?: string | null
  variants?: SiteKitOverrideBody['variants']
  defaultVariantId?: string | null
  axes?: SiteKitOverrideBody['axes']
}): PlaygroundSourcePayload {
  // Expanded sandbox TSX still imports atoms from the barrel (preview/transpile).
  const source = generateCompositionModule(
    options.exportName,
    options.composition,
    SITE_KIT_CATALOG,
    {
      headerComment:
        '/** CREATION Kit Playground seed — ephemeral edits are not saved. */',
      componentsImportPath: PLAYGROUND_ATOM_COMPONENTS_IMPORT,
    },
  )
  const handoff = buildPlaygroundHandoff({
    kind: 'pattern',
    exportName: options.exportName,
    composition: options.composition,
    platformProjectId: options.platformProjectId,
  })
  const maintainer = buildPlaygroundMaintainer({
    componentId: options.componentId,
    exportName: options.exportName,
    platformProjectId: options.platformProjectId,
    updatedAt: options.updatedAt,
    storyTitle: options.storyTitle,
    variants: options.variants,
    defaultVariantId: options.defaultVariantId,
    axes: options.axes,
  })
  return {
    ok: true,
    componentId: options.componentId,
    kind: 'pattern',
    exportName: options.exportName,
    source,
    composition: options.composition,
    platformProjectId: options.platformProjectId ?? null,
    ...handoff,
    ...maintainer,
  }
}
