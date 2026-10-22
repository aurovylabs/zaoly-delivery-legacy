'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { IconCard as Square } from '../lib/zaoly-ui'
import type { InspectFieldDef } from '../lib/inspect/field-catalog'
import { INSPECT_UNSET_PLACEHOLDER } from '../lib/inspect/field-catalog'
import {
  clipSlantCornerPairs,
  hasActiveClipPathD,
  hasActiveClipPolygon,
  isBottomSlantMirrored,
  readClipSlantExpanded,
  shouldAutoExpandClipSlant,
  writeClipSlantExpanded,
} from '../lib/inspect/clip-slant-groups'
import { parseClipPathD } from '../lib/inspect/clip-path-d'
import {
  CLIP_PRESET_OPTIONS,
  amountForClipPreset,
  detectClipPreset,
  type ClipPresetId,
} from '../lib/inspect/clip-presets'
import {
  CLIP_POLYGON_MAX_POINTS,
  CLIP_POLYGON_MIN_POINTS,
  defaultClipPolygonPoints,
  formatClipPolygonPoints,
  parseClipPolygonPoints,
  type ClipPolygonPoint,
} from '../lib/inspect/clip-polygon'
import { resolveClipPathFromSceneProps } from '../lib/inspect/clip-insets'
import { clipInsetsFromCssPolygon } from '../lib/scene/clip-path-import'
import { CommitOnBlurInput } from './editor-inspector/commit-on-blur-input'
import { ClipPresetGlyph } from './inspect-mode-glyphs'

export type ClipInspectMode = 'insets' | 'polygon' | 'path'

type InspectClipSlantGroupProps = {
  fields: InspectFieldDef[]
  source: { props?: Record<string, unknown>; tokenBindings?: Record<string, string> }
  renderField: (field: InspectFieldDef) => ReactNode
  onWriteAmount: (amount: string, mirror: boolean) => void
  onWritePreset: (preset: ClipPresetId, amount: string) => void
  onWritePolygon: (points: ClipPolygonPoint[] | null) => void
  onWritePathD?: (d: string) => void
  onWriteInsetsFromPolygon: (insetProps: Record<string, string>) => void
  groupLabel: string
  presetLabel: string
  amountLabel: string
  mirrorLabel: string
  expandLabel: string
  collapseLabel: string
  modeInsetsLabel: string
  modePolygonLabel: string
  modePathLabel?: string
  addPointLabel: string
  removePointLabel: string
  convertInsetsLabel: string
  presetOptionLabels?: Partial<Record<ClipPresetId, string>>
}

function seedPointsFromSource(source: InspectClipSlantGroupProps['source']): ClipPolygonPoint[] {
  const existing = parseClipPolygonPoints(source.props?.clipPolygon)
  if (existing) return existing
  const clipPath = resolveClipPathFromSceneProps(source.props, source.tokenBindings)
  if (clipPath) {
    const fromPath = parseClipPolygonPoints(clipPath)
    if (fromPath) return fromPath
  }
  return defaultClipPolygonPoints()
}

