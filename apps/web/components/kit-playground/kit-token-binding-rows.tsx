'use client'

import { Text, TokenKindGlyph, TokenPreview, tokenKindGlyphId } from '@zaoly/ui'
import type { TokenPreviewKind } from '@zaoly/ui'
import { tokenPathToCssVar } from '@zaoly/site-kit/composition-codegen'
import type { InspectTokenOption } from '../../lib/inspect/token-catalog'

export type KitTokenBindingEntry = {
  /** Style / prop slot key when known (Props pane). */
  slotKey?: string
  path: string
}

export type KitTokenBindingRowModel = {
  key: string
  slotKey?: string
  path: string
  cssVar: string
  preview: string
  type?: string
  kind: TokenPreviewKind | null
}

export function previewKindForTokenType(type: string | undefined): TokenPreviewKind | null {
  if (!type) return null
  const id = tokenKindGlyphId(type)
  if (
    id === 'color' ||
    id === 'space' ||
    id === 'radius' ||
    id === 'size' ||
    id === 'opacity' ||
    id === 'type' ||
    id === 'shadow'
  ) {
    return id
  }
  return null
}

export function resolveTokenBindingRows(
  entries: readonly KitTokenBindingEntry[],
  tokenCatalog: readonly InspectTokenOption[],
): KitTokenBindingRowModel[] {
  const byPath = new Map<string, InspectTokenOption>()
  for (const opt of tokenCatalog) {
    if (opt.path?.trim()) byPath.set(opt.path.trim(), opt)
  }
  return entries.map((entry) => {
    const path = entry.path.trim()
    const opt = byPath.get(path)
    const preview = opt?.preview?.trim() || '—'
    const type = opt?.type
    return {
      key: entry.slotKey ? `${entry.slotKey}:${path}` : path,
      slotKey: entry.slotKey,
      path,
      cssVar: tokenPathToCssVar(path),
      preview,
      type,
      kind: previewKindForTokenType(type),
    }
  })
}

/** Shared swatch / path / `--ds-*` rows for Kit Props + Handoff (SK-V16). */
export function KitTokenBindingRows({
  rows,
  testIdPrefix,
}: {
  rows: readonly KitTokenBindingRowModel[]
  testIdPrefix: string
}) {
  if (rows.length === 0) return null
  return (
    <ul className="creation-kit-token-list" data-testid={`${testIdPrefix}-list`}>
      {rows.map((row) => (
        <li
          key={row.key}
          className="creation-kit-token-row"
          data-testid={`${testIdPrefix}-${row.slotKey ?? row.path}`}
        >
          <span className="creation-kit-token-swatch" aria-hidden>
            {row.kind === 'color' && /^#[0-9a-fA-F]{3,8}$/.test(row.preview) ? (
              <span
                className="creation-kit-token-swatch-fill"
                style={{ background: row.preview }}
              />
            ) : row.kind && row.preview !== '—' ? (
              <TokenPreview kind={row.kind} value={row.preview} size="sm" />
            ) : (
              <TokenKindGlyph id={tokenKindGlyphId(row.type || 'color')} />
            )}
          </span>
          <div className="creation-kit-token-meta">
            {row.slotKey ? (
              <span className="creation-kit-token-slot">{row.slotKey}</span>
            ) : null}
            <code className="creation-kit-token-path" title={row.path}>
              {row.path}
            </code>
            <code className="creation-kit-token-var">{row.cssVar}</code>
          </div>
          <Text role="meta" as="p" className="creation-kit-token-preview">
            {row.preview}
          </Text>
        </li>
      ))}
    </ul>
  )
}
