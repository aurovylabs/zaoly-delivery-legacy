'use client'

import React, {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Button,
  Chip,
  EmptyState,
  Field,
  Hint,
  HubIndexCard,
  Input,
  Panel,
  SectionChrome,
  TokenKindGlyph,
  tokenKindGlyphId,
} from '../lib/zaoly-ui'
import type { TokenKindGlyphId } from '../lib/zaoly-ui'
import { TokenBezierPad } from './token-bezier-pad'
import { TokenColorField } from './token-color-field'
import { TokenComposeField } from './token-compose-field'
import { TokenNominalWheel } from './token-nominal-wheel'
import { toPickerHex } from '../lib/tokens/color-css'
import {
  downloadTokenPackText,
  formatTokenPackCss,
  formatTokenPackJson,
  type PackExportView,
} from '../lib/tokens/pack-export'
import type { PackImportDiff } from '../lib/tokens/pack-import'
import {
  catalogLeafStatus,
  catalogOriginKind,
  countCatalogStatuses,
  fixtureBaselineForPath,
  fixturePathSet,
  matchesCatalogStatusFilter,
  type CatalogStatusFilter,
} from '../lib/tokens/pack-leaf-status'
import { catalogToPackLeaves } from '../lib/tokens/pack-merge'
import {
  createCardKey,
  groupLeavesByPathFamily,
  normalizeFamilySlug,
  suggestGroupTokenPath,
  tokenPathCardLabel,
  tokenPathFamily,
  withEmptyPathFamilies,
  type EmptyPathFamily,
} from '../lib/tokens/pack-path-groups'
import {
  listSmartComposeCandidates,
  looksLikeTokenExpr,
  resolveTokenExpr,
  wouldCreateCycle,
} from '../lib/tokens/token-expr'
import {
  effectAmountLadder,
  ladderForTokenField,
  type NominalLadder,
} from '../lib/tokens/nominal-sliders'
import {
  applyAssetDigital,
  applyDigitalScalar,
  applyEffectDigital,
  applyGlowDigital,
  applyMotionDigital,
  applyShadowDigital,
  applyTypographyDigital,
  buildAssetValue,
  buildEffectValue,
  buildGlowValue,
  buildMotionValue,
  buildShadowValue,
  buildTypographyValue,
  DEFAULT_EFFECT_DIGITAL,
  DEFAULT_GLOW_DIGITAL,
  DEFAULT_MOTION_DIGITAL,
  DEFAULT_SHADOW_DIGITAL,
  EFFECT_KINDS,
  isStudioScalarType,
  isValidStudioTokenPath,
  readAssetDigitalDraft,
  readAssetSummary,
  readDigitalScalar,
  readEffectDigitalDraft,
  readEffectSummary,
  readGlowDigitalDraft,
  readGlowSummary,
  readMotionDigitalDraft,
  readMotionSummary,
  readShadowDigitalDraft,
  readShadowSummary,
  readTypographyDigitalDraft,
  readTypographySummary,
  STUDIO_EDITABLE_TYPES,
  studioInputKind,
  type AssetDigitalDraft,
  type EffectDigitalDraft,
  type GlowDigitalDraft,
  type MotionDigitalDraft,
  type ShadowDigitalDraft,
  type TypographyDigitalDraft,
} from '../lib/inspect/digital-edit'
import type { ZaolyPackLeaf } from '../lib/inspect/token-catalog'
import { inspectOptionFromLeaf } from '../lib/inspect/token-catalog'
import type { TokenOrigin } from '../lib/tokens/pack-merge'
import {
  applyArtboardDigital,
  buildArtboardValue,
  emptyArtboardDraft,
  readArtboardDigitalDraft,
  readArtboardSummary,
  type ArtboardDigitalDraft,
} from '../lib/tokens/artboard-presets'
import {
  applyMediaDigital,
  buildMediaValue,
  emptyMediaDraft,
  readMediaDigitalDraft,
  readMediaSummary,
  type MediaDigitalDraft,
} from '../lib/tokens/media-breakpoints'
import { paths } from '../lib/paths'
import { useUserPrefs } from '../lib/user-prefs'

const TYPE_FILTERS = ['all', ...Array.from(STUDIO_EDITABLE_TYPES)] as const
const FIXTURE_LEAVES = catalogToPackLeaves()
const FIXTURE_PATHS = fixturePathSet(FIXTURE_LEAVES)

const EMPTY_TYPO: TypographyDigitalDraft = {
  family: '',
  weight: '400',
  digitalSize: '1rem',
  lineHeight: '',
}

const EMPTY_ASSET: AssetDigitalDraft = {
  label: '',
  src: '',
  format: '',
  minWidth: '',
}

type PackBody = {
  tokens: ZaolyPackLeaf[]
  origins: Record<string, TokenOrigin>
  canWrite: boolean
}

type PrefsT = ReturnType<typeof useUserPrefs>['t']

function displayValue(leaf: ZaolyPackLeaf): string {
  if (leaf.type === 'typography') return readTypographySummary(leaf.value) ?? '—'
  if (leaf.type === 'shadow') return readShadowSummary(leaf.value)
  if (leaf.type === 'glow') return readGlowSummary(leaf.value)
  if (leaf.type === 'effect') return readEffectSummary(leaf.value)
  if (leaf.type === 'motion') return readMotionSummary(leaf.value)
  if (leaf.type === 'asset') return readAssetSummary(leaf.value)
  if (leaf.type === 'artboard') return readArtboardSummary(leaf.value)
  if (leaf.type === 'media') return readMediaSummary(leaf.value)
  if (isStudioScalarType(leaf.type)) return readDigitalScalar(leaf.type, leaf.value) ?? '—'
  return '—'
}

function previewCss(
  leaf: ZaolyPackLeaf,
  resolveCss?: (path: string) => string | null,
): string {
  const raw = isStudioScalarType(leaf.type)
    ? readDigitalScalar(leaf.type, leaf.value) ?? ''
    : ''
  if (raw && resolveCss && looksLikeTokenExpr(raw)) {
    return resolveTokenExpr(raw, resolveCss) ?? ''
  }
  if (raw) return raw
  const option = inspectOptionFromLeaf(leaf)
  return option?.preview ?? ''
}

function glyphId(type: string): TokenKindGlyphId {
  return tokenKindGlyphId(type)
}

function defaultScalar(type: string): string {
  if (type === 'color') return paths.brandPrimaryHex
  if (type === 'opacity') return '1'
  if (type === 'size') return '48px'
  if (type === 'radius') return '8px'
  return '1rem'
}

function hexForPicker(value: string): string {
  return toPickerHex(value)
}

function SnapTimelineField({
  label,
  value,
  onChange,
  ladder,
  disabled,
  onEnter,
  testId,
}: {
  label: string
  value: string
  onChange: (next: string) => void
  ladder: NominalLadder
  disabled: boolean
  onEnter: (event: React.KeyboardEvent) => void
  testId?: string
}) {
  return (
    <Field label={label}>
      <div className="zaoly-token-studio__snap">
        <TokenNominalWheel
          label={label}
          value={value}
          ladder={ladder}
          disabled={disabled}
          onChange={onChange}
          testId={testId}
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={onEnter} disabled={disabled} />
      </div>
    </Field>
  )
}

