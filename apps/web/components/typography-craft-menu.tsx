'use client'

/**
 * Typography Style craft — SplitCraftMenu + @zaoly/ui hybrids.
 * Weight / Size / LH / Tracking / Paragraph = TokenPicker (literal OR token).
 * Spec: `specs/domain/canvas-smart-hud.md` · Knowledge: `knowledge/hud-craft-token-menu.md`
 */
import React, { useMemo, useState } from 'react'
import type { SceneNode, SceneOp } from '@zaoly/contracts'
import {
  Button,
  Chip,
  Field,
  Input,
  Select,
  SplitCraftMenu,
  ToggleGroup,
  TokenPicker,
  type TokenPickerOption,
  type TokenPreviewKind,
} from '../lib/zaoly-ui'
import { useT } from '../lib/user-prefs'
import { useInspectTokenCatalog } from '../lib/inspect/token-catalog-context'
import {
  previewForBinding,
  tokenDisplayLabel,
  tokenPickerOptionLabel,
  tokensForGroup,
  type TokenGroupId,
} from '../lib/inspect/token-catalog'
import { GOOGLE_FONT_PICKER_OPTIONS } from '../lib/fonts/google-font-catalog'
import {
  ensureGoogleFontStylesheet,
  parseGoogleFontLiteralPath,
} from '../lib/fonts/google-fonts'
import {
  buildHudTokenWriteOps,
  looksLikeTokenPath,
} from '../lib/inspect/resolve-hud-model'
import { previewKindForGroup } from './editor-inspector/inspector-preview-helpers'
import { useHudPromote } from './hud-promote-context'
import type { HudTokenGroup } from './hud-token-field'

export function isTypographyCraftNode(node: SceneNode | null | undefined): boolean {
  if (!node) return false
  const t = node.type
  return (
    t === 'SiteText' ||
    t === 'Text' ||
    t === 'Heading' ||
    t === 'Lede' ||
    t === 'SiteLink' ||
    t === 'Link'
  )
}

function propLiteral(node: SceneNode, key: string): string {
  const raw = String(node.props?.[key] ?? node.style?.[key] ?? '')
  if (raw && !looksLikeTokenPath(raw)) return raw
  return ''
}

function boundPath(node: SceneNode, key: string): string {
  return node.tokenBindings?.[key] ?? ''
}

/** Compact hybrid: type a literal or pick a token pack leaf. */
function TypoHybridPicker({
  node,
  slotKey,
  label,
  tokenGroup,
  previewKind,
  placeholder,
  disabled,
  testId,
  literalTestId,
  onOps,
}: {
  node: SceneNode
  slotKey: string
  label: string
  tokenGroup: TokenGroupId
  previewKind?: TokenPreviewKind
  placeholder: string
  disabled?: boolean
  testId: string
  literalTestId: string
  onOps?: (ops: SceneOp[]) => void
}) {
  const catalog = useInspectTokenCatalog()
  const promote = useHudPromote()
  const bound = boundPath(node, slotKey)
  const literal = propLiteral(node, slotKey)
  const groupTokens = useMemo(() => tokensForGroup(tokenGroup, catalog), [catalog, tokenGroup])
  const suggestedPaths = useMemo(() => groupTokens.map((t) => t.path), [groupTokens])

  const options: TokenPickerOption[] = useMemo(() => {
    return catalog
      .filter((tok) => tok.status !== 'pending')
      .map((tok) => {
        const facetPreview = previewForBinding(tok, slotKey)
        const inGroup = tok.group === tokenGroup
        return {
          path: tok.path,
          label: inGroup
            ? tokenPickerOptionLabel(tok, slotKey, facetPreview)
            : tokenDisplayLabel(tok),
          valueLabel: inGroup && facetPreview ? facetPreview : undefined,
          category: tok.group,
          preview: facetPreview || tok.preview || undefined,
          sampleStyle:
            tokenGroup === 'fontWeight' && inGroup && facetPreview
              ? { fontWeight: facetPreview }
              : tokenGroup === 'fontSize' && inGroup && facetPreview
                ? { fontSize: `min(1.05rem, ${facetPreview})` }
                : undefined,
        }
      })
  }, [catalog, slotKey, tokenGroup])

  const scopes = [
    { id: 'suggested', label: 'Suggested' },
    { id: tokenGroup, label: tokenGroup },
    { id: 'all', label: 'All' },
  ]

  const emit = (ops: SceneOp[]) => {
    if (ops.length) onOps?.(ops)
  }

  const promoteGroup: HudTokenGroup | 'size' | null =
    tokenGroup === 'fontSize' ||
    tokenGroup === 'fontWeight' ||
    tokenGroup === 'space' ||
    tokenGroup === 'radius' ||
    tokenGroup === 'color' ||
    tokenGroup === 'fontFamily'
      ? (tokenGroup as HudTokenGroup)
      : tokenGroup === 'lineHeight' || tokenGroup === 'letterSpacing'
        ? 'size'
        : null

  const canPromote = Boolean(
    promoteGroup &&
      promote?.canPromote(promoteGroup, literal) &&
      !bound &&
      literal.trim(),
  )

  return (
    <div data-testid={testId}>
      <Field label={label} size="sm">
        <TokenPicker
          label={label}
          browser={false}
          variant="compact"
          allowLiteral
          allowNone
          allowCycle={tokenGroup === 'fontWeight' || tokenGroup === 'fontSize'}
          previewKind={previewKind ?? previewKindForGroup(tokenGroup)}
          value={bound || null}
          literalValue={literal}
          literalPlaceholder={placeholder}
          literalReadOnly={Boolean(disabled)}
          literalTestId={literalTestId}
          options={options}
          suggestedPaths={suggestedPaths}
          scopes={scopes}
          noneLabel="None"
          emptyLabel="—"
          clearLabel="Clear"
          promoteLiteralLabel="Save as token"
          listPromoteLabel="Add your own token"
          onPromoteLiteral={
            canPromote && promoteGroup
              ? () =>
                  promote?.tryPromote({
                    slotKey,
                    tokenGroup: promoteGroup,
                    literal,
                  })
              : undefined
          }
          className="creation-typo-craft__hybrid"
          data-testid={`${testId}-picker`}
          aria-disabled={disabled || undefined}
          onLiteralChange={(raw) => {
            if (disabled) return
            emit(buildHudTokenWriteOps(node, slotKey, { kind: 'literal', value: raw }))
          }}
          onChange={(path) => {
            if (disabled) return
            emit(buildHudTokenWriteOps(node, slotKey, { kind: 'token', path }))
          }}
          onClear={() => {
            if (disabled) return
            emit(buildHudTokenWriteOps(node, slotKey, { kind: 'literal', value: '' }))
          }}
        />
      </Field>
    </div>
  )
}

