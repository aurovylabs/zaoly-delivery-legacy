'use client'

import { useEffect, useMemo, useState, type DragEvent } from 'react'
import { Button, Dialog, Input, Text, TokenKindGlyph, TokenPreview, tokenKindGlyphId } from '@zaoly/ui'
import type { TokenPreviewKind } from '@zaoly/ui'
import {
  applyAssetDigital,
  applyDigitalScalar,
  applyShadowDigital,
  applyTypographyDigital,
  buildAssetValue,
  buildShadowValue,
  buildTypographyValue,
  DEFAULT_SHADOW_DIGITAL,
  isStudioSharedWritableType,
  isStudioScalarType,
  isStudioStructuredType,
  isValidDigitalHex,
  isValidStudioTokenPath,
  readAssetDigitalDraft,
  readAssetSummary,
  readDigitalScalar,
  readShadowDigitalDraft,
  readShadowSummary,
  readTypographyDigitalDraft,
  readTypographySummary,
  STUDIO_EDITABLE_TYPES,
  studioInputKind,
  type AssetDigitalDraft,
  type ShadowDigitalDraft,
  type TypographyDigitalDraft,
} from '../lib/inspect/digital-edit'
import type {
  BrandTokenPackResponse,
  InspectTokenOption,
  ZaolyPackLeaf,
} from '../lib/inspect/token-catalog'
import { INSPECT_TOKEN_CATALOG } from '../lib/inspect/token-catalog'
import { dispatchOnboardingAction } from '../lib/editor/onboarding'
import {
  BRAND_TOKEN_DND_MIME,
  encodeBrandTokenDragPayload,
  setActiveBrandTokenDrag,
} from '../lib/inspect/token-drop'
import { isBrandPackPromoteWritable } from '../lib/inspect/brand-pack-writable'
import { paths } from '../lib/paths'
import { IconEdit, IconExternalLink } from '../lib/zaoly-ui'
import { useUserPrefs } from '../lib/user-prefs'

type Props = {
  pack: BrandTokenPackResponse | null
  /** Same catalog Inspect/TokenPicker uses (fixture and/or merged live pack). */
  catalog?: InspectTokenOption[]
  onTokenSaved: (token: ZaolyPackLeaf) => void
  /** Pack paths used by the current Kit composition module. */
  highlightPaths?: readonly string[]
}

const ADD_TYPES = Array.from(STUDIO_EDITABLE_TYPES).filter((type) =>
  isStudioSharedWritableType(type),
)

const TYPE_ORDER = [
  'color',
  'spacing',
  'radius',
  'opacity',
  'size',
  'typography',
  'shadow',
  'glow',
  'effect',
  'motion',
  'asset',
] as const

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

function catalogDisplayValue(tok: InspectTokenOption): string {
  if (tok.type === 'typography' && tok.value != null) {
    return readTypographySummary(tok.value) ?? tok.preview ?? '—'
  }
  if (tok.type === 'shadow' && tok.value != null) {
    return readShadowSummary(tok.value)
  }
  if (tok.type === 'asset' && tok.value != null) {
    return readAssetSummary(tok.value)
  }
  if (tok.type && tok.value != null && isStudioScalarType(tok.type)) {
    return readDigitalScalar(tok.type, tok.value) ?? tok.preview ?? '—'
  }
  return tok.preview || '—'
}

/** Short label: last 1–2 path segments (Figma-like). Full path stays on title. */
function shortTokenLabel(path: string): string {
  const parts = path.split('.').filter(Boolean)
  if (parts.length <= 2) return path
  return parts.slice(-2).join('.')
}

function typeLabel(type: string): string {
  if (type === 'spacing') return 'Space'
  if (!type) return 'Other'
  return type.charAt(0).toUpperCase() + type.slice(1)
}

function tokenGroupKey(tok: InspectTokenOption, live?: ZaolyPackLeaf): string {
  const t = live?.type || tok.type || 'other'
  return t
}

function hexForPicker(value: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000'
}

function pathPlaceholder(type: string, t: (key: string) => string): string {
  if (type === 'typography') return t('editor.tokenStudioAddPathTypographyPlaceholder')
  if (type === 'shadow') return t('editor.tokenStudioAddPathShadowPlaceholder')
  if (type === 'asset') return t('editor.tokenStudioAddPathAssetPlaceholder')
  return t('editor.tokenStudioAddPathPlaceholder')
}