function TokenCardMedia({
  leaf,
  resolveCss,
}: {
  leaf: ZaolyPackLeaf
  resolveCss?: (path: string) => string | null
}) {
  const css = previewCss(leaf, resolveCss)
  if (leaf.type === 'color') {
    return <div className="zaoly-token-studio__swatch" style={{ background: css }} aria-hidden />
  }
  if (leaf.type === 'typography') {
    const draft = readTypographyDigitalDraft(leaf.value)
    return (
      <div
        className="zaoly-token-studio__space-sheet zaoly-token-studio__type-sheet"
        aria-hidden
        data-testid={`token-type-sheet-${leaf.path}`}
        style={{
          ['--token-type-family' as string]: draft.family || 'inherit',
          ['--token-type-weight' as string]: draft.weight || '400',
          ['--token-type-size' as string]: draft.digitalSize || '1rem',
          ['--token-type-leading' as string]: draft.lineHeight || '1.2',
        }}
      >
        <div className="zaoly-token-studio__type-map">
          <span className="zaoly-token-studio__type-specimen">{'Aa Bb\nHg xy'}</span>
        </div>
      </div>
    )
  }
  if (leaf.type === 'shadow') {
    return (
      <div
        className="zaoly-token-studio__shadow-sheet"
        aria-hidden
        data-testid={`token-shadow-sheet-${leaf.path}`}
        style={{ ['--token-shadow' as string]: css || 'none' }}
      >
        <span className="zaoly-token-studio__shadow-ghost" />
        <span className="zaoly-token-studio__shadow-plate" />
      </div>
    )
  }
  if (leaf.type === 'glow') {
    return (
      <div
        className="zaoly-token-studio__glow-sheet"
        aria-hidden
        data-testid={`token-glow-sheet-${leaf.path}`}
        style={{ ['--token-glow' as string]: css || 'none' }}
      >
        <span className="zaoly-token-studio__glow-plate" />
      </div>
    )
  }
  if (leaf.type === 'effect') {
    return (
      <div
        className="zaoly-token-studio__effect-sheet"
        aria-hidden
        data-testid={`token-effect-sheet-${leaf.path}`}
      >
        <div className="zaoly-token-studio__effect-specimen" style={{ filter: css || 'none' }}>
          <span />
          <span />
          <span />
        </div>
      </div>
    )
  }
  if (leaf.type === 'motion') {
    const draft = readMotionDigitalDraft(leaf.value)
    return (
      <div
        className="zaoly-token-studio__motion-sheet"
        aria-hidden
        data-testid={`token-motion-sheet-${leaf.path}`}
        style={{
          ['--token-motion-duration' as string]: draft.duration || '240ms',
          ['--token-motion-easing' as string]: draft.easing || 'ease',
        }}
      >
        <span className="zaoly-token-studio__motion-track" />
        <span className="zaoly-token-studio__motion-plate" />
      </div>
    )
  }
  if (leaf.type === 'spacing') {
    const space = css || '0.5rem'
    return (
      <div
        className="zaoly-token-studio__space-sheet"
        aria-hidden
        data-testid={`token-space-grid-${leaf.path}`}
        style={{ ['--token-space' as string]: space }}
      >
        <div className="zaoly-token-studio__space-map">
          <span className="zaoly-token-studio__space-module" />
        </div>
      </div>
    )
  }
  if (leaf.type === 'size') {
    const size = readDigitalScalar('size', leaf.value) || css || '1rem'
    return (
      <div
        className="zaoly-token-studio__space-sheet"
        aria-hidden
        data-testid={`token-size-sheet-${leaf.path}`}
        style={{ ['--token-size' as string]: size }}
      >
        <div className="zaoly-token-studio__size-map" />
      </div>
    )
  }
  if (leaf.type === 'radius') {
    return (
      <div
        className="zaoly-token-studio__space-sheet"
        aria-hidden
        data-testid={`token-radius-corner-${leaf.path}`}
        style={{ ['--token-radius' as string]: css || '0' }}
      >
        <div className="zaoly-token-studio__radius-map">
          <span className="zaoly-token-studio__radius-module zaoly-token-studio__allow-radius" />
        </div>
      </div>
    )
  }
  if (leaf.type === 'opacity') {
    return (
      <div
        className="zaoly-token-studio__space-sheet zaoly-token-studio__opacity-sheet"
        aria-hidden
        data-testid={`token-opacity-sheet-${leaf.path}`}
        style={{ ['--token-opacity' as string]: css || '0.4' }}
      >
        <div className="zaoly-token-studio__opacity-map" />
      </div>
    )
  }
  if (leaf.type === 'artboard') {
    const draft = readArtboardDigitalDraft(leaf.value)
    return (
      <div
        className="zaoly-token-studio__glyph-stage"
        aria-hidden
        data-testid={`token-artboard-sheet-${leaf.path}`}
        style={{
          display: 'grid',
          placeItems: 'center',
          gap: '0.25rem',
          fontSize: '0.75rem',
        }}
      >
        <TokenKindGlyph id={glyphId('artboard')} size={28} />
        <span>
          {draft.width} × {draft.height}
        </span>
      </div>
    )
  }
  if (leaf.type === 'media') {
    const draft = readMediaDigitalDraft(leaf.value)
    return (
      <div
        className="zaoly-token-studio__glyph-stage"
        aria-hidden
        data-testid={`token-media-sheet-${leaf.path}`}
        style={{
          display: 'grid',
          placeItems: 'center',
          gap: '0.25rem',
          fontSize: '0.75rem',
        }}
      >
        <TokenKindGlyph id={glyphId('media')} size={28} />
        <span>min {draft.minWidth}px</span>
      </div>
    )
  }
  return (
    <div className="zaoly-token-studio__glyph-stage" aria-hidden>
      <TokenKindGlyph id={glyphId(leaf.type)} size={32} />
    </div>
  )
}

