'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { IconFill as Droplet, IconImage as ImageIcon, IconTrash as Trash2, IconUpload as Upload, IconSparkles as Sparkles, IconClose as X } from '../lib/zaoly-ui'
import type { InspectFieldDef } from '../lib/inspect/field-catalog'
import {
  hasBackgroundMedia,
  readFillExpanded,
  shouldAutoExpandFillGroup,
  writeFillExpanded,
} from '../lib/inspect/fill-groups'
import {
  MediaFitGlyph,
  mediaFitGlyphId,
  mediaFitLabel,
  BorderStyleGlyph,
  BgPositionGlyph,
  borderStyleGlyphId,
  bgPositionGlyphId,
  type BorderStyleGlyphId,
  type BgPositionGlyphId,
} from './inspect-mode-glyphs'
import { InspectGlyphChips } from './inspect-glyph-chips'

const BORDER_STYLE_CHIP_OPTIONS: Array<{ value: BorderStyleGlyphId; label: string }> = [
  { value: 'none', label: 'none' },
  { value: 'solid', label: 'solid' },
  { value: 'dashed', label: 'dashed' },
  { value: 'dotted', label: 'dotted' },
]

const BG_POSITION_CHIP_OPTIONS: Array<{ value: BgPositionGlyphId; label: string }> = [
  { value: 'center', label: 'center' },
  { value: 'top', label: 'top' },
  { value: 'bottom', label: 'bottom' },
  { value: 'left', label: 'left' },
  { value: 'right', label: 'right' },
]

export const STOCK_BG_PRESETS = [
  {
    name: 'Architecture',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Nature',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Abstract',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Dark Mood',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
  },
]

export const BG_OVERLAY_OPTIONS = [
  { value: '', label: 'No Overlay' },
  { value: 'rgba(0, 0, 0, 0.3)', label: 'Dark 30%' },
  { value: 'rgba(0, 0, 0, 0.5)', label: 'Dark 50%' },
  { value: 'rgba(0, 0, 0, 0.7)', label: 'Dark 70%' },
  { value: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.8))', label: 'Gradient Down' },
]

type InspectFillGroupProps = {
  fields: InspectFieldDef[]
  source: { props?: Record<string, unknown>; tokenBindings?: Record<string, string> }
  renderField: (field: InspectFieldDef) => ReactNode
  groupLabel: string
  expandLabel: string
  collapseLabel: string
  onSetProp?: (key: string, value: string) => void
  onClearProp?: (key: string) => void
  onOpenAssetLibrary?: () => void
}

function fieldByName(fields: InspectFieldDef[], name: string): InspectFieldDef | undefined {
  return fields.find((field) => field.name === name)
}