export function EditorTokenStudio({
  pack,
  catalog = INSPECT_TOKEN_CATALOG,
  onTokenSaved,
  highlightPaths,
}: Props) {
  const { t } = useUserPrefs()
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const highlightSet = useMemo(() => {
    const set = new Set<string>()
    for (const p of highlightPaths ?? []) {
      const trimmed = typeof p === 'string' ? p.trim() : ''
      if (trimmed) set.add(trimmed)
    }
    return set
  }, [highlightPaths])
  const hasHighlights = highlightSet.size > 0
  /** SK-V16: default on when composition bindings exist. */
  const [usedOnly, setUsedOnly] = useState(hasHighlights)
  useEffect(() => {
    setUsedOnly(hasHighlights)
  }, [hasHighlights])

  // Onboarding tokenPick / tokenBind: filter to color so a top swatch is immediately actionable.
  useEffect(() => {
    const onPrepare = (e: Event) => {
      const stepId = (e as CustomEvent<{ stepId?: string }>).detail?.stepId
      if (stepId !== 'tokenPick' && stepId !== 'tokenBind') return
      setQuery('')
      setUsedOnly(false)
      setTypeFilter('color')
      setAddOpen(false)
    }
    window.addEventListener(paths.onboarding.prepareEvent, onPrepare)
    return () => window.removeEventListener(paths.onboarding.prepareEvent, onPrepare)
  }, [])
  /** Explicit open/closed; unset → first section open, others closed. */
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [savingPath, setSavingPath] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savedPath, setSavedPath] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [addPath, setAddPath] = useState('')
  const [addType, setAddType] = useState<string>('color')
  const [addScalar, setAddScalar] = useState('')
  const [addTypo, setAddTypo] = useState<TypographyDigitalDraft>(EMPTY_TYPO)
  const [addShadow, setAddShadow] = useState<ShadowDigitalDraft>(DEFAULT_SHADOW_DIGITAL)
  const [addAsset, setAddAsset] = useState<AssetDigitalDraft>(EMPTY_ASSET)
  const [editLeaf, setEditLeaf] = useState<ZaolyPackLeaf | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [editTypo, setEditTypo] = useState<TypographyDigitalDraft>(EMPTY_TYPO)
  const [editShadow, setEditShadow] = useState<ShadowDigitalDraft>(DEFAULT_SHADOW_DIGITAL)
  const [editAsset, setEditAsset] = useState<AssetDigitalDraft>(EMPTY_ASSET)

  const enabled = isBrandPackPromoteWritable(pack)
  const localPreview = false
  const addingTypography = addType === 'typography'
  const addingShadow = addType === 'shadow'
  const addingAsset = addType === 'asset'
  const editKind = editLeaf ? studioInputKind(editLeaf.type) : null
  const editingStructured = editLeaf ? isStudioStructuredType(editLeaf.type) : false

  const packByPath = useMemo(() => {
    const map = new Map<string, ZaolyPackLeaf>()
    if (pack && (pack.source === 'local' || pack.source === 'fixture' || pack.localPromotePreview)) {
      for (const leaf of pack.tokens) {
        if (leaf.status === 'pending') continue
        map.set(leaf.path, leaf)
      }
    }
    return map
  }, [pack])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = catalog
      .filter((tok) => tok.status !== 'pending')
      .filter((tok) => !q || tok.path.toLowerCase().includes(q))
      .filter((tok) => {
        if (typeFilter === 'all') return true
        const live = packByPath.get(tok.path)
        return tokenGroupKey(tok, live) === typeFilter
      })
      .filter((tok) => !usedOnly || !hasHighlights || highlightSet.has(tok.path))
    return filtered.sort((a, b) => {
      if (hasHighlights) {
        const aHit = highlightSet.has(a.path) ? 0 : 1
        const bHit = highlightSet.has(b.path) ? 0 : 1
        if (aHit !== bHit) return aHit - bHit
      }
      return a.path.localeCompare(b.path)
    })
  }, [catalog, query, typeFilter, packByPath, usedOnly, hasHighlights, highlightSet])

  const availableTypes = useMemo((): string[] => {
    const set = new Set<string>()
    for (const tok of catalog) {
      if (tok.status === 'pending') continue
      set.add(tokenGroupKey(tok, packByPath.get(tok.path)))
    }
    const known = TYPE_ORDER.filter((ty) => set.has(ty))
    const rest = [...set].filter((ty) => !(TYPE_ORDER as readonly string[]).includes(ty)).sort()
    return [...known, ...rest]
  }, [catalog, packByPath])

  const grouped = useMemo(() => {
    const map = new Map<string, InspectTokenOption[]>()
    for (const tok of rows) {
      const key = tokenGroupKey(tok, packByPath.get(tok.path))
      const list = map.get(key) ?? []
      list.push(tok)
      map.set(key, list)
    }
    const known = TYPE_ORDER.filter((ty) => map.has(ty))
    const rest = [...map.keys()].filter((ty) => !(TYPE_ORDER as readonly string[]).includes(ty)).sort()
    const keys = [...known, ...rest]
    return keys.map((key) => ({ type: key, tokens: map.get(key)! }))
  }, [rows, packByPath])

  useEffect(() => {
    if (!editLeaf) return
    if (isStudioScalarType(editLeaf.type)) {
      setEditDraft(readDigitalScalar(editLeaf.type, editLeaf.value) ?? '')
      return
    }
    if (editLeaf.type === 'typography') {
      setEditTypo(readTypographyDigitalDraft(editLeaf.value))
      return
    }
    if (editLeaf.type === 'shadow') {
      setEditShadow(readShadowDigitalDraft(editLeaf.value))
      return
    }
    if (editLeaf.type === 'asset') {
      setEditAsset(readAssetDigitalDraft(editLeaf.value))
    }
  }, [editLeaf])

  async function patchLeaf(input: {
    path: string
    type: string
    value: string
  }): Promise<ZaolyPackLeaf | null> {
    if (!pack || !isBrandPackPromoteWritable(pack)) return null
    setSavingPath(input.path)
    setError(null)
    setSavedPath(null)

    try {
      const res = await fetch(paths.routes.apiTokens, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({
          path: input.path,
          type: input.type,
          value: input.value,
        }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        setError(body?.error ?? t('editor.tokenStudioSaveFailed'))
        return null
      }
      const body = (await res.json()) as { token?: ZaolyPackLeaf }
      const token =
        body.token ??
        ({
          path: input.path,
          type: input.type,
          value: input.value,
          status: 'active' as const,
        } satisfies ZaolyPackLeaf)
      onTokenSaved(token)
      setSavedPath(input.path)
      return token
    } catch {
      setError(t('editor.tokenStudioSaveFailed'))
      return null
    } finally {
      setSavingPath(null)
    }
  }

  async function saveEditLeaf() {
    if (!editLeaf || !isStudioSharedWritableType(editLeaf.type)) return

    let nextValue: string | null = null
    if (isStudioScalarType(editLeaf.type)) {
      const baseline = readDigitalScalar(editLeaf.type, editLeaf.value) ?? ''
      if (editDraft === baseline) {
        setEditLeaf(null)
        return
      }
      nextValue = applyDigitalScalar(editLeaf.type, editLeaf.value, editDraft)
    } else if (editLeaf.type === 'typography') {
      nextValue = applyTypographyDigital(editLeaf.value, editTypo)
    } else if (editLeaf.type === 'shadow') {
      nextValue = applyShadowDigital(editLeaf.value, editShadow)
    } else if (editLeaf.type === 'asset') {
      nextValue = applyAssetDigital(editLeaf.value, editAsset)
    }

    if (!nextValue) {
      setError(t('editor.tokenStudioInvalid'))
      return
    }
    const token = await patchLeaf({ path: editLeaf.path, type: editLeaf.type, value: nextValue })
    if (!token) return
    setEditLeaf(null)
  }

  function buildAddValue(): string | null {
    if (addingTypography) return buildTypographyValue(addTypo)
    if (addingShadow) return buildShadowValue(addShadow)
    if (addingAsset) return buildAssetValue(addAsset)
    return applyDigitalScalar(addType, '{}', addScalar)
  }

  async function addLeaf() {
    if (!pack || !isBrandPackPromoteWritable(pack)) return
    const pathName = addPath.trim()
    if (!isValidStudioTokenPath(pathName, addType)) {
      setError(t('editor.tokenStudioAddInvalidPath'))
      return
    }
    if (pack.tokens.some((leaf) => leaf.path === pathName) || catalog.some((c) => c.path === pathName)) {
      setError(t('editor.tokenStudioAddExists'))
      return
    }
    const nextValue = buildAddValue()
    if (!nextValue) {
      setError(t('editor.tokenStudioInvalid'))
      return
    }
    const token = await patchLeaf({ path: pathName, type: addType, value: nextValue })
    if (!token) return
    setAddPath('')
    setAddScalar('')
    setAddTypo(EMPTY_TYPO)
    setAddShadow(DEFAULT_SHADOW_DIGITAL)
    setAddAsset(EMPTY_ASSET)
    setAddOpen(false)
  }

  const addKind = studioInputKind(addType)
  const addReady = (() => {
    if (!addPath.trim()) return false
    if (addingTypography) return Boolean(addTypo.family.trim() && addTypo.digitalSize.trim())
    if (addingShadow) {
      return Boolean(addShadow.offsetY.trim() && addShadow.blur.trim() && addShadow.color.trim())
    }
    if (addingAsset) return Boolean(addAsset.src.trim())
    return Boolean(addScalar.trim())
  })()

  const editSaveReady = (() => {
    if (!editLeaf) return false
    if (isStudioScalarType(editLeaf.type)) return Boolean(editDraft.trim())
    if (editLeaf.type === 'typography') {
      return Boolean(editTypo.family.trim() && editTypo.digitalSize.trim())
    }
    if (editLeaf.type === 'shadow') {
      return Boolean(editShadow.offsetY.trim() && editShadow.blur.trim() && editShadow.color.trim())
    }
    if (editLeaf.type === 'asset') return Boolean(editAsset.src.trim())
    return false
  })()

  function isSectionCollapsed(type: string, index: number): boolean {
    if (typeFilter !== 'all' && typeFilter === type) return false
    if (Object.prototype.hasOwnProperty.call(collapsed, type)) {
      return collapsed[type] === true
    }
    return index !== 0
  }

  function toggleSection(type: string, index: number) {
    setCollapsed((prev) => {
      const currently =
        typeFilter !== 'all' && typeFilter === type
          ? false
          : Object.prototype.hasOwnProperty.call(prev, type)
            ? prev[type] === true
            : index !== 0
      return { ...prev, [type]: !currently }
    })
  }

  function openEdit(leaf: ZaolyPackLeaf) {
    setError(null)
    setEditLeaf(leaf)
  }

  function tokenTypeForRow(tok: InspectTokenOption, live?: ZaolyPackLeaf): string {
    return live?.type || tok.type || ''
  }

  function rowDragProps(tok: InspectTokenOption, live?: ZaolyPackLeaf) {
    const typeName = tokenTypeForRow(tok, live)
    if (!typeName || !tok.path) return {}
    return {
      draggable: true as const,
      title: t('editor.tokenStudioDragHint'),
      onPointerDown: () => {
        if (typeName === 'color') dispatchOnboardingAction('tokenPick')
      },
      onDragStart: (event: DragEvent) => {
        if (typeName === 'color') dispatchOnboardingAction('tokenPick')
        const payload = { path: tok.path, type: typeName }
        setActiveBrandTokenDrag(payload)
        event.dataTransfer.setData(BRAND_TOKEN_DND_MIME, encodeBrandTokenDragPayload(payload))
        event.dataTransfer.effectAllowed = 'copy'
      },
      onDragEnd: () => {
        setActiveBrandTokenDrag(null)
      },
      'data-token-draggable': 'true' as const,
    }
  }

  function renderSwatch(preview: string) {
    const hex = preview.trim()
    const ok = /^#[0-9a-fA-F]{3,8}$/.test(hex)
    if (!ok) {
      return <TokenKindGlyph id="color" />
    }
    return (
      <span
        className="creation-editor-token-studio__swatch creation-editor-token-studio__swatch--static"
        style={{ background: hex }}
        aria-hidden
      />
    )
  }

  function previewKindForStudioType(type: string): TokenPreviewKind | null {
    const id = tokenKindGlyphId(type)
    if (id === 'color' || id === 'space' || id === 'radius' || id === 'size' || id === 'opacity' || id === 'type' || id === 'shadow') {
      return id
    }
    return null
  }

  /** Leading chip: value preview when paint-ready, else type metaphor. */
  function renderRowLeading(type: string, preview: string) {
    const kindId = tokenKindGlyphId(type)
    if (kindId === 'color') return renderSwatch(preview)
    const previewKind = previewKindForStudioType(type)
    if (previewKind && preview.trim() && preview !== '—') {
      if (previewKind === 'shadow' && !/(px|rem|em)\b/.test(preview) && !preview.includes(',')) {
        return <TokenKindGlyph id="shadow" />
      }
      return <TokenPreview kind={previewKind} value={preview} size="sm" />
    }
    return <TokenKindGlyph id={kindId === 'all' ? 'color' : kindId} />
  }

  function liveRowPreview(live: ZaolyPackLeaf, tok: InspectTokenOption): string {
    if (live.type === 'typography') return readTypographySummary(live.value) ?? catalogDisplayValue(tok)
    if (live.type === 'shadow') return readShadowSummary(live.value)
    if (live.type === 'asset') return readAssetSummary(live.value)
    if (isStudioScalarType(live.type)) return readDigitalScalar(live.type, live.value) ?? ''
    return catalogDisplayValue(tok)
  }

  function renderTypographyFields(
    draft: TypographyDigitalDraft,
    setDraft: (next: TypographyDigitalDraft) => void,
    testPrefix: string,
  ) {
    return (
      <div
        className="creation-editor-token-studio__edit creation-editor-token-studio__edit--typo"
        data-testid={`${testPrefix}-typography`}
      >
        <Input
          block
          size="sm"
          value={draft.family}
          onChange={(event) => setDraft({ ...draft, family: event.target.value })}
          aria-label={t('editor.tokenStudioAddFamily')}
          placeholder={t('editor.tokenStudioAddFamily')}
          data-testid={`${testPrefix}-family`}
        />
        <Input
          block
          size="sm"
          value={draft.weight}
          onChange={(event) => setDraft({ ...draft, weight: event.target.value })}
          aria-label={t('editor.tokenStudioAddWeight')}
          placeholder="400"
          data-testid={`${testPrefix}-weight`}
        />
        <Input
          block
          size="sm"
          value={draft.digitalSize}
          onChange={(event) => setDraft({ ...draft, digitalSize: event.target.value })}
          aria-label={t('editor.tokenStudioAddDigitalSize')}
          placeholder="2rem"
          data-testid={`${testPrefix}-digital-size`}
        />
        <Input
          block
          size="sm"
          value={draft.lineHeight}
          onChange={(event) => setDraft({ ...draft, lineHeight: event.target.value })}
          aria-label={t('editor.tokenStudioAddLineHeight')}
          placeholder="1.4"
          data-testid={`${testPrefix}-line-height`}
        />
      </div>
    )
  }

  function renderShadowFields(
    draft: ShadowDigitalDraft,
    setDraft: (next: ShadowDigitalDraft) => void,
    testPrefix: string,
  ) {
    return (
      <div
        className="creation-editor-token-studio__edit creation-editor-token-studio__edit--structured"
        data-testid={`${testPrefix}-shadow`}
      >
        <Input
          block
          size="sm"
          value={draft.offsetX}
          onChange={(event) => setDraft({ ...draft, offsetX: event.target.value })}
          aria-label={t('editor.tokenStudioShadowOffsetX')}
          placeholder="0"
          data-testid={`${testPrefix}-offset-x`}
        />
        <Input
          block
          size="sm"
          value={draft.offsetY}
          onChange={(event) => setDraft({ ...draft, offsetY: event.target.value })}
          aria-label={t('editor.tokenStudioShadowOffsetY')}
          placeholder="4px"
          data-testid={`${testPrefix}-offset-y`}
        />
        <Input
          block
          size="sm"
          value={draft.blur}
          onChange={(event) => setDraft({ ...draft, blur: event.target.value })}
          aria-label={t('editor.tokenStudioShadowBlur')}
          placeholder="12px"
          data-testid={`${testPrefix}-blur`}
        />
        <Input
          block
          size="sm"
          value={draft.spread}
          onChange={(event) => setDraft({ ...draft, spread: event.target.value })}
          aria-label={t('editor.tokenStudioShadowSpread')}
          placeholder="0"
          data-testid={`${testPrefix}-spread`}
        />
        <Input
          block
          size="sm"
          value={draft.color}
          onChange={(event) => setDraft({ ...draft, color: event.target.value })}
          aria-label={t('editor.tokenStudioShadowColor')}
          placeholder="rgba(0,0,0,0.15)"
          data-testid={`${testPrefix}-color`}
        />
        <label className="creation-editor-token-studio__check">
          <input
            type="checkbox"
            checked={draft.inset}
            onChange={(event) => setDraft({ ...draft, inset: event.target.checked })}
            data-testid={`${testPrefix}-inset`}
          />
          <span>{t('editor.tokenStudioShadowInset')}</span>
        </label>
      </div>
    )
  }

  function renderAssetFields(
    draft: AssetDigitalDraft,
    setDraft: (next: AssetDigitalDraft) => void,
    testPrefix: string,
  ) {
    return (
      <div
        className="creation-editor-token-studio__edit creation-editor-token-studio__edit--structured"
        data-testid={`${testPrefix}-asset`}
      >
        <Input
          block
          size="sm"
          value={draft.label}
          onChange={(event) => setDraft({ ...draft, label: event.target.value })}
          aria-label={t('editor.tokenStudioAssetLabel')}
          placeholder={t('editor.tokenStudioAssetLabel')}
          data-testid={`${testPrefix}-label`}
        />
        <Input
          block
          size="sm"
          value={draft.src}
          onChange={(event) => setDraft({ ...draft, src: event.target.value })}
          aria-label={t('editor.tokenStudioAssetSrc')}
          placeholder="https://…"
          data-testid={`${testPrefix}-src`}
        />
        <Input
          block
          size="sm"
          value={draft.format}
          onChange={(event) => setDraft({ ...draft, format: event.target.value })}
          aria-label={t('editor.tokenStudioAssetFormat')}
          placeholder="svg"
          data-testid={`${testPrefix}-format`}
        />
        <Input
          block
          size="sm"
          value={draft.minWidth}
          onChange={(event) => setDraft({ ...draft, minWidth: event.target.value })}
          aria-label={t('editor.tokenStudioAssetMinWidth')}
          placeholder="120px"
          data-testid={`${testPrefix}-min-width`}
        />
      </div>
    )
  }

  return (
    <div
      className="creation-editor-token-studio"
      role="tabpanel"
      aria-label={t('editor.tokenStudioAria')}
      data-testid="creation-editor-token-studio"
    >
      <div className="creation-editor-token-studio__status" data-testid="token-studio-status">
        <span
          className={
            enabled
              ? 'creation-editor-token-studio__status-pill creation-editor-token-studio__status-pill--live'
              : 'creation-editor-token-studio__status-pill'
          }
        >
          {enabled
            ? localPreview
              ? t('editor.tokenStudioStatusLocalPreview')
              : t('editor.tokenStudioStatusLive')
            : t('editor.tokenStudioStatusReadonly')}
        </span>
        {savingPath ? (
          <span className="creation-editor-token-studio__status-msg">{t('editor.tokenStudioSaving')}</span>
        ) : savedPath ? (
          <span className="creation-editor-token-studio__status-msg">{t('editor.tokenStudioSaved')}</span>
        ) : null}
      </div>

      <div className="creation-editor-token-studio__toolbar">
        <Input
          block
          size="sm"
          className="search-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label={t('editor.tokenStudioSearch')}
          placeholder={t('editor.tokenStudioSearch')}
        />
        <Button
          href={paths.routes.tokens}
          size="sm"
          variant="ghost"
          aria-label={t('editor.tokenStudioOpenHub')}
          title={t('editor.tokenStudioOpenHub')}
          data-testid="token-studio-open-hub"
        >
          <IconExternalLink />
        </Button>
        {enabled ? (
          <Button
            type="button"
            size="sm"
            variant={addOpen ? 'subtle' : 'ghost'}
            aria-expanded={addOpen}
            aria-label={t('editor.tokenStudioAdd')}
            title={t('editor.tokenStudioAdd')}
            onClick={() => setAddOpen((v) => !v)}
            data-testid="token-studio-add-toggle"
          >
            +
          </Button>
        ) : null}
      </div>

      <div
        className="creation-editor-token-studio__chips"
        role="toolbar"
        aria-label={t('editor.tokenStudioFilterAria')}
      >
        <button
          type="button"
          className="creation-editor-token-studio__chip"
          data-active={typeFilter === 'all' ? 'true' : 'false'}
          onClick={() => setTypeFilter('all')}
        >
          <TokenKindGlyph id="all" />
          <span>{t('editor.tokenStudioFilterAll')}</span>
        </button>
        {hasHighlights ? (
          <button
            type="button"
            className="creation-editor-token-studio__chip"
            data-active={usedOnly ? 'true' : 'false'}
            data-testid="token-studio-filter-used"
            onClick={() => setUsedOnly((v) => !v)}
          >
            <TokenKindGlyph id="color" />
            <span>{t('editor.tokenStudioFilterUsed')}</span>
          </button>
        ) : null}
        {availableTypes.map((ty) => (
          <button
            key={ty}
            type="button"
            className="creation-editor-token-studio__chip"
            data-active={typeFilter === ty ? 'true' : 'false'}
            data-testid={`token-studio-filter-${ty}`}
            onClick={() => setTypeFilter(ty)}
          >
            <TokenKindGlyph id={tokenKindGlyphId(ty)} />
            <span>{typeLabel(ty)}</span>
          </button>
        ))}
      </div>

      {error ? (
        <Text role="meta" as="p" className="creation-editor-token-studio__error" data-testid="token-studio-error">
          {error}
        </Text>
      ) : null}

      {enabled && addOpen ? (
        <div className="creation-editor-token-studio__add" data-testid="token-studio-add">
          <Input
            block
            size="sm"
            value={addPath}
            onChange={(event) => setAddPath(event.target.value)}
            aria-label={t('editor.tokenStudioAddPath')}
            placeholder={pathPlaceholder(addType, t)}
            data-testid="token-studio-add-path"
          />
          <label className="creation-editor-token-studio__add-type">
            <span className="visually-hidden">{t('editor.tokenStudioAddType')}</span>
            <div
              className="creation-editor-token-studio__add-type-chips"
              role="group"
              aria-label={t('editor.tokenStudioAddType')}
              data-testid="token-studio-add-type"
            >
              {ADD_TYPES.map((typeName) => {
                const active = addType === typeName
                return (
                  <button
                    key={typeName}
                    type="button"
                    className="creation-editor-token-studio__chip"
                    data-active={active ? 'true' : 'false'}
                    aria-pressed={active}
                    title={typeName}
                    onClick={() => setAddType(typeName)}
                  >
                    <TokenKindGlyph id={tokenKindGlyphId(typeName)} />
                    <span>{typeLabel(typeName)}</span>
                  </button>
                )
              })}
            </div>
          </label>
          {addingTypography
            ? renderTypographyFields(addTypo, setAddTypo, 'token-studio-add')
            : addingShadow
              ? renderShadowFields(addShadow, setAddShadow, 'token-studio-add')
              : addingAsset
                ? renderAssetFields(addAsset, setAddAsset, 'token-studio-add')
                : (
                  <div className="creation-editor-token-studio__edit">
                    {addKind === 'color' ? (
                      <input
                        type="color"
                        className="creation-editor-token-studio__swatch"
                        value={hexForPicker(addScalar)}
                        aria-label={t('editor.tokenStudioAddValue')}
                        onChange={(event) => setAddScalar(event.target.value)}
                      />
                    ) : null}
                    <Input
                      block
                      size="sm"
                      value={addScalar}
                      onChange={(event) => setAddScalar(event.target.value)}
                      aria-label={t('editor.tokenStudioAddValue')}
                      placeholder={
                        addKind === 'color' ? '#112233' : addKind === 'opacity' ? '0.5' : '1rem'
                      }
                      data-testid="token-studio-add-value"
                    />
                  </div>
                )}
          <Button
            type="button"
            size="sm"
            variant="subtle"
            disabled={!addReady || savingPath != null}
            onClick={() => void addLeaf()}
            data-testid="token-studio-add-submit"
          >
            {savingPath && savingPath === addPath.trim()
              ? t('editor.tokenStudioSaving')
              : t('editor.tokenStudioAddSubmit')}
          </Button>
        </div>
      ) : null}

      <div
        className="creation-editor-token-studio__list"
        aria-label={t('editor.tokenStudioCatalogAria')}
        data-testid="token-studio-catalog-list"
      >
        {grouped.map((group, index) => {
          const isCollapsed = isSectionCollapsed(group.type, index)
          return (
            <section
              key={group.type}
              className="creation-editor-token-studio__section"
              data-collapsed={isCollapsed ? 'true' : 'false'}
            >
              <button
                type="button"
                className="creation-editor-token-studio__section-head"
                aria-expanded={!isCollapsed}
                onClick={() => toggleSection(group.type, index)}
              >
                <span aria-hidden className="creation-editor-token-studio__section-chevron">
                  {isCollapsed ? '▸' : '▾'}
                </span>
                <span className="creation-editor-token-studio__section-title">
                  {typeLabel(group.type)}
                </span>
                <span className="creation-editor-token-studio__section-count">{group.tokens.length}</span>
              </button>
              {!isCollapsed ? (
                <ul className="creation-editor-token-studio__section-list">
                  {group.tokens.map((tok) => {
                    const live = packByPath.get(tok.path)
                    const editable =
                      enabled && live && isStudioSharedWritableType(live.type)
                    const highlighted = highlightSet.has(tok.path)
                    const usedBadge = highlighted ? (
                      <span
                        className="creation-editor-token-studio__used-badge"
                        data-testid={`token-studio-used-${tok.path}`}
                      >
                        {t('editor.tokenStudioUsedBadge')}
                      </span>
                    ) : null

                    if (editable && live) {
                      const display = liveRowPreview(live, tok)
                      return (
                        <li
                          key={tok.path}
                          className={
                            highlighted
                              ? 'creation-editor-token-studio__row creation-editor-token-studio__row--editable creation-editor-token-studio__row--used'
                              : 'creation-editor-token-studio__row creation-editor-token-studio__row--editable'
                          }
                          data-saving={savingPath === tok.path ? 'true' : 'false'}
                          data-highlighted={highlighted ? 'true' : 'false'}
                          data-testid={
                            live.type === 'typography'
                              ? `token-studio-typo-${tok.path}`
                              : `token-studio-row-${tok.path}`
                          }
                          {...rowDragProps(tok, live)}
                        >
                          {renderRowLeading(live.type, display)}
                          <div className="creation-editor-token-studio__path" title={tok.path}>
                            {shortTokenLabel(tok.path)}
                            {usedBadge}
                          </div>
                          <Text role="meta" as="p" className="creation-editor-token-studio__preview">
                            {display || '—'}
                          </Text>
                          <a
                            href={paths.routes.tokensFocus(tok.path)}
                            className="creation-editor-token-studio__hub-btn"
                            aria-label={t('editor.tokenStudioOpenHubLeaf', { path: tok.path })}
                            title={t('editor.tokenStudioOpenHubLeaf', { path: tok.path })}
                            data-testid={`token-studio-hub-${tok.path}`}
                            onMouseDown={(event) => event.stopPropagation()}
                            onClick={(event) => event.stopPropagation()}
                          >
                            <IconExternalLink />
                          </a>
                          <button
                            type="button"
                            className="creation-editor-token-studio__edit-btn"
                            aria-label={t('editor.tokenStudioEdit')}
                            title={t('editor.tokenStudioEdit')}
                            data-testid={`token-studio-edit-${tok.path}`}
                            onMouseDown={(event) => event.stopPropagation()}
                            onClick={() => {
                              openEdit(live)
                              dispatchOnboardingAction('tokenBind')
                            }}
                          >
                            <IconEdit />
                          </button>
                        </li>
                      )
                    }

                    const preview = catalogDisplayValue(tok)
                    const rowType = live?.type || tok.type || 'other'
                    return (
                      <li
                        key={tok.path}
                        className={
                          highlighted
                            ? 'creation-editor-token-studio__row creation-editor-token-studio__row--readonly creation-editor-token-studio__row--used'
                            : 'creation-editor-token-studio__row creation-editor-token-studio__row--readonly'
                        }
                        data-highlighted={highlighted ? 'true' : 'false'}
                        data-testid={`token-studio-row-${tok.path}`}
                        {...rowDragProps(tok, live)}
                      >
                        {renderRowLeading(rowType, preview)}
                        <div className="creation-editor-token-studio__path" title={tok.path}>
                          {shortTokenLabel(tok.path)}
                          {usedBadge}
                        </div>
                        <Text role="meta" as="p" className="creation-editor-token-studio__preview">
                          {preview}
                        </Text>
                        <a
                          href={paths.routes.tokensFocus(tok.path)}
                          className="creation-editor-token-studio__hub-btn"
                          aria-label={t('editor.tokenStudioOpenHubLeaf', { path: tok.path })}
                          title={t('editor.tokenStudioOpenHubLeaf', { path: tok.path })}
                          data-testid={`token-studio-hub-${tok.path}`}
                          onMouseDown={(event) => event.stopPropagation()}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <IconExternalLink />
                        </a>
                      </li>
                    )
                  })}
                </ul>
              ) : null}
            </section>
          )
        })}
      </div>
      {rows.length === 0 ? (
        <Text role="meta" as="p" className="creation-editor-token-studio__empty">
          {t('editor.tokenStudioEmpty')}
        </Text>
      ) : null}

      <Dialog
        open={Boolean(editLeaf)}
        onClose={() => {
          if (savingPath) return
          setEditLeaf(null)
        }}
        title={editLeaf ? shortTokenLabel(editLeaf.path) : t('editor.tokenStudioEdit')}
        className="creation-editor-token-studio__dialog"
        data-testid="token-studio-edit-dialog"
        actions={
          <>
            {editLeaf ? (
              <Button
                href={paths.routes.tokensFocus(editLeaf.path)}
                size="sm"
                variant="ghost"
                data-testid="token-studio-edit-open-hub"
              >
                {t('editor.tokenStudioOpenHub')}
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={savingPath != null}
              onClick={() => setEditLeaf(null)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="subtle"
              disabled={savingPath != null || !editSaveReady}
              data-testid="token-studio-edit-save"
              onClick={() => void saveEditLeaf()}
            >
              {savingPath && editLeaf && savingPath === editLeaf.path
                ? t('editor.tokenStudioSaving')
                : t('editor.tokenStudioSave')}
            </Button>
          </>
        }
      >
        {editLeaf ? (
          <div className="creation-editor-token-studio__dialog-body">
            <Text role="meta" as="p" className="creation-editor-token-studio__dialog-path">
              {editLeaf.path}
            </Text>
            {editingStructured && editLeaf.type === 'typography'
              ? renderTypographyFields(editTypo, setEditTypo, 'token-studio-edit')
              : editingStructured && editLeaf.type === 'shadow'
                ? renderShadowFields(editShadow, setEditShadow, 'token-studio-edit')
                : editingStructured && editLeaf.type === 'asset'
                  ? renderAssetFields(editAsset, setEditAsset, 'token-studio-edit')
                  : (
                    <div className="creation-editor-token-studio__edit">
                      {editKind === 'color' ? (
                        <input
                          type="color"
                          className="creation-editor-token-studio__swatch creation-editor-token-studio__swatch--lg"
                          value={hexForPicker(editDraft)}
                          aria-label={t('editor.tokenStudioColorPicker')}
                          data-testid={`token-studio-color-${editLeaf.path}`}
                          onChange={(event) => {
                            const hex = event.target.value
                            if (!isValidDigitalHex(hex)) return
                            setEditDraft(hex)
                          }}
                        />
                      ) : null}
                      <Input
                        block
                        size="sm"
                        value={editDraft}
                        onChange={(event) => setEditDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault()
                            void saveEditLeaf()
                          }
                        }}
                        aria-label={`${editLeaf.path} digital`}
                        data-testid={`token-studio-input-${editLeaf.path}`}
                      />
                    </div>
                  )}
          </div>
        ) : null}
      </Dialog>
    </div>
  )
}
