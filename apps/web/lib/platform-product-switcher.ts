import type { ProductSwitcherItem } from '../../../packages/ui/src/components/ProductSwitcherPanel'

/**
 * Suite product launcher — retired on Zaoly standalone.
 * ShellBrandCorner does not mount a menu; keep empty for any residual callers.
 * Spec: `knowledge/suite-federation-out-of-scope-for-zaoly.md`
 */
export function getStaticProductSwitcherItems(): ProductSwitcherItem[] {
  return []
}

/** @deprecated suite catalog — always null on Zaoly. */
export function suiteProductsCatalogUrl(): string | null {
  return null
}
