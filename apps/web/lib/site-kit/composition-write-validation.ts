/**
 * Client-safe Site Kit composition validation (browser + server).
 * Shared logic lives in `@zaoly/site-kit/composition-codegen`.
 */
import {
  compositionCatalogKey,
  compositionComponentId,
  compositionMasterSourceKey,
  compositionScopeKey,
  compositionVariantStoryName,
  normalizeCompositionName,
  storyExportName,
  validateCompositionName as validateCompositionNameCore,
  validateCompositionTree as validateCompositionTreeCore,
  validateNamedCompositionVariants as validateNamedCompositionVariantsCore,
} from '@zaoly/site-kit/composition-codegen'
import { SITE_KIT_CATALOG } from './site-kit-catalog'
import type { SiteKitCompositionNode } from './sync-tree'

export type CompositionNamedVariant = {
  id: string
  name: string
  composition: SiteKitCompositionNode
  combination?: Record<string, string>
}

export type CompositionMasterAxis = {
  id: string
  name: string
  values: string[]
}

export {
  compositionCatalogKey,
  compositionComponentId,
  compositionMasterSourceKey,
  compositionScopeKey,
  compositionVariantStoryName,
  normalizeCompositionName,
  storyExportName,
}

export function validateCompositionName(
  raw: string,
): { ok: true; exportName: string } | { ok: false; code: string; error: string } {
  return validateCompositionNameCore(raw, SITE_KIT_CATALOG)
}

export function validateCompositionTree(
  root: SiteKitCompositionNode,
): { ok: true } | { ok: false; code: string; error: string } {
  return validateCompositionTreeCore(root, SITE_KIT_CATALOG)
}

export function validateNamedCompositionVariants(
  variants: CompositionNamedVariant[],
  exportName: string,
): { ok: true } | { ok: false; code: string; error: string } {
  return validateNamedCompositionVariantsCore(variants, exportName)
}
