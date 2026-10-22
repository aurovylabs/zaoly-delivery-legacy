'use client'

import { useMemo } from 'react'
import { TokenPicker, type TokenPickerOption } from '../../lib/zaoly-ui'
import { GOOGLE_FONT_PICKER_OPTIONS } from '../../lib/fonts/google-font-catalog'
import {
  HUD_FONT_SIZE_PRESETS,
  hudFontSizeLiteralPath,
} from '../../lib/inspect/hud-font-size-presets'
import {
  HUD_FONT_WEIGHT_PRESETS,
  hudFontWeightLiteralPath,
} from '../../lib/inspect/hud-font-weight-presets'
import {
  HUD_LENGTH_PRESETS,
  hudLengthLiteralPath,
} from '../../lib/inspect/hud-length-presets'
import {
  previewForBinding,
  tokenDisplayLabel,
  tokenPickerOptionLabel,
  tokensForGroup,
  type InspectTokenOption,
} from '../../lib/inspect/token-catalog'
import type { KitPropsTokenSlot } from '../../lib/site-kit/kit-props-token-slots'
import { resolveKitPropsPickerPath } from '../../lib/site-kit/kit-props-picker-write'

const TYPE_FACET_GROUPS = new Set(['fontFamily', 'fontSize', 'fontWeight'])

function shortFontFamilyCss(css: string): string {
  const first = css.split(',')[0]?.trim() ?? css
  return first.replace(/^['"]+|['"]+$/g, '')
}

/** Build TokenPicker options including HUD presets (exported for tests). */
export function buildKitPropsTokenOptions(
  slot: KitPropsTokenSlot,
  catalog: readonly InspectTokenOption[],
): TokenPickerOption[] {
  const list = [...catalog]
  if (TYPE_FACET_GROUPS.has(slot.group)) {
    const cleaned = list
      .filter((tok) => {
        if (tok.status === 'pending') return false
        if (!tok.path.startsWith('typography.')) return false
        return Boolean(previewForBinding(tok, slot.bindingKey))
      })
      .map((tok) => {
        const facetPreview = previewForBinding(tok, slot.bindingKey)
        return {
          path: tok.path,
          label: tokenDisplayLabel(tok),
          category: tok.group,
          preview: facetPreview || tok.preview || undefined,
          sampleStyle:
            slot.group === 'fontSize' && facetPreview
              ? { fontSize: `min(1.05rem, ${facetPreview})` }
              : slot.group === 'fontWeight' && facetPreview
                ? { fontWeight: facetPreview }
                : undefined,
          fontPreview:
            slot.group === 'fontFamily' && facetPreview
              ? shortFontFamilyCss(facetPreview)
              : undefined,
        }
      })
    if (slot.group === 'fontFamily') {
      return [...cleaned, ...GOOGLE_FONT_PICKER_OPTIONS]
    }
    if (slot.group === 'fontSize') {
      const presets: TokenPickerOption[] = HUD_FONT_SIZE_PRESETS.map((css) => ({
        path: hudFontSizeLiteralPath(css),
        label: css,
        category: 'fontSize',
        sampleStyle: { fontSize: `min(1.05rem, ${css})` },
      }))
      return [...presets, ...cleaned]
    }
    if (slot.group === 'fontWeight') {
      const presets: TokenPickerOption[] = HUD_FONT_WEIGHT_PRESETS.map((w) => ({
        path: hudFontWeightLiteralPath(w),
        label: w,
        category: 'fontWeight',
        sampleStyle: { fontWeight: w },
      }))
      return [...presets, ...cleaned]
    }
  }
  const groupOpts = tokensForGroup(slot.group, list).map((tok) => {
    const facetPreview = previewForBinding(tok, slot.bindingKey)
    return {
      path: tok.path,
      label: tokenPickerOptionLabel(tok, slot.bindingKey, facetPreview),
      category: tok.group,
      preview: facetPreview || tok.preview || undefined,
    }
  })
  if (slot.group === 'space' || slot.group === 'radius') {
    const presets: TokenPickerOption[] = HUD_LENGTH_PRESETS.map((css) => ({
      path: hudLengthLiteralPath(css),
      label: css,
      category: slot.group,
    }))
    return [...presets, ...groupOpts]
  }
  return groupOpts
}

/** Compact TokenPicker row for Kit Props bindable style slots. */
export function KitPropsTokenField({
  slot,
  boundPath,
  literalValue,
  tokenCatalog,
  onPickToken,
  onLiteral,
  onClear,
}: {
  slot: KitPropsTokenSlot
  boundPath: string
  literalValue: string
  tokenCatalog: readonly InspectTokenOption[]
  onPickToken: (path: string) => void
  onLiteral: (raw: string) => void
  onClear: () => void
}) {
  const options = useMemo(
    () => buildKitPropsTokenOptions(slot, tokenCatalog),
    [slot, tokenCatalog],
  )
  const suggestedPaths = useMemo(
    () => options.filter((o) => !o.path.includes(':')).map((o) => o.path),
    [options],
  )
  const isColor = slot.group === 'color'

  return (
    <li className="creation-kit-props__token-row" data-testid={`kit-props-token-${slot.styleKey}`}>
      <span className="creation-kit-props__key">{slot.styleKey}</span>
      <div className="creation-kit-props__token-picker" data-testid={`kit-props-token-picker-${slot.styleKey}`}>
        <TokenPicker
          variant="compact"
          browser={isColor}
          allowLiteral
          allowNone
          previewKind={slot.previewKind}
          options={options}
          value={boundPath || null}
          literalValue={boundPath ? '' : literalValue}
          suggestedPaths={suggestedPaths}
          label={slot.styleKey}
          aria-label={slot.styleKey}
          onChange={(path) => {
            const write = resolveKitPropsPickerPath(path)
            if (write.kind === 'literal') onLiteral(write.value)
            else onPickToken(write.path)
          }}
          onLiteralChange={onLiteral}
          onClear={onClear}
        />
      </div>
    </li>
  )
}
