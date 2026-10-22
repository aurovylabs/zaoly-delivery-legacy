/** Serialized Site Kit tree node (framework-neutral). */
export type SiteKitCompositionNode = {
  type: string
  name?: string
  props?: Record<string, unknown>
  style?: Record<string, string | number>
  tokenBindings?: Record<string, string>
  children?: SiteKitCompositionNode[]
}

export type CompositionNamedVariant = {
  id: string
  name: string
  composition: SiteKitCompositionNode
  /** Phase 3 cell combination (axisId → value). */
  combination?: Record<string, string>
}

/** Phase 3 Component Set axis on composition override / CSF. */
export type CompositionMasterAxis = {
  id: string
  name: string
  values: string[]
}

export type SiteKitCatalogEntry = {
  id: string
  exportName: string
}
