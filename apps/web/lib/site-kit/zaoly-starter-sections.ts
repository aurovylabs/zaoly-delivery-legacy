/**
 * Zaoly starter landing section Masters in Kit Playground (read-only browse).
 * Spec: site-kit-playground.md SK-V22 · knowledge/zaoly-landing-section-masters.md
 */
import type { CompositionScene } from '@zaoly/contracts'
import {
  generateCompositionModule,
  type SiteKitCompositionNode,
} from '@zaoly/site-kit/composition-codegen'
import { coerceEditorNodeToSiteKit } from './coerce-editor-tree-to-site-kit'
import { validateSiteKitExportSceneRoot } from './master-kit-export'
import {
  PLAYGROUND_ATOM_COMPONENTS_IMPORT,
  buildPlaygroundHandoff,
  type PlaygroundSourcePayload,
} from './playground-source'
import { SITE_KIT_CATALOG } from './site-kit-catalog'
import { serializeSiteKitComposition } from './sync-tree'
import { seedEditorPrefillMasters } from '../scene/editor-master-prefill'
import {
  ZAOLY_LANDING_SECTION_EXPORT_NAMES,
  zaolyLandingSectionPaletteItems,
  zaolyLandingSectionSourceKey,
  type ZaolyLandingSectionExportName,
} from '../scene/zaoly-landing-section-catalog'

export type ZaolyStarterSectionNavEntry = {
  componentId: string
  exportName: ZaolyLandingSectionExportName
  label: string
}

/** Playground componentId === scene Master `sourceKey` (`Composition:LandingNav`). */
export function isZaolyStarterSectionComponentId(componentId: string): boolean {
  const id = componentId.trim()
  return ZAOLY_LANDING_SECTION_EXPORT_NAMES.some(
    (name) => zaolyLandingSectionSourceKey(name) === id,
  )
}

export function zaolyStarterSectionExportName(
  componentId: string,
): ZaolyLandingSectionExportName | null {
  const id = componentId.trim()
  for (const name of ZAOLY_LANDING_SECTION_EXPORT_NAMES) {
    if (zaolyLandingSectionSourceKey(name) === id) return name
  }
  return null
}

export function zaolyStarterSectionNavEntries(): ZaolyStarterSectionNavEntry[] {
  return zaolyLandingSectionPaletteItems().map((item) => {
    const exportName = item.insertType.replace(/^Composition:/, '') as ZaolyLandingSectionExportName
    return {
      componentId: item.insertType,
      exportName,
      label: item.label,
    }
  })
}

/** Stable stamp — Library prerender must not call `new Date()` in client trees (Next Cache Components). */
const STARTER_SEED_UPDATED_AT = '1970-01-01T00:00:00.000Z'

function emptySeedScene(): CompositionScene {
  return {
    id: 'playground-starter-sections',
    name: 'Playground starter sections',
    version: 1,
    root: { id: 'root', type: 'Stack', children: [] },
    updatedAt: STARTER_SEED_UPDATED_AT,
  }
}

/** Expand section Master tree → Site Kit composition for playground preview. */
export function buildStarterSectionPlaygroundSeed(
  componentId: string,
): PlaygroundSourcePayload | null {
  const exportName = zaolyStarterSectionExportName(componentId)
  if (!exportName) return null
  const sourceKey = zaolyLandingSectionSourceKey(exportName)
  const seeded = seedEditorPrefillMasters(emptySeedScene())
  const master = (seeded.masters ?? []).find((m) => m.sourceKey === sourceKey)
  if (!master) return null

  const validated = validateSiteKitExportSceneRoot(master.root, seeded.masters)
  if (!validated.ok) return null
  const coerced = coerceEditorNodeToSiteKit(validated.root)
  const composition = serializeSiteKitComposition(coerced) as SiteKitCompositionNode

  const source = generateCompositionModule(exportName, composition, SITE_KIT_CATALOG, {
    headerComment:
      '/** Zaoly starter section — ephemeral Kit Playground seed. Not Site Kit SSOT. Save as Pattern from the editor to persist. */',
    componentsImportPath: PLAYGROUND_ATOM_COMPONENTS_IMPORT,
  })

  const handoff = buildPlaygroundHandoff({
    kind: 'section',
    exportName,
    composition,
    platformProjectId: null,
  })

  const variantCount = Array.isArray(master.variants) ? master.variants.length : 0

  return {
    ok: true,
    componentId: sourceKey,
    kind: 'section',
    exportName,
    source,
    composition,
    platformProjectId: null,
    ...handoff,
    updatedAt: null,
    kitRevision: `starter:${sourceKey}`,
    storyTitle: `Sections (starter)/${exportName}`,
    variantCount,
    defaultVariantId: master.defaultVariantId?.trim() || null,
    axisCount: Array.isArray(master.axes) ? master.axes.length : 0,
  }
}

/** Site Kit composition tree for Library / Kit mini previews (no Monaco source). */
export function starterSectionPreviewNode(
  componentId: string,
): SiteKitCompositionNode | null {
  return buildStarterSectionPlaygroundSeed(componentId)?.composition ?? null
}