export function InspectFillGroup({
  fields,
  source,
  renderField,
  groupLabel,
  expandLabel,
  collapseLabel,
  onSetProp,
  onClearProp,
  onOpenAssetLibrary,
}: InspectFillGroupProps) {
  const [expanded, setExpanded] = useState(() => readFillExpanded())
  const [showAddBg, setShowAddBg] = useState(false)
  const [urlDraft, setUrlDraft] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (shouldAutoExpandFillGroup(source)) setExpanded(true)
  }, [source])

  if (!fields.length) return null

  function toggleExpanded() {
    const next = !expanded
    setExpanded(next)
    writeFillExpanded(next)
  }

  const fillField = fieldByName(fields, 'background')
  const colorField = fieldByName(fields, 'color')
  const strokeField = fieldByName(fields, 'borderColor')
  const borderWidthField = fieldByName(fields, 'borderWidth')
  const borderStyleField = fieldByName(fields, 'borderStyle')
  const gradientField = fieldByName(fields, 'gradient')

  const hasBgMediaField =
    fields.some((f) => f.name === 'backgroundImage') ||
    Boolean(source.props?.backgroundImage) ||
    Boolean(fillField)
  const currentBgImage = (source.props?.backgroundImage as string) || ''
  const currentBgSize = (source.props?.backgroundSize as string) || 'cover'
  const currentBgPosition = (source.props?.backgroundPosition as string) || 'center'
  const currentBgOverlay = (source.props?.backgroundOverlay as string) || ''
  const currentBorderStyle = borderStyleGlyphId(String(source.props?.borderStyle ?? 'solid'))

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      if (dataUrl) {
        onSetProp?.('backgroundImage', dataUrl)
        setShowAddBg(false)
      }
    }
    reader.readAsDataURL(file)
  }

  function handleUrlSubmit() {
    if (urlDraft.trim()) {
      onSetProp?.('backgroundImage', urlDraft.trim())
      setUrlDraft('')
      setShowAddBg(false)
    }
  }

  const triplet = (
    <div className="creation-inspect-fill__triplet" data-testid="inspect-fill-triplet">
      {fillField ? (
        <div className="creation-inspect-fill__slot">{renderField(fillField)}</div>
      ) : null}
      {colorField ? (
        <div className="creation-inspect-fill__slot">{renderField(colorField)}</div>
      ) : null}
      {strokeField ? (
        <div className="creation-inspect-fill__slot">{renderField(strokeField)}</div>
      ) : null}
    </div>
  )

  return (
    <div
      className="creation-inspect-fill"
      data-testid="inspect-fill-group"
      data-fill-expanded={expanded ? 'true' : 'false'}
    >
      <div className="creation-inspect-fill__header">
        <span className="creation-inspect-fill__label">{groupLabel}</span>
        <div className="creation-inspect-fill__header-actions">
          {hasBgMediaField ? (
            <button
              type="button"
              className={`creation-inspect-fill__header-image-btn ${currentBgImage ? 'is-active' : ''}`}
              title={currentBgImage ? 'Background image active (click to edit)' : 'Add background image'}
              data-testid="inspect-header-bg-btn"
              onClick={() => {
                if (!expanded) {
                  setExpanded(true)
                  writeFillExpanded(true)
                }
                if (!currentBgImage) {
                  setShowAddBg(true)
                }
              }}
            >
              <ImageIcon size={12} aria-hidden="true" />
              <span>{currentBgImage ? 'Image' : '+ Image'}</span>
            </button>
          ) : null}
          <button
            type="button"
            className="creation-inspect-fill__expand"
            aria-expanded={expanded}
            aria-label={expanded ? collapseLabel : expandLabel}
            data-testid="inspect-fill-toggle"
            onClick={toggleExpanded}
          >
            <Droplet size={14} aria-hidden="true" />
          </button>
        </div>
      </div>

      {!expanded ? (
        <div className="creation-inspect-fill__compact">
          {triplet}
          {hasBgMediaField ? (
            <div className="creation-inspect-fill__compact-media-bar" data-testid="compact-bg-media-bar">
              {currentBgImage ? (
                <div
                  className="creation-inspect-fill__compact-thumb-row"
                  onClick={() => {
                    setExpanded(true)
                    writeFillExpanded(true)
                  }}
                  title="Click to adjust background image settings"
                >
                  <div
                    className="creation-inspect-fill__compact-thumb"
                    style={{
                      backgroundImage: currentBgOverlay
                        ? `${currentBgOverlay}, url("${currentBgImage}")`
                        : `url("${currentBgImage}")`,
                      backgroundSize: currentBgSize,
                      backgroundPosition: currentBgPosition,
                    }}
                  />
                  <span className="creation-inspect-fill__compact-thumb-label">
                    Background image active
                  </span>
                  <button
                    type="button"
                    className="creation-inspect-fill__compact-remove-btn"
                    title="Remove background image"
                    data-testid="compact-remove-bg-image-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      onClearProp?.('backgroundImage')
                      onClearProp?.('backgroundSize')
                      onClearProp?.('backgroundPosition')
                      onClearProp?.('backgroundRepeat')
                      onClearProp?.('backgroundOverlay')
                    }}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ) : (
                <div className="creation-inspect-fill__compact-add-row">
                  <button
                    type="button"
                    className="creation-inspect-fill__quick-add-image"
                    data-testid="compact-add-bg-btn"
                    onClick={() => {
                      setExpanded(true)
                      writeFillExpanded(true)
                      setShowAddBg(true)
                    }}
                  >
                    <ImageIcon size={12} />
                    <span>+ Background Image</span>
                  </button>
                  {onOpenAssetLibrary ? (
                    <button
                      type="button"
                      className="creation-inspect-fill__quick-library-btn"
                      data-testid="compact-open-library-btn"
                      title="Open Asset Library & Stock Photos"
                      onClick={() => onOpenAssetLibrary()}
                    >
                      <Sparkles size={12} className="text-amber-500" />
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="creation-inspect-fill__expanded">
          {triplet}
          {borderWidthField && borderStyleField ? (
            <div className="creation-inspect-pair creation-inspect-fill__border-pair">
              {renderField(borderWidthField)}
              {onSetProp ? (
                <InspectGlyphChips
                  testId="inspect-border-style"
                  label={borderStyleField.label}
                  value={currentBorderStyle}
                  options={BORDER_STYLE_CHIP_OPTIONS}
                  onChange={(next) => onSetProp('borderStyle', next)}
                  renderGlyph={(id) => <BorderStyleGlyph id={id as BorderStyleGlyphId} />}
                />
              ) : (
                renderField(borderStyleField)
              )}
            </div>
          ) : (
            <>
              {borderWidthField ? renderField(borderWidthField) : null}
              {borderStyleField ? (
                onSetProp ? (
                  <InspectGlyphChips
                    testId="inspect-border-style"
                    label={borderStyleField.label}
                    value={currentBorderStyle}
                    options={BORDER_STYLE_CHIP_OPTIONS}
                    onChange={(next) => onSetProp('borderStyle', next)}
                    renderGlyph={(id) => <BorderStyleGlyph id={id as BorderStyleGlyphId} />}
                  />
                ) : (
                  renderField(borderStyleField)
                )
              ) : null}
            </>
          )}
          {gradientField ? renderField(gradientField) : null}

          {/* Background Image / Media Fill Section for Containers */}
          {hasBgMediaField ? (
            <div className="creation-inspect-fill__media-section" data-testid="inspect-bg-media-section">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />

              {currentBgImage ? (
                <div className="creation-inspect-fill__media-card" data-testid="inspect-bg-media-card">
                  <div className="creation-inspect-fill__media-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ImageIcon size={12} className="text-muted" />
                      <span className="creation-inspect-fill__media-title">Background Image</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {onOpenAssetLibrary ? (
                        <button
                          type="button"
                          className="creation-inspect-fill__media-remove"
                          title="Change Image from Library..."
                          onClick={onOpenAssetLibrary}
                          data-testid="change-bg-asset-library-btn"
                          style={{ marginRight: '4px' }}
                        >
                          <Sparkles size={11} className="text-amber-500" />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="creation-inspect-fill__media-remove"
                        title="Remove Background Image"
                        data-testid="remove-bg-image-btn"
                        onClick={() => {
                          onClearProp?.('backgroundImage')
                          onClearProp?.('backgroundSize')
                          onClearProp?.('backgroundPosition')
                          onClearProp?.('backgroundRepeat')
                          onClearProp?.('backgroundOverlay')
                        }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>

                  {/* Thumbnail Preview */}
                  <div
                    className="creation-inspect-fill__media-thumb"
                    style={{
                      backgroundImage: currentBgOverlay
                        ? `${currentBgOverlay}, url("${currentBgImage}")`
                        : `url("${currentBgImage}")`,
                      backgroundSize: currentBgSize,
                      backgroundPosition: currentBgPosition,
                    }}
                    title={currentBgImage.startsWith('data:') ? 'Local Image' : currentBgImage}
                  />

                  {/* Sizing & Position controls */}
                  <div className="creation-inspect-fill__media-controls">
                    <div className="creation-inspect-fill__media-control-row">
                      <span className="creation-inspect-fill__micro-label">Size</span>
                      <div className="creation-inspect-fit-chips">
                        {(['cover', 'contain', 'auto'] as const).map((s) => (
                          <button
                            key={s}
                            type="button"
                            className={`creation-inspect-fit-btn${currentBgSize === s ? ' is-active' : ''}`}
                            aria-pressed={currentBgSize === s}
                            title={`Background size: ${mediaFitLabel(s)}`}
                            onClick={() => onSetProp?.('backgroundSize', s)}
                          >
                            <MediaFitGlyph id={mediaFitGlyphId(s)} />
                            <span className="creation-inspect-fit-btn__label">{mediaFitLabel(s)}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="creation-inspect-fill__media-control-row">
                      <span className="creation-inspect-fill__micro-label">Pos</span>
                      <InspectGlyphChips
                        testId="inspect-bg-position"
                        value={bgPositionGlyphId(currentBgPosition)}
                        options={BG_POSITION_CHIP_OPTIONS}
                        onChange={(next) => onSetProp?.('backgroundPosition', next)}
                        ariaLabel="Background position"
                        renderGlyph={(id) => <BgPositionGlyph id={id as BgPositionGlyphId} />}
                      />
                    </div>

                    <div className="creation-inspect-fill__media-control-row">
                      <span className="creation-inspect-fill__micro-label">Tint</span>
                      <select
                        className="creation-inspect-fill__overlay-select"
                        value={currentBgOverlay}
                        onChange={(e) => onSetProp?.('backgroundOverlay', e.target.value)}
                        data-testid="bg-overlay-select"
                      >
                        {BG_OVERLAY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="creation-inspect-fill__add-media">
                  {!showAddBg ? (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', width: '100%' }}>
                      <button
                        type="button"
                        className="creation-inspect-fill__add-media-trigger"
                        data-testid="add-bg-image-trigger"
                        style={{ flex: 1 }}
                        onClick={() => setShowAddBg(true)}
                      >
                        <ImageIcon size={13} />
                        <span>Add Background Image</span>
                      </button>
                      {onOpenAssetLibrary ? (
                        <button
                          type="button"
                          className="creation-inspect-fill__add-media-trigger"
                          data-testid="open-bg-asset-library-trigger"
                          onClick={onOpenAssetLibrary}
                          title="Open Asset Library & Stock Photos"
                          style={{ flex: 'none', padding: '0 8px' }}
                        >
                          <Sparkles size={13} className="text-amber-500" />
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <div className="creation-inspect-fill__add-media-card" data-testid="add-bg-image-card">
                      <div className="creation-inspect-fill__add-media-header">
                        <span style={{ fontSize: '0.68rem', fontWeight: 600 }}>Choose Background</span>
                        <button
                          type="button"
                          className="creation-inspect-fill__add-media-close"
                          onClick={() => setShowAddBg(false)}
                        >
                          <X size={12} />
                        </button>
                      </div>

                      {/* Asset Library Primary Button */}
                      {onOpenAssetLibrary ? (
                        <button
                          type="button"
                          className="creation-inspect-fill__upload-btn"
                          data-testid="browse-bg-asset-library-btn"
                          style={{
                            background: '#1f44ff',
                            color: '#ffffff',
                            fontWeight: 600,
                            marginBottom: '6px',
                          }}
                          onClick={() => {
                            setShowAddBg(false)
                            onOpenAssetLibrary()
                          }}
                        >
                          <Sparkles size={12} />
                          <span>Browse Asset Library & Unsplash...</span>
                        </button>
                      ) : null}

                      {/* File Upload Button */}
                      <button
                        type="button"
                        className="creation-inspect-fill__upload-btn"
                        data-testid="upload-bg-image-btn"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload size={12} />
                        <span>Upload local image...</span>
                      </button>

                      {/* Stock Presets */}
                      <div className="creation-inspect-fill__presets-section">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '4px' }}>
                          <Sparkles size={10} className="text-amber-500" />
                          <span style={{ fontSize: '0.62rem', color: 'var(--muted)', fontWeight: 500 }}>
                            Stock Presets
                          </span>
                        </div>
                        <div className="creation-inspect-fill__presets-grid">
                          {STOCK_BG_PRESETS.map((preset) => (
                            <button
                              key={preset.name}
                              type="button"
                              className="creation-inspect-fill__preset-item"
                              data-testid={`preset-bg-${preset.name.toLowerCase().replace(' ', '-')}`}
                              onClick={() => {
                                onSetProp?.('backgroundImage', preset.url)
                                setShowAddBg(false)
                              }}
                            >
                              <div
                                className="creation-inspect-fill__preset-img"
                                style={{ backgroundImage: `url("${preset.url}")` }}
                              />
                              <span className="creation-inspect-fill__preset-name">{preset.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Direct URL Input */}
                      <div className="creation-inspect-fill__url-row">
                        <input
                          type="text"
                          className="creation-inspect-fill__url-input"
                          placeholder="Paste image URL..."
                          value={urlDraft}
                          onChange={(e) => setUrlDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUrlSubmit()
                          }}
                        />
                        <button
                          type="button"
                          className="creation-inspect-fill__url-apply-btn"
                          disabled={!urlDraft.trim()}
                          onClick={handleUrlSubmit}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
