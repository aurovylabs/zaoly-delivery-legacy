'use client'

/**
 * Smart HUD token control — strip = icon button; menu = TokenPicker + literals.
 * Spec: `specs/domain/canvas-smart-hud.md` · Knowledge: `knowledge/hud-tokenpicker.md`
 */
import React, { useMemo, useState, type ComponentProps } from 'react'
import type { SceneNode, SceneOp } from '@zaoly/contracts'
import { TokenPicker, type TokenPickerOption } from '../lib/zaoly-ui'
import { INSPECT_UNSET_PLACEHOLDER } from '../lib/inspect/field-catalog'
import { useInspectTokenCatalog } from '../lib/inspect/token-catalog-context'
import {
  previewForBinding,
  tokenDisplayLabel,
  tokenPickerOptionLabel,
  tokensForGroup,
  type TokenGroupId,
} from '../lib/inspect/token-catalog'
import { loadTokenRecent, saveTokenRecent } from '../lib/inspect/token-recent'
import {
  buildHudTokenWriteOps,
  looksLikeTokenPath,
  nudgeCssLengthLiteral,
  nudgeFontWeightLiteral,
} from '../lib/inspect/resolve-hud-model'
import {
  previewKindForGroup,
  scopeLabelForGroup,
  TYPOGRAPHY_PICKER_GROUPS,
} from './editor-inspector/inspector-preview-helpers'
import { GOOGLE_FONT_PICKER_OPTIONS } from '../lib/fonts/google-font-catalog'
import {
  ensureGoogleFontStylesheet,
  parseGoogleFontLiteralPath,
} from '../lib/fonts/google-fonts'
import {
  HUD_FONT_SIZE_PRESETS,
  hudFontSizeLiteralPath,
  parseHudFontSizeLiteralPath,
} from '../lib/inspect/hud-font-size-presets'
import {
  HUD_FONT_WEIGHT_PRESETS,
  fontWeightSortKey,
  hudFontWeightLiteralPath,
  parseHudFontWeightLiteralPath,
} from '../lib/inspect/hud-font-weight-presets'
import {
  HUD_LENGTH_PRESETS,
  hudLengthLiteralPath,
  parseHudLengthLiteralPath,
} from '../lib/inspect/hud-length-presets'
import { useHudPromote } from './hud-promote-context'
import { inspectPropIcon } from '../lib/inspect/icons'

export type HudTokenGroup = Extract<
  TokenGroupId,
  'color' | 'fontFamily' | 'fontSize' | 'fontWeight' | 'space' | 'radius'
>

/** Typography facets live on token pack role leaves (`group: fontFamily`), not `fontSize.*`. */
const TYPE_FACET_GROUPS = new Set<HudTokenGroup>(['fontFamily', 'fontSize', 'fontWeight'])

/** Map a HUD token slot to its TokenPicker group. */
export function tokenGroupForHudSlot(
  control: 'tokenColor' | 'tokenType' | 'tokenLength',
  key: string,
): HudTokenGroup {
  if (control === 'tokenColor') return 'color'
  if (control === 'tokenLength') return key === 'radius' ? 'radius' : 'space'
  if (key === 'fontSize') return 'fontSize'
  if (key === 'fontWeight') return 'fontWeight'
  return 'fontFamily'
}

function literalPlaceholder(group: HudTokenGroup): string {
  if (group === 'fontSize') return '16px'
  if (group === 'fontWeight') return '400'
  if (group === 'fontFamily') return 'Inter'
  if (group === 'color') return '#000000'
  if (group === 'space' || group === 'radius') return '8px'
  return INSPECT_UNSET_PLACEHOLDER
}