function TokenDigitalFields({
  type,
  canWrite,
  t,
  scalar,
  setScalar,
  typo,
  setTypo,
  shadow,
  setShadow,
  glow,
  setGlow,
  effect,
  setEffect,
  motion,
  setMotion,
  asset,
  setAsset,
  artboard,
  setArtboard,
  media,
  setMedia,
  onSubmit,
  composeCandidates = [],
  resolveCss,
}: {
  type: string
  canWrite: boolean
  t: PrefsT
  scalar: string
  setScalar: (value: string) => void
  typo: TypographyDigitalDraft
  setTypo: (value: TypographyDigitalDraft) => void
  shadow: ShadowDigitalDraft
  setShadow: (value: ShadowDigitalDraft) => void
  glow: GlowDigitalDraft
  setGlow: (value: GlowDigitalDraft) => void
  effect: EffectDigitalDraft
  setEffect: (value: EffectDigitalDraft) => void
  motion: MotionDigitalDraft
  setMotion: (value: MotionDigitalDraft) => void
  asset: AssetDigitalDraft
  setAsset: (value: AssetDigitalDraft) => void
  artboard: ArtboardDigitalDraft
  setArtboard: (value: ArtboardDigitalDraft) => void
  media: MediaDigitalDraft
  setMedia: (value: MediaDigitalDraft) => void
  onSubmit: () => void
  composeCandidates?: string[]
  resolveCss?: (tokenPath: string) => string | null
}) {
  const kind = studioInputKind(type)
  const disabled = !canWrite
  const showCompose = type === 'color' || type === 'spacing'

  function onEnter(event: React.KeyboardEvent) {
    if (event.key !== 'Enter' || event.shiftKey) return
    event.preventDefault()
    onSubmit()
  }

  const literalValueField =
    kind === 'color' ? (
      <TokenColorField
        value={scalar}
        onChange={setScalar}
        disabled={disabled}
        onKeyDown={onEnter}
        t={t}
      />
    ) : kind === 'length' || kind === 'opacity' ? (
      (() => {
        const ladder = ladderForTokenField(type, 'value', scalar)
        if (!ladder) {
          return (
            <Field label={t('tokens.value')}>
              <Input value={scalar} onChange={(e) => setScalar(e.target.value)} onKeyDown={onEnter} disabled={disabled} />
            </Field>
          )
        }
        return (
          <SnapTimelineField
            label={t('tokens.value')}
            value={scalar}
            onChange={setScalar}
            ladder={ladder}
            disabled={disabled}
            onEnter={onEnter}
            testId={`token-snap-${type}`}
          />
        )
      })()
    ) : null

  return (
    <div className="zaoly-token-studio__fields">
      {showCompose ? (
        <TokenComposeField
          type={type === 'color' ? 'color' : 'spacing'}
          value={scalar}
          onChange={setScalar}
          candidates={composeCandidates}
          resolveCss={resolveCss}
          literal={literalValueField}
          disabled={disabled}
          onKeyDown={onEnter}
          t={t}
        />
      ) : (
        literalValueField
      )}
      {type === 'typography' ? (
        <>
          <Field label={t('tokens.family')}>
            <Input
              value={typo.family}
              onChange={(e) => setTypo({ ...typo, family: e.target.value })}
              onKeyDown={onEnter}
              disabled={disabled}
            />
          </Field>
          <SnapTimelineField
            label={t('tokens.weight')}
            value={typo.weight}
            onChange={(weight) => setTypo({ ...typo, weight })}
            ladder={ladderForTokenField('typography', 'weight')!}
            disabled={disabled}
            onEnter={onEnter}
            testId="token-snap-weight"
          />
          <SnapTimelineField
            label={t('tokens.digitalSize')}
            value={typo.digitalSize}
            onChange={(digitalSize) => setTypo({ ...typo, digitalSize })}
            ladder={ladderForTokenField('typography', 'digitalSize', typo.digitalSize)!}
            disabled={disabled}
            onEnter={onEnter}
            testId="token-snap-type-size"
          />
          <Field label={t('tokens.lineHeight')}>
            <Input
              value={typo.lineHeight}
              onChange={(e) => setTypo({ ...typo, lineHeight: e.target.value })}
              onKeyDown={onEnter}
              disabled={disabled}
            />
          </Field>
        </>
      ) : null}
      {type === 'shadow' ? (
        <>
          <SnapTimelineField
            label={t('tokens.shadowOffsetX')}
            value={shadow.offsetX}
            onChange={(offsetX) => setShadow({ ...shadow, offsetX })}
            ladder={ladderForTokenField('shadow', 'offsetX')!}
            disabled={disabled}
            onEnter={onEnter}
            testId="token-snap-shadow-offset-x"
          />
          <SnapTimelineField
            label={t('tokens.shadowOffsetY')}
            value={shadow.offsetY}
            onChange={(offsetY) => setShadow({ ...shadow, offsetY })}
            ladder={ladderForTokenField('shadow', 'offsetY')!}
            disabled={disabled}
            onEnter={onEnter}
            testId="token-snap-shadow-offset-y"
          />
          <SnapTimelineField
            label={t('tokens.shadowBlur')}
            value={shadow.blur}
            onChange={(blur) => setShadow({ ...shadow, blur })}
            ladder={ladderForTokenField('shadow', 'blur')!}
            disabled={disabled}
            onEnter={onEnter}
            testId="token-snap-shadow-blur"
          />
          <SnapTimelineField
            label={t('tokens.shadowSpread')}
            value={shadow.spread}
            onChange={(spread) => setShadow({ ...shadow, spread })}
            ladder={ladderForTokenField('shadow', 'spread')!}
            disabled={disabled}
            onEnter={onEnter}
            testId="token-snap-shadow-spread"
          />
          <Field label={t('tokens.shadowColor')}>
            <Input
              value={shadow.color}
              onChange={(e) => setShadow({ ...shadow, color: e.target.value })}
              onKeyDown={onEnter}
              disabled={disabled}
            />
          </Field>
          <div className="zaoly-token-studio__compose-presets" role="group" aria-label={t('tokens.shadowInset')}>
            <Chip
              size="sm"
              selected={!shadow.inset}
              disabled={disabled}
              onClick={() => setShadow({ ...shadow, inset: false })}
            >
              {t('tokens.shadowOutset')}
            </Chip>
            <Chip
              size="sm"
              selected={shadow.inset}
              disabled={disabled}
              onClick={() => setShadow({ ...shadow, inset: true })}
            >
              {t('tokens.shadowInset')}
            </Chip>
          </div>
        </>
      ) : null}
      {type === 'glow' ? (
        <>
          <SnapTimelineField
            label={t('tokens.glowOffsetX')}
            value={glow.offsetX}
            onChange={(offsetX) => setGlow({ ...glow, offsetX })}
            ladder={ladderForTokenField('glow', 'offsetX')!}
            disabled={disabled}
            onEnter={onEnter}
            testId="token-snap-glow-offset-x"
          />
          <SnapTimelineField
            label={t('tokens.glowOffsetY')}
            value={glow.offsetY}
            onChange={(offsetY) => setGlow({ ...glow, offsetY })}
            ladder={ladderForTokenField('glow', 'offsetY')!}
            disabled={disabled}
            onEnter={onEnter}
            testId="token-snap-glow-offset-y"
          />
          <Field label={t('tokens.glowColor')}>
            <div className="zaoly-token-studio__color-row">
              <input
                type="color"
                aria-label={t('tokens.colorPicker')}
                value={hexForPicker(glow.color)}
                onChange={(e) => setGlow({ ...glow, color: e.target.value })}
                disabled={disabled}
              />
              <Input
                value={glow.color}
                onChange={(e) => setGlow({ ...glow, color: e.target.value })}
                onKeyDown={onEnter}
                disabled={disabled}
              />
            </div>
          </Field>
          <SnapTimelineField
            label={t('tokens.glowBlur')}
            value={glow.blur}
            onChange={(blur) => setGlow({ ...glow, blur })}
            ladder={ladderForTokenField('glow', 'blur')!}
            disabled={disabled}
            onEnter={onEnter}
            testId="token-snap-glow-blur"
          />
          <SnapTimelineField
            label={t('tokens.glowSpread')}
            value={glow.spread}
            onChange={(spread) => setGlow({ ...glow, spread })}
            ladder={ladderForTokenField('glow', 'spread')!}
            disabled={disabled}
            onEnter={onEnter}
            testId="token-snap-glow-spread"
          />
        </>
      ) : null}
      {type === 'effect' ? (
        <>
          <Field label={t('tokens.effectKind')}>
            <div className="zaoly-token-studio__filters">
              {EFFECT_KINDS.map((id) => (
                <Chip
                  key={id}
                  size="sm"
                  selected={effect.kind === id}
                  onClick={() => {
                    if (!disabled) setEffect({ ...effect, kind: id })
                  }}
                >
                  {id}
                </Chip>
              ))}
            </div>
          </Field>
          <SnapTimelineField
            label={t('tokens.effectAmount')}
            value={effect.amount}
            onChange={(amount) => setEffect({ ...effect, amount })}
            ladder={effectAmountLadder(effect.kind)}
            disabled={disabled}
            onEnter={onEnter}
            testId="token-snap-effect-amount"
          />
        </>
      ) : null}
      {type === 'motion' ? (
        <>
          <SnapTimelineField
            label={t('tokens.motionDuration')}
            value={motion.duration}
            onChange={(duration) => setMotion({ ...motion, duration })}
            ladder={ladderForTokenField('motion', 'duration')!}
            disabled={disabled}
            onEnter={onEnter}
            testId="token-snap-motion-duration"
          />
          <Field label={t('tokens.motionEasing')}>
            <TokenBezierPad
              value={motion.easing}
              onChange={(easing) => setMotion({ ...motion, easing })}
              onEnter={onEnter}
              disabled={disabled}
              t={t}
            />
          </Field>
        </>
      ) : null}
      {type === 'asset' ? (
        <>
          <Field label={t('tokens.assetLabel')}>
            <Input
              value={asset.label}
              onChange={(e) => setAsset({ ...asset, label: e.target.value })}
              onKeyDown={onEnter}
              disabled={disabled}
            />
          </Field>
          <Field label={t('tokens.assetSrc')}>
            <Input
              value={asset.src}
              onChange={(e) => setAsset({ ...asset, src: e.target.value })}
              onKeyDown={onEnter}
              disabled={disabled}
            />
          </Field>
        </>
      ) : null}
      {type === 'artboard' ? (
        <>
          <Field label={t('tokens.artboardLabel')}>
            <Input
              value={artboard.label}
              onChange={(e) => setArtboard({ ...artboard, label: e.target.value })}
              onKeyDown={onEnter}
              disabled={disabled}
              data-testid="token-artboard-label"
            />
          </Field>
          <Field label={t('tokens.artboardWidth')}>
            <Input
              type="number"
              min={1}
              step={1}
              value={artboard.width}
              onChange={(e) => setArtboard({ ...artboard, width: e.target.value })}
              onKeyDown={onEnter}
              disabled={disabled}
              data-testid="token-artboard-width"
            />
          </Field>
          <Field label={t('tokens.artboardHeight')}>
            <Input
              type="number"
              min={1}
              step={1}
              value={artboard.height}
              onChange={(e) => setArtboard({ ...artboard, height: e.target.value })}
              onKeyDown={onEnter}
              disabled={disabled}
              data-testid="token-artboard-height"
            />
          </Field>
          <Field label={t('tokens.artboardLane')}>
            <div
              className="zaoly-token-studio__compose-presets"
              role="group"
              aria-label={t('tokens.artboardLane')}
              data-testid="token-artboard-lane"
            >
              {(
                [
                  { id: '', label: t('tokens.artboardLaneNone') },
                  { id: 'desktop', label: t('tokens.artboardLaneDesktop') },
                  { id: 'tablet', label: t('tokens.artboardLaneTablet') },
                  { id: 'mobile', label: t('tokens.artboardLaneMobile') },
                ] as const
              ).map((opt) => (
                <Chip
                  key={opt.id || 'none'}
                  size="sm"
                  selected={artboard.lane === opt.id}
                  disabled={disabled}
                  onClick={() => setArtboard({ ...artboard, lane: opt.id })}
                >
                  {opt.label}
                </Chip>
              ))}
            </div>
          </Field>
        </>
      ) : null}
      {type === 'media' ? (
        <>
          <Field label={t('tokens.mediaLabel')}>
            <Input
              value={media.label}
              onChange={(e) => setMedia({ ...media, label: e.target.value })}
              onKeyDown={onEnter}
              disabled={disabled}
              data-testid="token-media-label"
            />
          </Field>
          <Field label={t('tokens.mediaMinWidth')}>
            <Input
              type="number"
              min={0}
              step={1}
              value={media.minWidth}
              onChange={(e) => setMedia({ ...media, minWidth: e.target.value })}
              onKeyDown={onEnter}
              disabled={disabled}
              data-testid="token-media-min-width"
            />
          </Field>
          <Field label={t('tokens.mediaLane')}>
            <div
              className="zaoly-token-studio__compose-presets"
              role="group"
              aria-label={t('tokens.mediaLane')}
              data-testid="token-media-lane"
            >
              {(
                [
                  { id: '', label: t('tokens.artboardLaneNone') },
                  { id: 'desktop', label: t('tokens.artboardLaneDesktop') },
                  { id: 'tablet', label: t('tokens.artboardLaneTablet') },
                  { id: 'mobile', label: t('tokens.artboardLaneMobile') },
                ] as const
              ).map((opt) => (
                <Chip
                  key={opt.id || 'none'}
                  size="sm"
                  selected={media.lane === opt.id}
                  disabled={disabled}
                  onClick={() => setMedia({ ...media, lane: opt.id })}
                >
                  {opt.label}
                </Chip>
              ))}
            </div>
          </Field>
        </>
      ) : null}
    </div>
  )
}

export function TokenStudioHub() {
  const { t } = useUserPrefs()
  return (
    <Suspense fallback={<EmptyState>{t('tokens.loading')}</EmptyState>}>
      <TokenStudioHubInner />
    </Suspense>
  )
}

