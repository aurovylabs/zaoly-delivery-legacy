'use client'

import { paths } from '../../lib/paths'
import { ZaolySealMark } from '../zaoly-seal-mark'

/**
 * Product brand mark — CD seal (造 on cobalt) + Spectral wordmark.
 * `zen` = larger / lässiger hub presence; `compact` = editor topbar.
 */
export function EditorBrandMark({ tone = 'compact' }: { tone?: 'compact' | 'zen' }) {
  const name = paths.brandLabel
  const sealSize = tone === 'zen' ? 34 : 22
  return (
    <span
      className={tone === 'zen' ? 'editor__brand editor__brand--zen' : 'editor__brand'}
      data-testid="product-brand"
      data-brand-tone={tone}
      aria-label={name}
    >
      <ZaolySealMark size={sealSize} />
      <span className="editor__brand-wordmark">{name}</span>
    </span>
  )
}