/** First family from a CSS stack — for sample styling, not list labels. */
function shortFontFamilyCss(css: string): string {
  const first = css.split(',')[0]?.trim() ?? css
  return first.replace(/^['"]+|['"]+$/g, '')
}

function supportsNumericNudge(group: HudTokenGroup): boolean {
  return group === 'fontSize' || group === 'fontWeight' || group === 'space' || group === 'radius'
}

/** Rough sort key for CSS lengths (`0.78rem`, `16px`, `12pt`). */
function cssLengthSortKey(raw: string): number {
  const m = raw.trim().match(/^(-?[\d.]+)\s*(px|rem|em|pt)?$/i)
  if (!m) return Number.POSITIVE_INFINITY
  const n = Number(m[1])
  if (!Number.isFinite(n)) return Number.POSITIVE_INFINITY
  const unit = (m[2] || 'px').toLowerCase()
  if (unit === 'rem' || unit === 'em') return n * 16
  if (unit === 'pt') return n * (96 / 72)
  return n
}

export function HudTokenField({
  node,
  slotKey,
  label,
  tokenGroup,
  disabled,
  onOps,
  layout = 'field',
  menuExpanded = false,
  surface = 'auto',
}: {
  node: SceneNode
  slotKey: string
  label: string
  tokenGroup: HudTokenGroup
  disabled?: boolean
  onOps?: (ops: SceneOp[]) => void
  /** `menu` = craft accordion / split panel (hides Field chrome). */
  layout?: 'field' | 'menu'
  /** When layout=menu, keep the list open while the section is expanded. */
  menuExpanded?: boolean
  /**
   * `embedded-list` — always-open list (legacy craft rail).
   * `compact` — strip + popover list (HUD chips / property menus).
   * `auto` — browser for field color; compact popover otherwise.
   */
  surface?: 'auto' | 'embedded-list' | 'compact'
}) {
  const catalog = useInspectTokenCatalog()
  const [recentPaths, setRecentPaths] = useState(() => loadTokenRecent())

  const literalRaw = String(node.props?.[slotKey] ?? node.style?.[slotKey] ?? '')
  const literalValue =
    literalRaw && !looksLikeTokenPath(literalRaw) ? literalRaw : ''
  // Explicit prop/style literal wins over inherited Master token bindings (Instances).
  // Matches paint order in `resolveNodePaintStyle` (bindings then props).
  const boundPath = literalValue ? '' : (node.tokenBindings?.[slotKey] ?? '')

  const groupTokens = useMemo(() => tokensForGroup(tokenGroup, catalog), [catalog, tokenGroup])
  const suggestedPaths = useMemo(() => groupTokens.map((t) => t.path), [groupTokens])
  const lengthOrType = TYPOGRAPHY_PICKER_GROUPS.has(tokenGroup)

  const options: TokenPickerOption[] = useMemo(() => {
    const source = TYPE_FACET_GROUPS.has(tokenGroup)
      ? catalog.filter((tok) => {
          if (tok.status === 'pending') return false
          if (!tok.path.startsWith('typography.')) return false
          return Boolean(previewForBinding(tok, slotKey))
        })
      : catalog.filter((tok) => tok.status !== 'pending' && tok.group === tokenGroup)

    const mapped = source.map((tok) => {
      const facetPreview = previewForBinding(tok, slotKey)
      const role = tokenDisplayLabel(tok)
      let labelText = role
      let valueLabel: string | undefined
      let fontPreview: string | undefined
      if (tokenGroup === 'fontFamily') {
        // Flat list concatenates valueLabel · label — keep label short (Body), sample via fontPreview.
        labelText = role
        valueLabel = undefined
        fontPreview = facetPreview ? shortFontFamilyCss(facetPreview) : undefined
      } else if (tokenGroup === 'fontSize' || tokenGroup === 'fontWeight') {
        // Role name only; size/weight shown via sampleStyle (not "0.78rem · Body").
        labelText = role
        valueLabel = undefined
      } else if (tokenGroup === 'space' || tokenGroup === 'radius') {
        // Role / leaf name only; length facet via sort + menu head (not "12px · path").
        labelText = role
        valueLabel = undefined
      } else if (lengthOrType && facetPreview) {
        valueLabel = facetPreview === role ? undefined : facetPreview
        labelText = role
      } else {
        labelText = tokenPickerOptionLabel(tok, slotKey, facetPreview)
      }
      return {
        path: tok.path,
        label: labelText,
        valueLabel,
        category: tok.group,
        preview: facetPreview || tok.preview || undefined,
        fontPreview,
        sampleStyle:
          tokenGroup === 'fontSize' && facetPreview
            ? { fontSize: `min(1.05rem, ${facetPreview})` }
            : tokenGroup === 'fontWeight' && facetPreview
              ? { fontWeight: facetPreview }
              : undefined,
        sortKey:
          tokenGroup === 'fontSize' && facetPreview
            ? cssLengthSortKey(facetPreview)
            : tokenGroup === 'fontWeight' && facetPreview
              ? fontWeightSortKey(facetPreview)
              : (tokenGroup === 'space' || tokenGroup === 'radius') && facetPreview
                ? cssLengthSortKey(facetPreview)
                : 0,
      }
    })

    if (
      tokenGroup === 'fontSize' ||
      tokenGroup === 'fontWeight' ||
      tokenGroup === 'space' ||
      tokenGroup === 'radius'
    ) {
      mapped.sort((a, b) => a.sortKey - b.sortKey)
    }

    const cleaned: TokenPickerOption[] = mapped.map(({ sortKey: _sortKey, ...opt }) => opt)

    if (tokenGroup === 'fontFamily') {
      return [...cleaned, ...GOOGLE_FONT_PICKER_OPTIONS]
    }
    if (tokenGroup === 'fontSize') {
      const presets: TokenPickerOption[] = HUD_FONT_SIZE_PRESETS.map((css) => ({
        path: hudFontSizeLiteralPath(css),
        label: css,
        category: 'fontSize',
        sampleStyle: { fontSize: `min(1.05rem, ${css})` },
      }))
      // Presets first — designers pick a CSS size; roles remain below.
      return [...presets, ...cleaned]
    }
    if (tokenGroup === 'fontWeight') {
      const presets: TokenPickerOption[] = HUD_FONT_WEIGHT_PRESETS.map((w) => ({
        path: hudFontWeightLiteralPath(w),
        label: w,
        category: 'fontWeight',
        sampleStyle: { fontWeight: w },
      }))
      return [...presets, ...cleaned]
    }
    if (tokenGroup === 'space' || tokenGroup === 'radius') {
      const presets: TokenPickerOption[] = HUD_LENGTH_PRESETS.map((css) => ({
        path: hudLengthLiteralPath(css),
        label: css,
        category: tokenGroup,
      }))
      return [...presets, ...cleaned]
    }
    return cleaned
  }, [catalog, slotKey, tokenGroup, lengthOrType])

  const scopes =
    tokenGroup === 'fontFamily'
      ? [
          { id: 'suggested', label: 'Suggested' },
          { id: tokenGroup, label: scopeLabelForGroup(tokenGroup) },
          { id: 'google', label: 'Google' },
        ]
      : [
          { id: 'suggested', label: 'Suggested' },
          { id: tokenGroup, label: scopeLabelForGroup(tokenGroup) },
        ]

  const promote = useHudPromote()
  const canPromote = Boolean(
    promote?.canPromote(tokenGroup, literalValue) && !boundPath && literalValue.trim(),
  )

  const emit = (ops: SceneOp[]) => {
    if (ops.length) onOps?.(ops)
  }

  const writeLiteral = (raw: string) => {
    emit(buildHudTokenWriteOps(node, slotKey, { kind: 'literal', value: raw }))
    if (tokenGroup === 'fontFamily' && raw.trim()) ensureGoogleFontStylesheet(raw)
  }

  const resolvedNudgeBase = (): string => {
    if (literalValue.trim()) return literalValue
    if (boundPath) {
      const tok = catalog.find((t) => t.path === boundPath)
      const preview = tok ? previewForBinding(tok, slotKey) : undefined
      if (preview) return preview
    }
    return literalPlaceholder(tokenGroup)
  }

  const nudge = (dir: 1 | -1) => {
    if (disabled) return
    const base = resolvedNudgeBase()
    if (tokenGroup === 'fontWeight') {
      writeLiteral(nudgeFontWeightLiteral(base, dir))
      return
    }
    writeLiteral(nudgeCssLengthLiteral(base, dir))
  }

  const isMenu = layout === 'menu'
  const stripIcon = layout === 'field'
  const [menuOpen, setMenuOpen] = useState(false)
  const rootRef = React.useRef<HTMLDivElement>(null)
  /** Ignore strip blur commits that fire while/after a menu pick closes the popover. */
  const suppressLiteralRef = React.useRef(false)

  React.useEffect(() => {
    if (!menuOpen) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setMenuOpen(false)
      }
    }
    function onPointer(event: MouseEvent) {
      const target = event.target as HTMLElement | null
      if (!target) return
      if (rootRef.current?.contains(target)) return
      if (target.closest('[data-testid="token-picker-browser"]')) return
      if (target.closest('.ds-token-picker__browser')) return
      setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    const timer = window.setTimeout(() => window.addEventListener('mousedown', onPointer), 0)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onPointer)
    }
  }, [menuOpen])

  const menuSummary = (() => {
    if (boundPath) {
      const tok = catalog.find((t) => t.path === boundPath)
      if (tok) {
        if (tokenGroup === 'fontFamily') return tokenDisplayLabel(tok)
        if (
          tokenGroup === 'fontSize' ||
          tokenGroup === 'fontWeight' ||
          tokenGroup === 'space' ||
          tokenGroup === 'radius'
        ) {
          return previewForBinding(tok, slotKey) || tokenDisplayLabel(tok)
        }
        const preview = previewForBinding(tok, slotKey)
        const name = tokenDisplayLabel(tok)
        if (preview && preview !== name) {
          if (preview.length > 18) return name
          return `${preview} · ${name}`
        }
        return name
      }
      return boundPath.split('.').slice(-1)[0] || boundPath
    }
    if (tokenGroup === 'fontFamily' && literalValue.trim()) {
      return shortFontFamilyCss(literalValue)
    }
    return literalValue.trim() || '—'
  })()

  const colorFill =
    tokenGroup === 'color'
      ? (() => {
          if (boundPath) {
            const tok = catalog.find((t) => t.path === boundPath)
            return (tok ? previewForBinding(tok, slotKey) || tok.preview : undefined) || undefined
          }
          return literalValue.trim() || undefined
        })()
      : undefined

  const pickerVariant: 'list' | 'compact' =
    stripIcon || tokenGroup === 'fontFamily' || surface === 'embedded-list'
      ? 'list'
      : surface === 'compact' || isMenu
        ? 'compact'
        : 'list'

  const closeAfterPick = stripIcon

  const closeMenuAfterPick = () => {
    if (!closeAfterPick) return
    suppressLiteralRef.current = true
    setMenuOpen(false)
    window.setTimeout(() => {
      suppressLiteralRef.current = false
    }, 0)
  }

  const picker = (
    <TokenPicker
      label={label}
      browser={false}
      defaultOpen={false}
      variant={pickerVariant}
      allowCycle={
        tokenGroup === 'fontFamily' ||
        tokenGroup === 'fontSize' ||
        tokenGroup === 'fontWeight' ||
        tokenGroup === 'color' ||
        tokenGroup === 'space' ||
        tokenGroup === 'radius'
      }
      allowLiteral
      allowNone
      previewKind={previewKindForGroup(tokenGroup)}
      value={boundPath || null}
      literalValue={literalValue}
      literalPlaceholder={literalPlaceholder(tokenGroup)}
      literalReadOnly={Boolean(disabled)}
      literalTestId={`hud-literal-${slotKey}`}
      options={options}
      suggestedPaths={suggestedPaths}
      scopes={scopes}
      emptyQueryCap={tokenGroup === 'fontFamily' ? 24 : undefined}
      recentPaths={recentPaths}
      onRecentPathsChange={(paths) => {
        setRecentPaths(paths)
        saveTokenRecent(paths)
      }}
      noneLabel="None"
      emptyLabel="—"
      clearLabel="Clear"
      promoteLiteralLabel="Save as token"
      listPromoteLabel="Add your own token"
      onPromoteLiteral={
        canPromote
          ? () =>
              promote?.tryPromote({
                slotKey,
                tokenGroup,
                literal: literalValue,
              })
          : undefined
      }
      className="creation-canvas-floating-hud__token-picker"
      data-testid={stripIcon ? `hud-token-picker-${slotKey}` : `hud-token-${slotKey}`}
      aria-disabled={disabled || undefined}
      showActiveHeader={!stripIcon}
      onLiteralChange={(raw) => {
        if (disabled || suppressLiteralRef.current) return
        writeLiteral(raw)
      }}
      onChange={(path) => {
        if (disabled) return
        const googleFamily = parseGoogleFontLiteralPath(path)
        if (googleFamily) {
          writeLiteral(googleFamily)
          closeMenuAfterPick()
          return
        }
        const sizeLiteral = parseHudFontSizeLiteralPath(path)
        if (sizeLiteral) {
          writeLiteral(sizeLiteral)
          closeMenuAfterPick()
          return
        }
        const weightLiteral = parseHudFontWeightLiteralPath(path)
        if (weightLiteral) {
          writeLiteral(weightLiteral)
          closeMenuAfterPick()
          return
        }
        const lengthLiteral = parseHudLengthLiteralPath(path)
        if (lengthLiteral) {
          writeLiteral(lengthLiteral)
          closeMenuAfterPick()
          return
        }
        emit(buildHudTokenWriteOps(node, slotKey, { kind: 'token', path }))
        if (tokenGroup === 'fontFamily') {
          const tok = catalog.find((t) => t.path === path)
          const css = tok ? previewForBinding(tok, slotKey) : undefined
          if (css) ensureGoogleFontStylesheet(css)
        }
        closeMenuAfterPick()
      }}
      onClear={() => {
        if (disabled) return
        writeLiteral('')
      }}
    />
  )

  const nudgeRow =
    supportsNumericNudge(tokenGroup) ? (
      <div
        className="creation-canvas-floating-hud__nudge"
        role="group"
        aria-label={`${label} nudge`}
      >
        <button
          type="button"
          className="creation-canvas-floating-hud__nudge-btn"
          data-testid={`hud-nudge-dec-${slotKey}`}
          disabled={disabled}
          aria-label={`${label} decrease`}
          onClick={() => nudge(-1)}
        >
          −
        </button>
        <button
          type="button"
          className="creation-canvas-floating-hud__nudge-btn"
          data-testid={`hud-nudge-inc-${slotKey}`}
          disabled={disabled}
          aria-label={`${label} increase`}
          onClick={() => nudge(1)}
        >
          +
        </button>
      </div>
    ) : null

  if (isMenu) {
    return (
      <div className="creation-hud-craft-menu__picker" data-testid={`hud-slot-${slotKey}`}>
        <div className="creation-canvas-floating-hud__token-row">
          {picker}
          {nudgeRow}
        </div>
      </div>
    )
  }

  /* Strip: icon button only — TokenPicker + literals live in the click menu */
  return (
    <div
      ref={rootRef}
      className="creation-canvas-floating-hud__token-icon"
      data-testid={`hud-slot-${slotKey}`}
    >
      <button
        type="button"
        className={`creation-canvas-floating-hud__btn creation-canvas-floating-hud__token-icon-btn${menuOpen ? ' creation-canvas-floating-hud__btn--on' : ''}`}
        title={`${label}: ${menuSummary}`}
        aria-label={`${label}: ${menuSummary}`}
        aria-expanded={menuOpen}
        aria-haspopup="dialog"
        disabled={disabled}
        data-testid={`hud-token-${slotKey}`}
        onClick={() => setMenuOpen((v) => !v)}
      >
        {tokenGroup === 'color' ? (
          <span
            className={`creation-canvas-floating-hud__token-swatch${!colorFill ? ' creation-canvas-floating-hud__token-swatch--empty' : ''}`}
            style={colorFill ? { background: colorFill } : undefined}
            aria-hidden
          />
        ) : (
          <span className="creation-canvas-floating-hud__token-icon-glyph" aria-hidden>
            {inspectPropIcon(slotKey)}
          </span>
        )}
      </button>
      {menuOpen ? (
        <div
          className="creation-canvas-floating-hud__token-menu"
          role="dialog"
          aria-label={label}
          data-testid={`hud-token-menu-${slotKey}`}
        >
          <div className="creation-canvas-floating-hud__token-menu-head">
            <span>{label}</span>
            <span className="creation-canvas-floating-hud__token-menu-value">{menuSummary}</span>
          </div>
          <div className="creation-canvas-floating-hud__token-row">
            {picker}
            {nudgeRow}
          </div>
        </div>
      ) : null}
    </div>
  )
}

/** @deprecated Prefer HudTokenField with tokenGroup="color" */
export function HudColorTokenField(
  props: Omit<ComponentProps<typeof HudTokenField>, 'tokenGroup'>,
) {
  return <HudTokenField {...props} tokenGroup="color" />
}
