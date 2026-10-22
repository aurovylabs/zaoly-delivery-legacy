/** Phase-3 Component Set axis on Kit override / Write wire. */
export type KitMasterAxis = {
  id: string
  name: string
  values: string[]
}

/** Named cell on Kit override / Write wire. */
export type KitNamedVariantCell = {
  id: string
  name: string
  combination?: Record<string, string>
  composition?: Record<string, unknown>
}
