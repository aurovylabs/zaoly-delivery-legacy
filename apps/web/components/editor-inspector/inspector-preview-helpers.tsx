import type { ReactNode } from 'react'
import type { TokenPreviewKind, TokenKindGlyphId } from '@zaoly/ui'
import { TokenKindGlyph } from '@zaoly/ui'
import type { InspectFieldDef } from '../../lib/inspect/field-catalog'
import type { TokenGroupId } from '../../lib/inspect/token-catalog'
import { inspectPropIcon } from '../../lib/inspect/icons'

export function previewKindForGroup(group: TokenGroupId): TokenPreviewKind {
  if (group === 'color') return 'color'
  if (group === 'space') return 'space'
  if (group === 'radius') return 'radius'
  if (group === 'opacity') return 'opacity'
  if (group === 'size') return 'size'
  if (group === 'shadow') return 'shadow'
  if (
    group === 'fontFamily' ||
    group === 'fontSize' ||
    group === 'fontWeight' ||
    group === 'lineHeight' ||
    group === 'letterSpacing'
  ) {
    return 'type'
  }
  return 'auto'
}

export function scopeLabelForGroup(group: TokenGroupId): string {
  if (group === 'space') return 'Spacing'
  if (
    group === 'fontFamily' ||
    group === 'fontSize' ||
    group === 'fontWeight' ||
    group === 'lineHeight' ||
    group === 'letterSpacing'
  ) {
    return 'Type'
  }
  return group.charAt(0).toUpperCase() + group.slice(1)
}

export const TYPOGRAPHY_PICKER_GROUPS = new Set<TokenGroupId>([
  'fontFamily',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
])

/** TokenPicker / Field leading icon for bound inspect fields. */
export function tokenKindForInspectGroup(group: TokenGroupId): TokenKindGlyphId {
  if (group === 'color') return 'color'
  if (group === 'space') return 'space'
  if (group === 'radius') return 'radius'
  if (group === 'opacity') return 'opacity'
  if (group === 'size') return 'size'
  if (group === 'shadow') return 'shadow'
  if (TYPOGRAPHY_PICKER_GROUPS.has(group)) return 'type'
  return 'all'
}

export function inspectFieldIcon(field: InspectFieldDef): ReactNode {
  if (field.kind === 'token' && field.tokenGroup) {
    return <TokenKindGlyph id={tokenKindForInspectGroup(field.tokenGroup)} />
  }
  return inspectPropIcon(field.name)
}