export function InspectClipSlantGroup({
  fields,
  source,
  renderField,
  onWriteAmount,
  onWritePreset,
  onWritePolygon,
  onWritePathD,
  onWriteInsetsFromPolygon,
  groupLabel,
  presetLabel,
  amountLabel,
  mirrorLabel,
  expandLabel,
  collapseLabel,
  modeInsetsLabel,
  modePolygonLabel,
  modePathLabel = 'Path',
  addPointLabel,
  removePointLabel,
  convertInsetsLabel,
  presetOptionLabels,
}: InspectClipSlantGroupProps) {
  const detected = useMemo(() => detectClipPreset(source), [source])
  const amount = useMemo(() => amountForClipPreset(source, detected), [source, detected])
  const mirrored = useMemo(() => isBottomSlantMirrored(source), [source])
  const polygonActive = useMemo(() => hasActiveClipPolygon(source), [source])
  const pathActive = useMemo(() => hasActiveClipPathD(source), [source])
  const [expanded, setExpanded] = useState(() => readClipSlantExpanded())
  const [mirror, setMirror] = useState(mirrored)
  const [preset, setPreset] = useState<ClipPresetId>(detected ?? 'none')
  const [mode, setMode] = useState<ClipInspectMode>(() =>
    hasActiveClipPathD(source) ? 'path' : hasActiveClipPolygon(source) ? 'polygon' : 'insets',
  )
  const [draftPoints, setDraftPoints] = useState<ClipPolygonPoint[]>(() =>
    seedPointsFromSource(source),
  )
  const [draftPathD, setDraftPathD] = useState(
    () => parseClipPathD(source.props?.clipPathD) ?? '',
  )

  useEffect(() => {
    if (shouldAutoExpandClipSlant(source)) setExpanded(true)
  }, [source])

  useEffect(() => {
    setMirror(mirrored)
  }, [mirrored])

  useEffect(() => {
    setPreset(detected ?? 'none')
  }, [detected])

  useEffect(() => {
    if (pathActive) setMode('path')
    else if (polygonActive) setMode('polygon')
    setDraftPoints(seedPointsFromSource(source))
    setDraftPathD(parseClipPathD(source.props?.clipPathD) ?? '')
  }, [source, polygonActive, pathActive])

  if (!fields.length) return null

  const pairs = clipSlantCornerPairs(fields)
  const showMirror = preset === 'none' || preset === 'slant-bottom'
  const canConvert =
    mode === 'polygon' &&
    draftPoints.length === 4 &&
    Boolean(clipInsetsFromCssPolygon(`polygon(${formatClipPolygonPoints(draftPoints)})`))

  function toggleExpanded() {
    const next = !expanded
    setExpanded(next)
    writeClipSlantExpanded(next)
  }

  function commitAmount(next: string) {
    const trimmed = next.trim()
    if (preset === 'none' || preset === 'slant-bottom') {
      onWriteAmount(trimmed, mirror)
      return
    }
    onWritePreset(preset, trimmed || amount)
  }

  function commitPoint(index: number, axis: 'x' | 'y', value: string) {
    const next = draftPoints.map((p, i) =>
      i === index ? { ...p, [axis]: value.trim() } : p,
    )
    setDraftPoints(next)
    if (next.every((p) => p.x.trim() && p.y.trim())) {
      onWritePolygon(next)
    }
  }

  function addPoint() {
    if (draftPoints.length >= CLIP_POLYGON_MAX_POINTS) return
    const next = [...draftPoints, { x: '50%', y: '50%' }]
    setDraftPoints(next)
    onWritePolygon(next)
  }

  function removePoint(index: number) {
    if (draftPoints.length <= CLIP_POLYGON_MIN_POINTS) return
    const next = draftPoints.filter((_, i) => i !== index)
    setDraftPoints(next)
    onWritePolygon(next)
  }

  function switchMode(next: ClipInspectMode) {
    setMode(next)
    if (next === 'path') {
      const seeded = parseClipPathD(source.props?.clipPathD) ?? 'M0 0 L100 0 L100 100 L0 100 Z'
      setDraftPathD(seeded)
      onWritePathD?.(seeded)
      setExpanded(true)
      writeClipSlantExpanded(true)
      return
    }
    if (next === 'polygon') {
      const seeded = seedPointsFromSource(source)
      setDraftPoints(seeded)
      onWritePolygon(seeded)
      setExpanded(true)
      writeClipSlantExpanded(true)
      return
    }
    onWritePolygon(null)
    onWritePathD?.('')
  }

  return (
    <div
      className="creation-inspect-box-model creation-inspect-clip-slant"
      data-testid="inspect-clip-slant"
      data-box-expanded={expanded ? 'true' : 'false'}
      data-clip-preset={preset}
      data-clip-mode={mode}
    >
      <div className="creation-inspect-box-model__header">
        <span className="creation-inspect-box-model__label">{groupLabel}</span>
        <button
          type="button"
          className="creation-inspect-box-model__expand"
          aria-expanded={expanded}
          aria-label={expanded ? collapseLabel : expandLabel}
          data-testid="inspect-clip-slant-toggle"
          onClick={toggleExpanded}
        >
          <Square size={14} aria-hidden="true" />
        </button>
      </div>

      {!expanded ? (
        <div className="creation-inspect-box-model__compact creation-inspect-clip-slant__compact">
          <div
            className="creation-inspect-clip-slant__preset"
            data-testid="inspect-clip-slant-preset"
            role="group"
            aria-label={presetLabel}
          >
            <span className="creation-inspect-clip-slant__preset-label">{presetLabel}</span>
            <div className="creation-inspect-clip-slant__preset-chips">
              {CLIP_PRESET_OPTIONS.map((opt) => {
                const label = presetOptionLabels?.[opt.value] ?? opt.label
                const isActive = preset === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`creation-inspect-clip-slant__preset-btn${isActive ? ' is-active' : ''}`}
                    data-testid={`inspect-clip-slant-preset-${opt.value}`}
                    aria-pressed={isActive}
                    title={label}
                    aria-label={label}
                    onClick={() => {
                      setPreset(opt.value)
                      setMode('insets')
                      onWritePreset(opt.value, amount)
                      if (opt.value !== 'slant-bottom' && opt.value !== 'none') setMirror(false)
                    }}
                  >
                    <ClipPresetGlyph id={opt.value} />
                    <span className="creation-inspect-clip-slant__preset-btn-label">{label}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <label className="creation-inspect-clip-slant__amount">
            <span className="creation-inspect-clip-slant__amount-label">{amountLabel}</span>
            <CommitOnBlurInput
              data-testid="inspect-clip-slant-amount"
              aria-label={amountLabel}
              placeholder={INSPECT_UNSET_PLACEHOLDER}
              value={amount}
              onCommit={commitAmount}
            />
          </label>
          {showMirror ? (
            <label className="creation-inspect-clip-slant__mirror">
              <input
                type="checkbox"
                data-testid="inspect-clip-slant-mirror"
                checked={mirror}
                onChange={(e) => {
                  const next = e.target.checked
                  setMirror(next)
                  onWriteAmount(amount, next)
                  setPreset('slant-bottom')
                  setMode('insets')
                }}
              />
              <span>{mirrorLabel}</span>
            </label>
          ) : null}
        </div>
      ) : (
        <div className="creation-inspect-box-model__expanded">
          <div
            className="creation-inspect-clip-slant__mode"
            role="group"
            aria-label={groupLabel}
          >
            <button
              type="button"
              data-testid="inspect-clip-mode-insets"
              data-active={mode === 'insets' ? 'true' : 'false'}
              className="creation-inspect-clip-slant__mode-btn"
              onClick={() => switchMode('insets')}
            >
              {modeInsetsLabel}
            </button>
            <button
              type="button"
              data-testid="inspect-clip-mode-polygon"
              data-active={mode === 'polygon' ? 'true' : 'false'}
              className="creation-inspect-clip-slant__mode-btn"
              onClick={() => switchMode('polygon')}
            >
              {modePolygonLabel}
            </button>
            <button
              type="button"
              data-testid="inspect-clip-mode-path"
              data-active={mode === 'path' ? 'true' : 'false'}
              className="creation-inspect-clip-slant__mode-btn"
              onClick={() => switchMode('path')}
            >
              {modePathLabel}
            </button>
          </div>

          {mode === 'insets' ? (
            pairs.map(([left, right]) => (
              <div key={left.name} className="creation-inspect-pair">
                {renderField(left)}
                {renderField(right)}
              </div>
            ))
          ) : mode === 'path' ? (
            <label
              className="creation-inspect-clip-slant__path"
              data-testid="inspect-clip-path-d"
            >
              <span>path d</span>
              <CommitOnBlurInput
                data-testid="inspect-clip-path-d-input"
                aria-label={modePathLabel}
                placeholder="M0 0 L100 0 L100 100 Z"
                value={draftPathD}
                onCommit={(v) => {
                  const next = v.trim()
                  setDraftPathD(next)
                  onWritePathD?.(next)
                }}
              />
            </label>
          ) : (
            <div
              className="creation-inspect-clip-slant__polygon"
              data-testid="inspect-clip-polygon"
            >
              {draftPoints.map((point, index) => (
                <div key={index} className="creation-inspect-pair creation-inspect-clip-slant__point">
                  <label className="creation-inspect-clip-slant__point-axis">
                    <span>P{index + 1} X</span>
                    <CommitOnBlurInput
                      data-testid={`inspect-clip-polygon-x-${index}`}
                      aria-label={`Point ${index + 1} X`}
                      placeholder={INSPECT_UNSET_PLACEHOLDER}
                      value={point.x}
                      onCommit={(v) => commitPoint(index, 'x', v)}
                    />
                  </label>
                  <label className="creation-inspect-clip-slant__point-axis">
                    <span>P{index + 1} Y</span>
                    <CommitOnBlurInput
                      data-testid={`inspect-clip-polygon-y-${index}`}
                      aria-label={`Point ${index + 1} Y`}
                      placeholder={INSPECT_UNSET_PLACEHOLDER}
                      value={point.y}
                      onCommit={(v) => commitPoint(index, 'y', v)}
                    />
                  </label>
                  {draftPoints.length > CLIP_POLYGON_MIN_POINTS ? (
                    <button
                      type="button"
                      data-testid={`inspect-clip-polygon-remove-${index}`}
                      aria-label={removePointLabel}
                      className="creation-inspect-clip-slant__point-remove"
                      onClick={() => removePoint(index)}
                    >
                      −
                    </button>
                  ) : null}
                </div>
              ))}
              <div className="creation-inspect-clip-slant__polygon-actions">
                {draftPoints.length < CLIP_POLYGON_MAX_POINTS ? (
                  <button
                    type="button"
                    data-testid="inspect-clip-polygon-add"
                    onClick={addPoint}
                  >
                    {addPointLabel}
                  </button>
                ) : null}
                {canConvert ? (
                  <button
                    type="button"
                    data-testid="inspect-clip-polygon-convert"
                    onClick={() => {
                      const insets = clipInsetsFromCssPolygon(
                        `polygon(${formatClipPolygonPoints(draftPoints)})`,
                      )
                      if (!insets) return
                      onWriteInsetsFromPolygon(insets)
                      setMode('insets')
                    }}
                  >
                    {convertInsetsLabel}
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