function TokenStudioHubInner() {
  const { t } = useUserPrefs()
  const router = useRouter()
  const searchParams = useSearchParams()
  const focusParam = searchParams.get(paths.tokenPackPathQueryKey)?.trim() ?? ''
  const focusedOnceRef = useRef<string | null>(null)
  const [pack, setPack] = useState<PackBody | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<CatalogStatusFilter>('all')
  const [layout, setLayout] = useState<PackExportView>('cards')
  const [copyState, setCopyState] = useState<'idle' | 'ok' | 'err'>('idle')
  const [importDiff, setImportDiff] = useState<PackImportDiff | null>(null)
  const [importJson, setImportJson] = useState<string | null>(null)
  const [importBusy, setImportBusy] = useState(false)
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [renaming, setRenaming] = useState(false)
  const [renameDraft, setRenameDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [addPath, setAddPath] = useState('')
  const [addType, setAddType] = useState('color')
  const [createAnchor, setCreateAnchor] = useState<{ type: string; family: string } | null>(
    null,
  )
  const [emptyFamilies, setEmptyFamilies] = useState<EmptyPathFamily[]>([])
  const [groupDraftType, setGroupDraftType] = useState<string | null>(null)
  const [groupDraftSlug, setGroupDraftSlug] = useState('')
  const [groupDraftError, setGroupDraftError] = useState<string | null>(null)
  const [addScalar, setAddScalar] = useState(defaultScalar('color'))
  const [addTypo, setAddTypo] = useState<TypographyDigitalDraft>(EMPTY_TYPO)
  const [addShadow, setAddShadow] = useState<ShadowDigitalDraft>(DEFAULT_SHADOW_DIGITAL)
  const [addGlow, setAddGlow] = useState<GlowDigitalDraft>(DEFAULT_GLOW_DIGITAL)
  const [addEffect, setAddEffect] = useState<EffectDigitalDraft>(DEFAULT_EFFECT_DIGITAL)
  const [addMotion, setAddMotion] = useState<MotionDigitalDraft>(DEFAULT_MOTION_DIGITAL)
  const [addAsset, setAddAsset] = useState<AssetDigitalDraft>(EMPTY_ASSET)
  const [addArtboard, setAddArtboard] = useState<ArtboardDigitalDraft>(emptyArtboardDraft())
  const [addMedia, setAddMedia] = useState<MediaDigitalDraft>(emptyMediaDraft())
  const [editScalar, setEditScalar] = useState('')
  const [editTypo, setEditTypo] = useState<TypographyDigitalDraft>(EMPTY_TYPO)
  const [editShadow, setEditShadow] = useState<ShadowDigitalDraft>(DEFAULT_SHADOW_DIGITAL)
  const [editGlow, setEditGlow] = useState<GlowDigitalDraft>(DEFAULT_GLOW_DIGITAL)
  const [editEffect, setEditEffect] = useState<EffectDigitalDraft>(DEFAULT_EFFECT_DIGITAL)
  const [editMotion, setEditMotion] = useState<MotionDigitalDraft>(DEFAULT_MOTION_DIGITAL)
  const [editAsset, setEditAsset] = useState<AssetDigitalDraft>(EMPTY_ASSET)
  const [editArtboard, setEditArtboard] = useState<ArtboardDigitalDraft>(emptyArtboardDraft())
  const [editMedia, setEditMedia] = useState<MediaDigitalDraft>(emptyMediaDraft())
  const [dockSide, setDockSide] = useState<'left' | 'right'>('right')
  const [dockPos, setDockPos] = useState<{ top: number; left: number } | null>(null)
  const cardRefs = useRef(new Map<string, HTMLElement>())
  const dockRef = useRef<HTMLDivElement | null>(null)

  const load = useCallback(async () => {
    setError(null)
    const res = await fetch(paths.routes.apiTokens)
    if (!res.ok) {
      setError(res.status === 403 ? t('tokens.adminOnly') : t('tokens.loadFailed'))
      return
    }
    const data = (await res.json()) as PackBody
    setPack(data)
  }, [t])

  useEffect(() => {
    void load()
  }, [load])

  const filteredRows = useMemo(() => {
    if (!pack) return []
    const q = query.trim().toLowerCase()
    return pack.tokens
      .filter((leaf) => leaf.status !== 'pending')
      .filter((leaf) => typeFilter === 'all' || leaf.type === typeFilter)
      .filter((leaf) => !q || leaf.path.toLowerCase().includes(q) || leaf.type.includes(q))
      .sort((a, b) => a.path.localeCompare(b.path))
  }, [pack, query, typeFilter])

  const resolveCss = useCallback(
    (tokenPath: string): string | null => {
      const leaf = pack?.tokens.find((row) => row.path === tokenPath)
      if (!leaf) return null
      if (selectedPath && selectedPath === tokenPath) {
        const selectedLeaf =
          pack?.tokens.find((row) => row.path === selectedPath) ?? null
        if (selectedLeaf && isStudioScalarType(selectedLeaf.type)) {
          return editScalar || readDigitalScalar(selectedLeaf.type, selectedLeaf.value)
        }
      }
      return readDigitalScalar(leaf.type, leaf.value)
    },
    [pack, selectedPath, editScalar],
  )

  const statusCounts = useMemo(() => {
    if (!pack) return { unresolved: 0, override: 0, custom: 0 }
    return countCatalogStatuses(filteredRows, pack.origins, FIXTURE_PATHS, resolveCss)
  }, [filteredRows, pack, resolveCss])

  const rows = useMemo(() => {
    if (statusFilter === 'all' || !pack) return filteredRows
    return filteredRows.filter((leaf) =>
      matchesCatalogStatusFilter(
        catalogLeafStatus(leaf, pack.origins[leaf.path] ?? 'fixture', FIXTURE_PATHS, resolveCss),
        statusFilter,
      ),
    )
  }, [filteredRows, statusFilter, pack, resolveCss])

  const emptyCatalogMessage = useMemo(() => {
    if (statusFilter === 'unresolved') return t('tokens.emptyUnresolved')
    if (statusFilter === 'override') return t('tokens.emptyOverride')
    if (statusFilter === 'custom') return t('tokens.emptyCustom')
    return t('tokens.empty')
  }, [statusFilter, t])

  const toggleStatusFilter = useCallback((next: CatalogStatusFilter) => {
    setStatusFilter((prev) => (prev === next ? 'all' : next))
  }, [])

  const syncFocusUrl = useCallback(
    (tokenPath: string | null) => {
      const href = tokenPath?.trim()
        ? paths.routes.tokensFocus(tokenPath)
        : paths.routes.tokens
      router.replace(href, { scroll: false })
    },
    [router],
  )

  const groups = useMemo(
    () =>
      withEmptyPathFamilies(
        groupLeavesByPathFamily(rows, TYPE_FILTERS),
        emptyFamilies,
        TYPE_FILTERS,
      ),
    [rows, emptyFamilies],
  )

  useEffect(() => {
    if (!pack) return
    setEmptyFamilies((prev) =>
      prev.filter(
        (shell) =>
          !pack.tokens.some(
            (leaf) =>
              leaf.type === shell.type && tokenPathFamily(leaf.path) === shell.family,
          ),
      ),
    )
  }, [pack])

  const exportText = useMemo(() => {
    if (layout === 'cards') return ''
    return layout === 'json' ? formatTokenPackJson(rows) : formatTokenPackCss(rows)
  }, [layout, rows])

  const copyExport = useCallback(async () => {
    if (!exportText) return
    try {
      await navigator.clipboard.writeText(exportText)
      setCopyState('ok')
      window.setTimeout(() => setCopyState('idle'), 1600)
    } catch {
      setCopyState('err')
      window.setTimeout(() => setCopyState('idle'), 1600)
    }
  }, [exportText])

  const downloadExport = useCallback(() => {
    if (!exportText || layout === 'cards') return
    downloadTokenPackText(
      layout === 'json' ? paths.tokenPackDownloadJsonName : paths.tokenPackDownloadCssName,
      exportText,
      layout === 'json' ? 'application/json;charset=utf-8' : 'text/css;charset=utf-8',
    )
  }, [exportText, layout])

  const clearImportPreview = useCallback(() => {
    setImportDiff(null)
    setImportJson(null)
  }, [])

  const runImportDryRun = useCallback(
    async (json: string) => {
      setImportBusy(true)
      setError(null)
      try {
        const res = await fetch(paths.routes.apiTokensImport, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ json, dryRun: true }),
        })
        const data = (await res.json()) as {
          error?: string
          diff?: PackImportDiff
        }
        if (!res.ok || !data.diff) {
          if (data.error === 'import_too_large') throw new Error(t('tokens.importTooLarge'))
          if (data.error === 'invalid_json') throw new Error(t('tokens.importInvalid'))
          throw new Error(data.error || t('tokens.importFailed'))
        }
        setImportJson(json)
        setImportDiff(data.diff)
      } catch (e) {
        clearImportPreview()
        setError(e instanceof Error ? e.message : t('tokens.importFailed'))
      } finally {
        setImportBusy(false)
      }
    },
    [clearImportPreview, t],
  )

  const applyImport = useCallback(async () => {
    if (!importJson) return
    setImportBusy(true)
    setError(null)
    try {
      const res = await fetch(paths.routes.apiTokensImport, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ json: importJson, dryRun: false }),
      })
      const data = (await res.json()) as { error?: string; applied?: number }
      if (!res.ok) {
        if (data.error === 'import_too_large') throw new Error(t('tokens.importTooLarge'))
        throw new Error(data.error || t('tokens.importFailed'))
      }
      clearImportPreview()
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('tokens.importFailed'))
    } finally {
      setImportBusy(false)
    }
  }, [clearImportPreview, importJson, load, t])

  const selected = rows.find((row) => row.path === selectedPath) ?? pack?.tokens.find((row) => row.path === selectedPath) ?? null
  const origin = selected && pack ? pack.origins[selected.path] ?? 'fixture' : null
  const selectedOriginKind =
    selected && origin ? catalogOriginKind(origin, selected.path, FIXTURE_PATHS) : null
  const selectedFixtureBaseline =
    selected && selectedOriginKind === 'override'
      ? fixtureBaselineForPath(selected.path, FIXTURE_LEAVES)
      : null
  const canWrite = Boolean(pack?.canWrite)

  const previewLeaf = useMemo(() => {
    if (!selected) return null
    let value: string | null = null
    if (isStudioScalarType(selected.type)) {
      value = applyDigitalScalar(selected.type, selected.value, editScalar)
    } else if (selected.type === 'typography') {
      value = applyTypographyDigital(selected.value, editTypo)
    } else if (selected.type === 'shadow') {
      value = applyShadowDigital(selected.value, editShadow)
    } else if (selected.type === 'glow') {
      value = applyGlowDigital(selected.value, editGlow)
    } else if (selected.type === 'effect') {
      value = applyEffectDigital(selected.value, editEffect)
    } else if (selected.type === 'motion') {
      value = applyMotionDigital(selected.value, editMotion)
    } else if (selected.type === 'asset') {
      value = applyAssetDigital(selected.value, editAsset)
    } else if (selected.type === 'artboard') {
      value = applyArtboardDigital(selected.value, editArtboard)
    } else if (selected.type === 'media') {
      value = applyMediaDigital(selected.value, editMedia)
    }
    return { ...selected, value: value ?? selected.value }
  }, [
    selected,
    editScalar,
    editTypo,
    editShadow,
    editGlow,
    editEffect,
    editMotion,
    editAsset,
    editArtboard,
    editMedia,
  ])

  const dockOpen = Boolean(selectedPath) || addOpen

  const composeCandidates = useMemo(() => {
    if (!pack) return [] as string[]
    const activeType = addOpen ? addType : selected?.type
    const selfPath = addOpen ? addPath.trim() : selected?.path
    if (activeType !== 'color' && activeType !== 'spacing') return []
    const currentDigital = addOpen ? addScalar : editScalar
    const rows = pack.tokens
      .filter((leaf) => leaf.type === activeType && leaf.path !== selfPath)
      .map((leaf) => ({
        path: leaf.path,
        digital: readDigitalScalar(leaf.type, leaf.value) ?? '',
      }))
    return listSmartComposeCandidates({
      leafPath: selfPath || '',
      candidates: rows,
      resolveCss,
      currentDigital,
    })
  }, [pack, addOpen, addType, addPath, addScalar, selected, editScalar, resolveCss])

  const measureDock = useCallback(() => {
    const anchorKey = addOpen
      ? createAnchor
        ? createCardKey(createAnchor.type, createAnchor.family)
        : null
      : selectedPath
    if (!anchorKey) {
      setDockPos(null)
      return
    }
    const el = cardRefs.current.get(anchorKey)
    if (!el) return
    const rect = el.getBoundingClientRect()
    const midX = rect.left + rect.width / 2
    const preferRight = midX < window.innerWidth / 2
    const side: 'left' | 'right' = preferRight ? 'right' : 'left'
    setDockSide(side)
    const dockWidth = 320
    const gap = 12
    const left = preferRight
      ? Math.min(rect.right + gap, window.innerWidth - dockWidth - 16)
      : Math.max(16, rect.left - dockWidth - gap)
    const top = Math.max(16, Math.min(rect.top, window.innerHeight - 360))
    setDockPos({ top, left })
  }, [selectedPath, addOpen, createAnchor])

  const closeDock = useCallback(() => {
    if (busy) return
    setRenaming(false)
    setSelectedPath(null)
    setAddOpen(false)
    setCreateAnchor(null)
    setDockPos(null)
    syncFocusUrl(null)
  }, [busy, syncFocusUrl])

  function openCreateInGroup(type: string, family: string) {
    setSelectedPath(null)
    setRenaming(false)
    setAddOpen(true)
    setCreateAnchor({ type, family })
    syncFocusUrl(null)
    setAddType(type)
    setAddPath(suggestGroupTokenPath(type, family))
    setAddScalar(defaultScalar(type))
    setAddTypo(EMPTY_TYPO)
    setAddShadow(DEFAULT_SHADOW_DIGITAL)
    setAddGlow(DEFAULT_GLOW_DIGITAL)
    setAddEffect(DEFAULT_EFFECT_DIGITAL)
    setAddMotion(DEFAULT_MOTION_DIGITAL)
    setAddAsset(EMPTY_ASSET)
    setAddArtboard(emptyArtboardDraft())
    setAddMedia(emptyMediaDraft())
    setError(null)
  }

  function beginNewGroup(type: string) {
    setGroupDraftType(type)
    setGroupDraftSlug('')
    setGroupDraftError(null)
  }

  function cancelNewGroup() {
    setGroupDraftType(null)
    setGroupDraftSlug('')
    setGroupDraftError(null)
  }

  function commitNewGroup(type: string) {
    const family = normalizeFamilySlug(groupDraftSlug)
    if (!family) {
      setGroupDraftError(t('tokens.groupInvalid'))
      return
    }
    const exists =
      groups.some(
        (group) =>
          group.type === type && group.families.some((fam) => fam.family === family),
      ) || emptyFamilies.some((shell) => shell.type === type && shell.family === family)
    if (!exists) {
      setEmptyFamilies((prev) => [...prev, { type, family }])
    }
    cancelNewGroup()
    openCreateInGroup(type, family)
  }

  useLayoutEffect(() => {
    measureDock()
  }, [
    measureDock,
    selected,
    addOpen,
    createAnchor,
    addType,
    editScalar,
    editTypo,
    editShadow,
    editGlow,
    editEffect,
    editMotion,
    addScalar,
    addTypo,
    addShadow,
    addGlow,
    addEffect,
    addMotion,
  ])

  useEffect(() => {
    if (!dockOpen) return
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      // Portaled Select closes itself on Escape first; keep the dock open.
      if (document.querySelector('[data-testid="ds-select-menu-portal"]')) return
      if (renaming) {
        setRenaming(false)
        return
      }
      closeDock()
    }
    function onScroll() {
      measureDock()
    }
    function onPointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null
      if (!target) return
      if (dockRef.current?.contains(target)) return
      if (target.closest('[data-testid^="token-card-"]')) return
      // @zaoly/ui Select menus portal to document.body — not "outside" the dock.
      if (target.closest('[data-testid="ds-select-menu-portal"], .ds-select-menu')) return
      closeDock()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onScroll)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('mousedown', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onScroll)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('mousedown', onPointerDown)
    }
  }, [dockOpen, measureDock, closeDock, renaming])

  const focusLeaf = useCallback(
    (leaf: ZaolyPackLeaf) => {
      setLayout('cards')
      setStatusFilter('all')
      setAddOpen(false)
      setCreateAnchor(null)
      setRenaming(false)
      setError(null)
      if (isStudioScalarType(leaf.type)) {
        setEditScalar(readDigitalScalar(leaf.type, leaf.value) ?? '')
      } else if (leaf.type === 'typography') {
        setEditTypo(readTypographyDigitalDraft(leaf.value))
      } else if (leaf.type === 'shadow') {
        setEditShadow(readShadowDigitalDraft(leaf.value))
      } else if (leaf.type === 'glow') {
        setEditGlow(readGlowDigitalDraft(leaf.value))
      } else if (leaf.type === 'effect') {
        setEditEffect(readEffectDigitalDraft(leaf.value))
      } else if (leaf.type === 'motion') {
        setEditMotion(readMotionDigitalDraft(leaf.value))
      } else if (leaf.type === 'asset') {
        setEditAsset(readAssetDigitalDraft(leaf.value))
      } else if (leaf.type === 'artboard') {
        setEditArtboard(readArtboardDigitalDraft(leaf.value))
      } else if (leaf.type === 'media') {
        setEditMedia(readMediaDigitalDraft(leaf.value))
      }
      setSelectedPath(leaf.path)
      syncFocusUrl(leaf.path)
    },
    [syncFocusUrl],
  )

  useEffect(() => {
    if (!pack || !focusParam) return
    if (focusedOnceRef.current === focusParam) return
    const leaf = pack.tokens.find((row) => row.path === focusParam && row.status !== 'pending')
    if (!leaf) return
    focusedOnceRef.current = focusParam
    focusLeaf(leaf)
  }, [pack, focusParam, focusLeaf])

  function hydrateDraft(leaf: ZaolyPackLeaf) {
    if (isStudioScalarType(leaf.type)) {
      setEditScalar(readDigitalScalar(leaf.type, leaf.value) ?? '')
    } else if (leaf.type === 'typography') {
      setEditTypo(readTypographyDigitalDraft(leaf.value))
    } else if (leaf.type === 'shadow') {
      setEditShadow(readShadowDigitalDraft(leaf.value))
    } else if (leaf.type === 'glow') {
      setEditGlow(readGlowDigitalDraft(leaf.value))
    } else if (leaf.type === 'effect') {
      setEditEffect(readEffectDigitalDraft(leaf.value))
    } else if (leaf.type === 'motion') {
      setEditMotion(readMotionDigitalDraft(leaf.value))
    } else if (leaf.type === 'asset') {
      setEditAsset(readAssetDigitalDraft(leaf.value))
    } else if (leaf.type === 'artboard') {
      setEditArtboard(readArtboardDigitalDraft(leaf.value))
    } else if (leaf.type === 'media') {
      setEditMedia(readMediaDigitalDraft(leaf.value))
    }
  }

  async function saveLeaf(
    leaf: ZaolyPackLeaf,
    opts?: { fromPath?: string; keepOpen?: boolean },
  ) {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(paths.routes.apiTokens, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          path: leaf.path,
          type: leaf.type,
          value: leaf.value,
          ...(opts?.fromPath ? { fromPath: opts.fromPath } : {}),
        }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        if (data.error === 'path_exists') throw new Error(t('tokens.exists'))
        if (data.error === 'invalid_path') throw new Error(t('tokens.invalidPath'))
        if (data.error === 'expr_cycle') throw new Error(t('tokens.composeCycle'))
        if (data.error === 'value_too_large') throw new Error(t('tokens.valueTooLarge'))
        if (data.error === 'invalid_value' || data.error === 'invalid_type') {
          throw new Error(t('tokens.invalidValue'))
        }
        throw new Error(data.error || t('tokens.saveFailed'))
      }
      await load()
      if (opts?.keepOpen) {
        setSelectedPath(leaf.path)
        setRenaming(false)
        setAddOpen(false)
        setCreateAnchor(null)
        syncFocusUrl(leaf.path)
      } else {
        setSelectedPath(null)
        setAddOpen(false)
        setCreateAnchor(null)
        setRenaming(false)
        syncFocusUrl(null)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('tokens.saveFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function revertSelected() {
    if (!selected) return
    setBusy(true)
    setError(null)
    try {
      const url = `${paths.routes.apiTokens}?${paths.tokenPackPathQueryKey}=${encodeURIComponent(selected.path)}`
      const res = await fetch(url, { method: 'DELETE' })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error || t('tokens.revertFailed'))
      await load()
      setSelectedPath(null)
      syncFocusUrl(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('tokens.revertFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function revertAllOverrides() {
    if (!pack || !canWrite || busy) return
    const overridePaths = pack.tokens
      .filter((leaf) => {
        const origin = pack.origins[leaf.path] ?? 'fixture'
        return origin === 'local' && FIXTURE_PATHS.has(leaf.path)
      })
      .map((leaf) => leaf.path)
    if (overridePaths.length === 0) return
    setBusy(true)
    setError(null)
    try {
      for (const tokenPath of overridePaths) {
        const url = `${paths.routes.apiTokens}?${paths.tokenPackPathQueryKey}=${encodeURIComponent(tokenPath)}`
        const res = await fetch(url, { method: 'DELETE' })
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null
          throw new Error(data?.error || t('tokens.revertFailed'))
        }
      }
      await load()
      setSelectedPath(null)
      syncFocusUrl(null)
      setStatusFilter('all')
    } catch (e) {
      setError(e instanceof Error ? e.message : t('tokens.revertFailed'))
    } finally {
      setBusy(false)
    }
  }

  function draftValueForSelected(): string | null {
    if (!selected) return null
    if (
      isStudioScalarType(selected.type) &&
      looksLikeTokenExpr(editScalar) &&
      wouldCreateCycle(selected.path, editScalar, resolveCss)
    ) {
      setError(t('tokens.composeCycle'))
      return null
    }
    let value: string | null = null
    if (isStudioScalarType(selected.type)) {
      value = applyDigitalScalar(selected.type, selected.value, editScalar)
    } else if (selected.type === 'typography') {
      value = applyTypographyDigital(selected.value, editTypo)
    } else if (selected.type === 'shadow') {
      value = applyShadowDigital(selected.value, editShadow)
    } else if (selected.type === 'glow') {
      value = applyGlowDigital(selected.value, editGlow)
    } else if (selected.type === 'effect') {
      value = applyEffectDigital(selected.value, editEffect)
    } else if (selected.type === 'motion') {
      value = applyMotionDigital(selected.value, editMotion)
    } else if (selected.type === 'asset') {
      value = applyAssetDigital(selected.value, editAsset)
    } else if (selected.type === 'artboard') {
      value = applyArtboardDigital(selected.value, editArtboard)
    } else if (selected.type === 'media') {
      value = applyMediaDigital(selected.value, editMedia)
    }
    if (!value) {
      setError(t('tokens.invalid'))
      return null
    }
    return value
  }

  function commitSelected() {
    if (!selected) return
    const value = draftValueForSelected()
    if (!value) return
    void saveLeaf({ ...selected, value })
  }

  function beginRename() {
    if (!selected || !canWrite || addOpen || busy) return
    setRenameDraft(selected.path)
    setRenaming(true)
    setError(null)
  }

  function commitRename() {
    if (!selected || !renaming) return
    const nextPath = renameDraft.trim()
    if (nextPath === selected.path) {
      setRenaming(false)
      return
    }
    if (!isValidStudioTokenPath(nextPath, selected.type)) {
      setError(t('tokens.invalidPath'))
      return
    }
    if (pack?.tokens.some((leaf) => leaf.path === nextPath)) {
      setError(t('tokens.exists'))
      return
    }
    const value = draftValueForSelected()
    if (!value) return
    // Cycle check against the new path as well.
    if (
      isStudioScalarType(selected.type) &&
      looksLikeTokenExpr(editScalar) &&
      wouldCreateCycle(nextPath, editScalar, resolveCss)
    ) {
      setError(t('tokens.composeCycle'))
      return
    }
    void saveLeaf(
      { ...selected, path: nextPath, value },
      { fromPath: selected.path, keepOpen: true },
    )
  }

  function commitAdd() {
    const tokenPath = addPath.trim()
    if (!isValidStudioTokenPath(tokenPath, addType)) {
      setError(t('tokens.invalidPath'))
      return
    }
    if (pack?.tokens.some((leaf) => leaf.path === tokenPath)) {
      setError(t('tokens.exists'))
      return
    }
    if (isStudioScalarType(addType) && looksLikeTokenExpr(addScalar) && wouldCreateCycle(tokenPath, addScalar, resolveCss)) {
      setError(t('tokens.composeCycle'))
      return
    }
    let value: string | null = null
    if (isStudioScalarType(addType)) {
      value = applyDigitalScalar(addType, null, addScalar)
    } else if (addType === 'typography') {
      value = buildTypographyValue(addTypo)
    } else if (addType === 'shadow') {
      value = buildShadowValue(addShadow)
    } else if (addType === 'glow') {
      value = buildGlowValue(addGlow)
    } else if (addType === 'effect') {
      value = buildEffectValue(addEffect)
    } else if (addType === 'motion') {
      value = buildMotionValue(addMotion)
    } else if (addType === 'artboard') {
      value = buildArtboardValue(addArtboard)
    } else if (addType === 'media') {
      value = buildMediaValue(addMedia)
    } else if (addType === 'asset') {
      value = buildAssetValue(addAsset)
    }
    if (!value) {
      setError(t('tokens.invalid'))
      return
    }
    void saveLeaf({ path: tokenPath, type: addType, value, status: 'active' })
  }

  return (
    <div className="creation-magazine zaoly-token-studio" data-testid="zaoly-token-studio">
      <Panel>
        <div className="zaoly-token-studio__masthead">
          <SectionChrome
            title={t('tokens.catalogTitle')}
            meta={t('tokens.catalogMeta', { count: String(rows.length) })}
          />
          <div
            className="zaoly-token-studio__view-switch"
            role="tablist"
            aria-label={t('tokens.viewAria')}
            data-testid="token-pack-view-switch"
          >
            {(
              [
                ['cards', t('tokens.viewGrid')],
                ['json', t('tokens.viewJson')],
                ['css', t('tokens.viewCss')],
              ] as const
            ).map(([id, label]) => (
              <Chip
                key={id}
                size="sm"
                selected={layout === id}
                onClick={() => {
                  setLayout(id)
                  if (id !== 'json') clearImportPreview()
                  if (id !== 'cards') {
                    setSelectedPath(null)
                    setAddOpen(false)
                    setCreateAnchor(null)
                    setRenaming(false)
                  }
                }}
                data-testid={`token-view-${id}`}
              >
                {label}
              </Chip>
            ))}
          </div>
        </div>
        <header className="zaoly-token-studio__toolbar">
          <Field label={t('tokens.search')}>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('tokens.searchPlaceholder')}
            />
          </Field>
          <div className="zaoly-token-studio__filters" role="tablist" aria-label={t('tokens.filterAria')}>
            {TYPE_FILTERS.map((id) => (
              <Chip
                key={id}
                size="sm"
                selected={typeFilter === id}
                onClick={() => setTypeFilter(id)}
              >
                {id === 'all' ? (
                  t('tokens.filterAll')
                ) : (
                  <span className="zaoly-token-studio__chip">
                    <TokenKindGlyph id={glyphId(id)} />
                    {id}
                  </span>
                )}
              </Chip>
            ))}
          </div>
          <div
            className="zaoly-token-studio__filters zaoly-token-studio__filters--status"
            role="tablist"
            aria-label={t('tokens.statusFilterAria')}
          >
            {(
              [
                ['unresolved', t('tokens.filterUnresolved'), statusCounts.unresolved],
                ['override', t('tokens.filterOverride'), statusCounts.override],
                ['custom', t('tokens.filterCustom'), statusCounts.custom],
              ] as const
            ).map(([id, label, count]) => (
              <Chip
                key={id}
                size="sm"
                selected={statusFilter === id}
                onClick={() => toggleStatusFilter(id)}
                data-testid={`token-filter-${id}`}
              >
                {label} · {count}
              </Chip>
            ))}
          </div>
          {canWrite && statusCounts.override > 0 ? (
            <Button
              type="button"
              size="sm"
              variant="subtle"
              disabled={busy}
              onClick={() => void revertAllOverrides()}
              data-testid="token-revert-all-overrides"
            >
              {t('tokens.revertAllOverrides')}
            </Button>
          ) : null}
        </header>
        <Hint>{t('tokens.hint')}</Hint>
        {error ? <p className="zaoly-token-studio__error">{error}</p> : null}
      </Panel>

      <div className="zaoly-token-studio__deck">
        {!pack ? (
          <EmptyState>{t('tokens.loading')}</EmptyState>
        ) : rows.length === 0 && emptyFamilies.length === 0 ? (
          <EmptyState data-testid="token-catalog-empty">{emptyCatalogMessage}</EmptyState>
        ) : layout !== 'cards' ? (
          <section className="zaoly-token-studio__export" data-testid={`token-pack-${layout}`}>
            <div className="zaoly-token-studio__export-toolbar">
              <SectionChrome
                quiet
                title={layout === 'json' ? t('tokens.viewJson') : t('tokens.viewCss')}
                meta={t('tokens.catalogMeta', { count: String(rows.length) })}
              />
              <div className="zaoly-token-studio__export-actions">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => void copyExport()}
                  data-testid="token-pack-copy"
                >
                  {copyState === 'ok'
                    ? t('tokens.copyOk')
                    : copyState === 'err'
                      ? t('tokens.copyFailed')
                      : t('tokens.copy')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={downloadExport}
                  data-testid="token-pack-download"
                >
                  {t('tokens.download')}
                </Button>
                {layout === 'json' && canWrite ? (
                  <>
                    <input
                      ref={importInputRef}
                      type="file"
                      accept="application/json,.json"
                      className="zaoly-token-studio__import-input"
                      data-testid="token-pack-import-input"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        e.target.value = ''
                        if (!file) return
                        void file.text().then((text) => runImportDryRun(text))
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={importBusy}
                      onClick={() => importInputRef.current?.click()}
                      data-testid="token-pack-import"
                    >
                      {t('tokens.import')}
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
            {importDiff ? (
              <div className="zaoly-token-studio__import-diff" data-testid="token-pack-import-diff">
                <p>
                  {t('tokens.importDiff', {
                    create: String(importDiff.create.length),
                    update: String(importDiff.update.length),
                    unchanged: String(importDiff.unchanged.length),
                    invalid: String(importDiff.invalid.length),
                  })}
                </p>
                <div className="zaoly-token-studio__export-actions">
                  <Button
                    type="button"
                    size="sm"
                    disabled={
                      importBusy ||
                      (importDiff.create.length === 0 && importDiff.update.length === 0)
                    }
                    onClick={() => void applyImport()}
                    data-testid="token-pack-import-apply"
                  >
                    {t('tokens.importApply')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={importBusy}
                    onClick={clearImportPreview}
                    data-testid="token-pack-import-cancel"
                  >
                    {t('tokens.cancel')}
                  </Button>
                </div>
              </div>
            ) : null}
            <pre className="zaoly-token-studio__export-code" tabIndex={0}>
              <code>{exportText}</code>
            </pre>
          </section>
        ) : (
          groups.map((group, groupIndex) => {
            const typeCount = group.families.reduce(
              (n, fam) => n + fam.clusters.reduce((m, c) => m + c.leaves.length, 0),
              0,
            )
            const creatingGroup = groupDraftType === group.type
            return (
              <section
                key={group.type}
                className="zaoly-token-studio__chapter"
                data-testid={`token-chapter-${group.type}`}
              >
                <div className="zaoly-token-studio__chapter-head">
                  <SectionChrome quiet title={group.type} meta={String(typeCount)} />
                  {canWrite ? (
                    creatingGroup ? (
                      <form
                        className="zaoly-token-studio__group-draft"
                        data-testid={`token-group-draft-${group.type}`}
                        onSubmit={(e) => {
                          e.preventDefault()
                          commitNewGroup(group.type)
                        }}
                      >
                        <Field label={t('tokens.groupName')}>
                          <Input
                            value={groupDraftSlug}
                            onChange={(e) => {
                              setGroupDraftSlug(e.target.value)
                              setGroupDraftError(null)
                            }}
                            placeholder={t('tokens.groupNamePlaceholder')}
                            autoFocus
                            data-testid={`token-group-slug-${group.type}`}
                            spellCheck={false}
                            autoComplete="off"
                          />
                        </Field>
                        <div className="zaoly-token-studio__group-draft-actions">
                          <Button type="submit" size="sm" data-testid={`token-group-submit-${group.type}`}>
                            {t('tokens.groupCreate')}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={cancelNewGroup}
                            data-testid={`token-group-cancel-${group.type}`}
                          >
                            {t('tokens.cancel')}
                          </Button>
                        </div>
                        {groupDraftError ? (
                          <p className="zaoly-token-studio__error" role="alert">
                            {groupDraftError}
                          </p>
                        ) : null}
                      </form>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => beginNewGroup(group.type)}
                        data-testid={`token-group-new-${group.type}`}
                      >
                        {t('tokens.groupNew')}
                      </Button>
                    )
                  ) : null}
                </div>
                {group.families.map((family) => {
                  const createKey = createCardKey(group.type, family.family)
                  const createActive =
                    addOpen &&
                    createAnchor?.type === group.type &&
                    createAnchor.family === family.family
                  return (
                    <div
                      key={family.family}
                      className="zaoly-token-studio__family"
                      data-testid={`token-family-${group.type}-${family.family}`}
                    >
                      <header className="zaoly-token-studio__family-head">
                        <h3 className="zaoly-token-studio__family-title">{family.label}</h3>
                        <span className="zaoly-token-studio__family-meta">
                          {family.clusters.reduce((n, c) => n + c.leaves.length, 0)}
                        </span>
                      </header>
                      {canWrite ? (
                        <ul
                          className="ds-hub-index-grid zaoly-token-studio__grid zaoly-token-studio__grid--create"
                          aria-label={
                            groupIndex === 0 && family === group.families[0]
                              ? t('tokens.catalogAria')
                              : t('tokens.groupAddAria', { group: family.label })
                          }
                        >
                          <li
                            ref={(node) => {
                              if (node) cardRefs.current.set(createKey, node)
                              else cardRefs.current.delete(createKey)
                            }}
                            className={
                              createActive
                                ? 'zaoly-token-studio__card-slot is-pinned'
                                : 'zaoly-token-studio__card-slot'
                            }
                          >
                            <HubIndexCard
                              variant="create"
                              className={createActive ? 'is-selected' : undefined}
                              data-testid={`token-card-create-${group.type}-${family.family}`}
                              title={t('tokens.add')}
                              meta={suggestGroupTokenPath(group.type, family.family)}
                              onClick={() => openCreateInGroup(group.type, family.family)}
                            />
                          </li>
                        </ul>
                      ) : null}
                      {family.clusters.map((cluster) => {
                        const showCluster =
                          cluster.leaves.length > 1 || family.clusters.length > 1
                        return (
                          <div
                            key={cluster.cluster}
                            className="zaoly-token-studio__cluster"
                            data-testid={`token-cluster-${group.type}-${family.family}-${cluster.cluster}`}
                          >
                            {showCluster ? (
                              <header className="zaoly-token-studio__cluster-head">
                                <h4 className="zaoly-token-studio__cluster-title">
                                  {cluster.label}
                                </h4>
                                <span className="zaoly-token-studio__cluster-meta">
                                  {cluster.leaves.length}
                                </span>
                              </header>
                            ) : null}
                            <ul className="ds-hub-index-grid zaoly-token-studio__grid">
                              {cluster.leaves.map((leaf) => {
                                const active = leaf.path === selectedPath
                                const leafOrigin = pack.origins[leaf.path] ?? 'fixture'
                                const mediaLeaf = active && previewLeaf ? previewLeaf : leaf
                                const status = catalogLeafStatus(
                                  leaf,
                                  leafOrigin,
                                  FIXTURE_PATHS,
                                  resolveCss,
                                )
                                const fixtureBaseline =
                                  status.kind === 'override'
                                    ? fixtureBaselineForPath(leaf.path, FIXTURE_LEAVES)
                                    : null
                                const preview =
                                  previewCss(
                                    active && previewLeaf ? previewLeaf : leaf,
                                    resolveCss,
                                  ) ||
                                  displayValue(active && previewLeaf ? previewLeaf : leaf)
                                const originLabel =
                                  status.kind === 'override'
                                    ? t('tokens.originOverride')
                                    : status.kind === 'custom'
                                      ? t('tokens.originCustom')
                                      : null
                                const showStatus =
                                  originLabel != null || status.unresolved
                                return (
                                  <li
                                    key={leaf.path}
                                    ref={(node) => {
                                      if (node) cardRefs.current.set(leaf.path, node)
                                      else cardRefs.current.delete(leaf.path)
                                    }}
                                    className={
                                      active
                                        ? 'zaoly-token-studio__card-slot is-pinned'
                                        : 'zaoly-token-studio__card-slot'
                                    }
                                    data-origin-kind={status.kind}
                                    data-unresolved={status.unresolved ? 'true' : undefined}
                                  >
                                    <HubIndexCard
                                      className={active ? 'is-selected' : undefined}
                                      data-testid={`token-card-${leaf.path}`}
                                      aria-pressed={active}
                                      title={tokenPathCardLabel(leaf.path)}
                                      media={
                                        <TokenCardMedia leaf={mediaLeaf} resolveCss={resolveCss} />
                                      }
                                      meta={
                                        <>
                                          <span>
                                            {leaf.path} ·{' '}
                                            {status.unresolved ? displayValue(leaf) : preview}
                                          </span>
                                          {fixtureBaseline ? (
                                            <span
                                              className="zaoly-token-studio__fixture-was"
                                              data-testid={`token-fixture-was-${leaf.path}`}
                                            >
                                              {t('tokens.fixtureWas', {
                                                value: displayValue(fixtureBaseline),
                                              })}
                                            </span>
                                          ) : null}
                                        </>
                                      }
                                      onClick={() => {
                                        focusLeaf(leaf)
                                      }}
                                    />
                                    {/* Status badges outside HubIndexCard (button) — no nested <button>. Fixture is silent (default). */}
                                    {showStatus ? (
                                      <div className="zaoly-token-studio__status">
                                        {originLabel ? (
                                          <button
                                            type="button"
                                            className={`zaoly-token-studio__badge zaoly-token-studio__badge--${status.kind}`}
                                            data-testid={`token-origin-${leaf.path}`}
                                            aria-label={t('tokens.statusFilterAria')}
                                            onClick={(e) => {
                                              e.preventDefault()
                                              e.stopPropagation()
                                              if (status.kind === 'override' || status.kind === 'custom') {
                                                toggleStatusFilter(status.kind)
                                              }
                                            }}
                                          >
                                            {originLabel}
                                          </button>
                                        ) : null}
                                        {status.unresolved ? (
                                          <button
                                            type="button"
                                            className="zaoly-token-studio__badge zaoly-token-studio__badge--unresolved"
                                            data-testid={`token-unresolved-${leaf.path}`}
                                            aria-label={t('tokens.filterUnresolved')}
                                            onClick={(e) => {
                                              e.preventDefault()
                                              e.stopPropagation()
                                              toggleStatusFilter('unresolved')
                                            }}
                                          >
                                            {t('tokens.unresolved')}
                                          </button>
                                        ) : null}
                                      </div>
                                    ) : null}
                                  </li>
                                )
                              })}
                            </ul>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </section>
            )
          })
        )}
      </div>

      {dockOpen && dockPos ? (
        <aside
          ref={dockRef}
          className={`zaoly-token-studio__edit-dock zaoly-token-studio__edit-dock--${dockSide}`}
          data-testid="token-edit-dock"
          data-mode={addOpen ? 'create' : 'edit'}
          style={{ top: dockPos.top, left: dockPos.left }}
        >
          <header className="zaoly-token-studio__edit-dock-head">
            <div>
              <p className="zaoly-token-studio__dialog-kicker">
                <span>{addOpen ? addType : selected?.type}</span>
                {addOpen ? (
                  <span>{t('tokens.addMeta')}</span>
                ) : selectedOriginKind === 'override' ? (
                  <span>{t('tokens.originOverride')}</span>
                ) : selectedOriginKind === 'custom' ? (
                  <span>{t('tokens.originCustom')}</span>
                ) : null}
              </p>
              <h2 className="zaoly-token-studio__edit-dock-title">
                {addOpen ? (
                  addPath.trim() || t('tokens.add')
                ) : renaming ? (
                  <input
                    autoFocus
                    className="ds-input ds-input--sm zaoly-token-studio__edit-dock-title-input"
                    value={renameDraft}
                    disabled={busy}
                    aria-label={t('tokens.renamePath')}
                    data-testid="token-rename-input"
                    spellCheck={false}
                    autoComplete="off"
                    onChange={(e) => setRenameDraft(e.target.value)}
                    onFocus={(e) => e.currentTarget.select()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        commitRename()
                      }
                      if (e.key === 'Escape') {
                        e.preventDefault()
                        e.stopPropagation()
                        setRenaming(false)
                      }
                    }}
                    onBlur={() => {
                      if (!busy) commitRename()
                    }}
                  />
                ) : canWrite && selected ? (
                  <button
                    type="button"
                    className="zaoly-token-studio__edit-dock-title-btn"
                    title={t('tokens.renameHint')}
                    data-testid="token-rename-trigger"
                    onClick={beginRename}
                  >
                    {selected.path}
                  </button>
                ) : (
                  selected?.path
                )}
              </h2>
            </div>
            {selectedFixtureBaseline ? (
              <p
                className="zaoly-token-studio__fixture-baseline"
                data-testid="token-fixture-baseline"
              >
                <span>{t('tokens.fixtureBaseline')}</span>
                <code>{displayValue(selectedFixtureBaseline)}</code>
              </p>
            ) : null}
            <div className="zaoly-token-studio__edit-dock-actions">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={busy}
                onMouseDown={(e) => {
                  if (renaming) e.preventDefault()
                }}
                onClick={closeDock}
              >
                {t('tokens.cancel')}
              </Button>
              {!addOpen && canWrite && origin === 'local' ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onMouseDown={(e) => {
                    if (renaming) e.preventDefault()
                  }}
                  onClick={() => void revertSelected()}
                >
                  {t('tokens.revert')}
                </Button>
              ) : null}
              {addOpen ? (
                <Button type="button" size="sm" disabled={busy} onClick={commitAdd}>
                  {t('tokens.addSubmit')}
                </Button>
              ) : canWrite ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={busy}
                  onMouseDown={(e) => {
                    if (renaming) e.preventDefault()
                  }}
                  onClick={commitSelected}
                >
                  {t('tokens.save')}
                </Button>
              ) : null}
            </div>
          </header>
          {addOpen ? (
            <>
              <div className="zaoly-token-studio__filters">
                {Array.from(STUDIO_EDITABLE_TYPES).map((id) => (
                  <Chip
                    key={id}
                    size="sm"
                    selected={addType === id}
                    onClick={() => {
                      setAddType(id)
                      if (isStudioScalarType(id)) setAddScalar(defaultScalar(id))
                    }}
                  >
                    <span className="zaoly-token-studio__chip">
                      <TokenKindGlyph id={glyphId(id)} />
                      {id}
                    </span>
                  </Chip>
                ))}
              </div>
              <Field label={t('tokens.path')}>
                <Input
                  value={addPath}
                  onChange={(e) => setAddPath(e.target.value)}
                  placeholder={`${addType}.custom.name`}
                />
              </Field>
              <TokenDigitalFields
                type={addType}
                canWrite
                t={t}
                scalar={addScalar}
                setScalar={setAddScalar}
                typo={addTypo}
                setTypo={setAddTypo}
                shadow={addShadow}
                setShadow={setAddShadow}
                glow={addGlow}
                setGlow={setAddGlow}
                effect={addEffect}
                setEffect={setAddEffect}
                motion={addMotion}
                setMotion={setAddMotion}
                asset={addAsset}
                setAsset={setAddAsset}
                artboard={addArtboard}
                setArtboard={setAddArtboard}
                media={addMedia}
                setMedia={setAddMedia}
                onSubmit={commitAdd}
                composeCandidates={composeCandidates}
                resolveCss={resolveCss}
              />
            </>
          ) : selected ? (
            <>
              <TokenDigitalFields
                type={selected.type}
                canWrite={canWrite}
                t={t}
                scalar={editScalar}
                setScalar={setEditScalar}
                typo={editTypo}
                setTypo={setEditTypo}
                shadow={editShadow}
                setShadow={setEditShadow}
                glow={editGlow}
                setGlow={setEditGlow}
                effect={editEffect}
                setEffect={setEditEffect}
                motion={editMotion}
                setMotion={setEditMotion}
                asset={editAsset}
                setAsset={setEditAsset}
                artboard={editArtboard}
                setArtboard={setEditArtboard}
                media={editMedia}
                setMedia={setEditMedia}
                onSubmit={commitSelected}
                composeCandidates={composeCandidates}
                resolveCss={resolveCss}
              />
              {!canWrite ? <Hint>{t('tokens.readOnly')}</Hint> : null}
            </>
          ) : null}
        </aside>
      ) : null}
    </div>
  )
}
