import { useRef, useState, type ReactNode } from 'react'
import { IconSparkles as Sparkles } from '../lib/zaoly-ui'
import type { InspectFieldDef } from '../lib/inspect/field-catalog'
import {
  MediaFitGlyph,
  ObjectPositionGlyph,
  mediaFitGlyphId,
  mediaFitLabel,
  ninePointGlyphId,
} from './inspect-mode-glyphs'

const STOCK_PRESETS = [
  { name: 'Architecture', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80' },
  { name: 'Nature', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80' },
  { name: 'Abstract', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80' },
  { name: 'Portrait', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80' },
]

type InspectMediaGroupProps = {
  srcField?: InspectFieldDef | null
  altField?: InspectFieldDef | null
  objectFitField?: InspectFieldDef | null
  objectPositionField?: InspectFieldDef | null
  loadingField?: InspectFieldDef | null
  currentSrc?: string
  currentFit?: string
  currentPos?: string
  onSetPosition: (pos: string) => void
  onSetFit?: (fit: string) => void
  onSetSrc?: (src: string) => void
  onOpenAssetLibrary?: () => void
  renderField: (field: InspectFieldDef) => ReactNode
  groupLabel?: string
}

const NINE_POINT_POSITIONS = [
  { value: 'top left', title: 'Top Left' },
  { value: 'top', title: 'Top Center' },
  { value: 'top right', title: 'Top Right' },
  { value: 'left', title: 'Center Left' },
  { value: 'center', title: 'Center' },
  { value: 'right', title: 'Center Right' },
  { value: 'bottom left', title: 'Bottom Left' },
  { value: 'bottom', title: 'Bottom Center' },
  { value: 'bottom right', title: 'Bottom Right' },
]

export function InspectMediaGroup({
  srcField,
  altField,
  objectFitField,
  objectPositionField,
  loadingField,
  currentSrc = '',
  currentFit = 'cover',
  currentPos = 'center',
  onSetPosition,
  onSetFit,
  onSetSrc,
  onOpenAssetLibrary,
  renderField,
  groupLabel = 'Media & Image',
}: InspectMediaGroupProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  if (!srcField && !altField && !objectFitField && !objectPositionField && !loadingField) {
    return null
  }

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string' && onSetSrc) {
        onSetSrc(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="creation-inspect-media-group" data-testid="inspect-media-group">
      <div className="creation-inspect-size-box__header" style={{ marginBottom: '0.4rem' }}>
        <span className="creation-inspect-size-box__label" style={{ fontWeight: 600 }}>{groupLabel}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        {/* Hidden File Input for Native File Chooser */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          style={{ display: 'none' }}
          data-testid="inspect-media-file-input"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />

        {/* Thumbnail Preview, Src Input, and Choose File Button */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {currentSrc ? (
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '6px',
                overflow: 'hidden',
                flexShrink: 0,
                background: 'var(--color-surface-2, rgba(255,255,255,0.06))',
                border: '1px solid var(--color-border-subtle, rgba(255,255,255,0.1))',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentSrc}
                alt="Preview"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: (currentFit as any) || 'cover',
                  objectPosition: currentPos || 'center',
                }}
              />
            </div>
          ) : null}
          {srcField ? <div style={{ flex: 1 }}>{renderField(srcField)}</div> : null}
        </div>

        {/* File Picker & Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragOver(true)
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragOver(false)
            const file = e.dataTransfer.files?.[0]
            if (file) handleFile(file)
          }}
          data-testid="inspect-media-dropzone"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 10px',
            borderRadius: '6px',
            background: isDragOver ? 'rgba(31, 68, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
            border: isDragOver ? '1px dashed #1f44ff' : '1px dashed rgba(255, 255, 255, 0.15)',
            fontSize: '11px',
            color: '#a1a1aa',
            transition: 'all 0.15s ease',
          }}
        >
          <span>Drop image here or</span>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            data-testid="inspect-media-choose-file-btn"
            style={{
              background: '#27272a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '3px 8px',
              fontSize: '11px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Choose File...
          </button>
        </div>

        {/* Curated Stock Photo Presets */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.7rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Stock Presets
            </span>
            {onOpenAssetLibrary && (
              <button
                type="button"
                onClick={onOpenAssetLibrary}
                data-testid="inspect-media-open-library-btn"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1f44ff',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <Sparkles size={11} />
                <span>Browse Library...</span>
              </button>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
            {STOCK_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => onSetSrc?.(preset.url)}
                title={`Use ${preset.name} Preset`}
                data-testid={`stock-preset-${preset.name.toLowerCase()}`}
                style={{
                  height: '32px',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  border: currentSrc === preset.url ? '2px solid #1f44ff' : '1px solid rgba(255, 255, 255, 0.1)',
                  padding: 0,
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preset.url}
                  alt={preset.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Alt text for Accessibility */}
        {altField ? (
          <div className="creation-inspect-alt">
            {renderField(altField)}
          </div>
        ) : null}

        {/* Object Fit */}
        {objectFitField ? (
          <div className="creation-inspect-object-fit" data-testid="inspect-object-fit">
            <div className="creation-inspect-span-axis__label">Object Fit</div>
            <div className="creation-inspect-fit-chips">
              {(['cover', 'contain', 'fill', 'none', 'scale-down'] as const).map((fit) => {
                const isActive = currentFit === fit || (!currentFit && fit === 'cover')
                return (
                  <button
                    key={fit}
                    type="button"
                    className={`creation-inspect-fit-btn${isActive ? ' is-active' : ''}`}
                    aria-pressed={isActive}
                    title={`Object fit: ${mediaFitLabel(fit)}`}
                    data-testid={`inspect-object-fit-${fit}`}
                    onClick={() => onSetFit?.(fit)}
                  >
                    <MediaFitGlyph id={mediaFitGlyphId(fit)} />
                    <span className="creation-inspect-fit-btn__label">{mediaFitLabel(fit)}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}

        {/* 9-Point Anchor Position Grid */}
        <div>
          <div className="creation-inspect-span-axis__label">Object Position Anchor</div>
          <div className="creation-inspect-media-pos">
            <div
              className="creation-inspect-media-pos__grid"
              role="group"
              aria-label="Object position"
            >
              {NINE_POINT_POSITIONS.map((p) => {
                const isActive = currentPos === p.value || (!currentPos && p.value === 'center')
                return (
                  <button
                    key={p.value}
                    type="button"
                    title={p.title}
                    aria-label={p.title}
                    aria-pressed={isActive}
                    data-testid={`inspect-object-pos-${ninePointGlyphId(p.value)}`}
                    className={`creation-inspect-media-pos__btn${isActive ? ' is-active' : ''}`}
                    onClick={() => onSetPosition(p.value)}
                  >
                    <ObjectPositionGlyph id={ninePointGlyphId(p.value)} />
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Loading Attribute */}
        {loadingField ? (
          <div className="creation-inspect-loading">
            {renderField(loadingField)}
          </div>
        ) : null}
      </div>
    </div>
  )
}
