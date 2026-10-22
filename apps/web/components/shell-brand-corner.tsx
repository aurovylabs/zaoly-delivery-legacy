'use client'

import { BrandCorner } from '../lib/zaoly-ui-shell'
import { paths } from '../lib/paths'
import { ZaolySealMark } from './zaoly-seal-mark'

/**
 * Top-right BrandCorner — seal only (造), fills the plaque.
 * No product menu, no label reveal / hover expand (standalone Zaoly).
 */
export function ShellBrandCorner({ logoOnly: _logoOnly = false }: { logoOnly?: boolean }) {
  const seal = <ZaolySealMark size={28} />

  return (
    <BrandCorner
      label=""
      mark={seal}
      showLogo
      labelReveal="always"
      borderRadius={paths.brandCornerRadiusPx}
      aria-label={paths.brandLabel}
      data-testid={_logoOnly ? 'brand-corner-preview' : 'brand-corner'}
      className="brand-corner--seal-only"
    />
  )
}