export function TypographyCraftMenu({
  title = 'Style',
  node,
  disabled,
  onOps,
}: {
  title?: string
  node: SceneNode
  disabled?: boolean
  onOps?: (ops: SceneOp[]) => void
}) {
  const t = useT()
  const catalog = useInspectTokenCatalog()
  const promote = useHudPromote()
  const [fontQuery, setFontQuery] = useState('')

  const emit = (ops: SceneOp[]) => {
    if (!ops.length || disabled) return
    onOps?.(ops)
  }

  const setProp = (key: string, value: string) => {
    emit([{ op: 'set_prop', nodeId: node.id, key, value }])
  }

  const writeLiteral = (key: string, raw: string) => {
    emit(buildHudTokenWriteOps(node, key, { kind: 'literal', value: raw }))
  }

  const writeToken = (key: string, path: string) => {
    emit(buildHudTokenWriteOps(node, key, { kind: 'token', path }))
  }

  const styleTokens = useMemo(() => tokensForGroup('fontFamily', catalog), [catalog])

  const styleTokenOptions = useMemo(
    () => [
      { value: '', label: t('editor.typoCraftTokenNone') },
      ...styleTokens.map((tok) => ({
        value: tok.path,
        label: tokenDisplayLabel(tok),
      })),
    ],
    [styleTokens, t],
  )

  const activeStyleToken =
    boundPath(node, 'fontFamily') &&
    styleTokens.some((tok) => tok.path === boundPath(node, 'fontFamily'))
      ? boundPath(node, 'fontFamily')
      : ''

  const applyStyleToken = (path: string) => {
    if (!path) {
      emit([
        { op: 'clear_token_binding', nodeId: node.id, key: 'fontFamily' },
        { op: 'clear_token_binding', nodeId: node.id, key: 'fontSize' },
        { op: 'clear_token_binding', nodeId: node.id, key: 'fontWeight' },
        { op: 'clear_token_binding', nodeId: node.id, key: 'lineHeight' },
        { op: 'clear_token_binding', nodeId: node.id, key: 'letterSpacing' },
      ])
      return
    }
    emit(
      ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing'].map((key) => ({
        op: 'set_token_binding' as const,
        nodeId: node.id,
        key,
        tokenPath: path,
      })),
    )
  }

  const fontOptions: TokenPickerOption[] = useMemo(() => {
    const mapped = catalog
      .filter((tok) => tok.status !== 'pending')
      .map((tok) => {
        const facetPreview = previewForBinding(tok, 'fontFamily')
        const inGroup = tok.group === 'fontFamily'
        return {
          path: tok.path,
          label: inGroup ? tokenDisplayLabel(tok) : tok.path,
          category: tok.group,
          preview: facetPreview || tok.preview || undefined,
          fontPreview: inGroup ? facetPreview || tok.preview : undefined,
          valueLabel: inGroup ? 'AaBbCc123' : undefined,
        }
      })
    return [...mapped, ...GOOGLE_FONT_PICKER_OPTIONS]
  }, [catalog])

  const suggestedFontPaths = useMemo(
    () => styleTokens.map((tok) => tok.path),
    [styleTokens],
  )

  const filteredFontOptions = useMemo(() => {
    const q = fontQuery.trim().toLowerCase()
    if (!q) return fontOptions
    return fontOptions.filter(
      (o) =>
        o.path.toLowerCase().includes(q) ||
        (o.label ?? '').toLowerCase().includes(q) ||
        (o.fontPreview ?? '').toLowerCase().includes(q),
    )
  }, [fontOptions, fontQuery])

  const weightLiteral = propLiteral(node, 'fontWeight') || '400'
  const familyLiteral = propLiteral(node, 'fontFamily')
  const familyBound = boundPath(node, 'fontFamily')

  const align = String(node.props?.textAlign ?? 'left')
  const fontStyle = String(node.props?.fontStyle ?? 'normal')
  const decoration = String(node.props?.textDecoration ?? 'none')
  const transform = String(node.props?.textTransform ?? 'none')
  const boldOn = Number.parseInt(weightLiteral, 10) >= 600 || weightLiteral === 'bold'

  const onAddToken = () => {
    promote?.tryPromote({
      slotKey: 'fontSize',
      tokenGroup: 'fontSize',
      literal: propLiteral(node, 'fontSize') || '16px',
    })
  }

  const header = (
    <div className="creation-typo-craft__token-bar" data-testid="typo-craft-token-bar">
      <div className="creation-typo-craft__token-field" data-testid="typo-craft-style-token">
        <Field label={t('editor.typoCraftStyleToken')} size="sm">
          <Select
            aria-label={t('editor.typoCraftStyleToken')}
            value={activeStyleToken}
            options={styleTokenOptions}
            disabled={disabled}
            placeholder={t('editor.typoCraftStyleToken')}
            onChange={(v) => applyStyleToken(v)}
          />
        </Field>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        shape="rounded"
        disabled={disabled || !promote?.canPromote('fontSize', propLiteral(node, 'fontSize') || '16px')}
        data-testid="typo-craft-add-token"
        onClick={onAddToken}
      >
        + {t('editor.typoCraftAddToken')}
      </Button>
    </div>
  )

  const left = (
    <div className="creation-typo-craft__fonts" data-testid="typo-craft-fonts">
      <Field label={t('editor.typoCraftSearchFont')} size="sm">
        <Input
          block
          size="sm"
          type="search"
          value={fontQuery}
          placeholder={t('editor.typoCraftSearchFont')}
          disabled={disabled}
          data-testid="typo-craft-font-search"
          className="search-input"
          onChange={(e) => setFontQuery(e.target.value)}
        />
      </Field>
      <TokenPicker
        label={t('editor.typoCraftSearchFont')}
        variant="list"
        allowLiteral
        allowNone
        previewKind="type"
        value={familyBound || null}
        literalValue={familyLiteral}
        literalReadOnly={Boolean(disabled)}
        options={filteredFontOptions}
        suggestedPaths={suggestedFontPaths}
        emptyQueryCap={40}
        noneLabel={t('editor.typoCraftTokenNone')}
        emptyLabel="—"
        className="creation-typo-craft__font-picker"
        data-testid="typo-craft-font-picker"
        aria-label={t('editor.typoCraftSearchFont')}
        onLiteralChange={(raw) => {
          if (disabled) return
          writeLiteral('fontFamily', raw)
          if (raw.trim()) ensureGoogleFontStylesheet(raw)
        }}
        onChange={(path) => {
          if (disabled) return
          const google = parseGoogleFontLiteralPath(path)
          if (google) {
            writeLiteral('fontFamily', google)
            ensureGoogleFontStylesheet(google)
            return
          }
          writeToken('fontFamily', path)
          const tok = catalog.find((x) => x.path === path)
          const css = tok ? previewForBinding(tok, 'fontFamily') : undefined
          if (css) ensureGoogleFontStylesheet(css)
        }}
        onClear={() => writeLiteral('fontFamily', '')}
      />
    </div>
  )

  const right = (
    <div className="creation-typo-craft__props" data-testid="typo-craft-props">
      <TypoHybridPicker
        node={node}
        slotKey="fontWeight"
        label={t('editor.typoCraftWeight')}
        tokenGroup="fontWeight"
        previewKind="type"
        placeholder="500"
        disabled={disabled}
        testId="typo-craft-weight"
        literalTestId="typo-craft-weight-input"
        onOps={onOps}
      />

      <div className="creation-typo-craft__pair">
        <TypoHybridPicker
          node={node}
          slotKey="fontSize"
          label={t('editor.typoCraftSize')}
          tokenGroup="fontSize"
          previewKind="type"
          placeholder="14px"
          disabled={disabled}
          testId="typo-craft-size"
          literalTestId="typo-craft-size-input"
          onOps={onOps}
        />
        <TypoHybridPicker
          node={node}
          slotKey="lineHeight"
          label={t('editor.typoCraftLineHeight')}
          tokenGroup="lineHeight"
          previewKind="size"
          placeholder="1.4"
          disabled={disabled}
          testId="typo-craft-lineheight"
          literalTestId="typo-craft-lineheight-input"
          onOps={onOps}
        />
      </div>

      <div className="creation-typo-craft__pair">
        <TypoHybridPicker
          node={node}
          slotKey="letterSpacing"
          label={t('editor.typoCraftTracking')}
          tokenGroup="letterSpacing"
          previewKind="size"
          placeholder="0%"
          disabled={disabled}
          testId="typo-craft-tracking"
          literalTestId="typo-craft-tracking-input"
          onOps={onOps}
        />
        <TypoHybridPicker
          node={node}
          slotKey="marginBottom"
          label={t('editor.typoCraftParagraph')}
          tokenGroup="space"
          previewKind="space"
          placeholder="8px"
          disabled={disabled}
          testId="typo-craft-paragraph"
          literalTestId="typo-craft-paragraph-input"
          onOps={onOps}
        />
      </div>

      <div className="creation-typo-craft__pair creation-typo-craft__pair--toolbar">
        <div data-testid="typo-craft-align">
          <Field label={t('editor.typoCraftAlign')} size="sm">
            <ToggleGroup
              aria-label={t('editor.typoCraftAlign')}
              size="sm"
              value={align === 'right' ? 'right' : 'left'}
              onChange={(v) => setProp('textAlign', v)}
              options={[
                { value: 'left', label: t('editor.typoCraftAlignLeft') },
                { value: 'right', label: t('editor.typoCraftAlignRight') },
              ]}
            />
          </Field>
        </div>

        <div data-testid="typo-craft-format">
          <Field label={t('editor.typoCraftFormat')} size="sm">
            <div
              className="creation-typo-craft__format ds-chip-row"
              role="group"
              aria-label={t('editor.typoCraftFormat')}
            >
              <Chip
                size="sm"
                selected={boldOn}
                disabled={disabled}
                data-testid="typo-craft-bold"
                aria-pressed={boldOn}
                onClick={() => writeLiteral('fontWeight', boldOn ? '400' : '700')}
              >
                B
              </Chip>
              <Chip
                size="sm"
                selected={fontStyle === 'italic'}
                disabled={disabled}
                data-testid="typo-craft-italic"
                aria-pressed={fontStyle === 'italic'}
                onClick={() => setProp('fontStyle', fontStyle === 'italic' ? 'normal' : 'italic')}
              >
                <em>I</em>
              </Chip>
              <Chip
                size="sm"
                selected={decoration === 'underline'}
                disabled={disabled}
                data-testid="typo-craft-underline"
                aria-pressed={decoration === 'underline'}
                onClick={() =>
                  setProp('textDecoration', decoration === 'underline' ? 'none' : 'underline')
                }
              >
                <span style={{ textDecoration: 'underline' }}>U</span>
              </Chip>
              <Chip
                size="sm"
                selected={transform === 'uppercase'}
                disabled={disabled}
                data-testid="typo-craft-tt"
                aria-pressed={transform === 'uppercase'}
                onClick={() =>
                  setProp('textTransform', transform === 'uppercase' ? 'none' : 'uppercase')
                }
              >
                TT
              </Chip>
            </div>
          </Field>
        </div>
      </div>
    </div>
  )

  return (
    <SplitCraftMenu
      title={title}
      header={header}
      rightLabel={t('editor.typoCraftProperties')}
      left={left}
      right={right}
      data-testid="typography-craft-menu"
      className="creation-typography-craft-menu creation-typo-craft creation-typo-craft--dense"
      width={420}
      height={288}
    />
  )
}
