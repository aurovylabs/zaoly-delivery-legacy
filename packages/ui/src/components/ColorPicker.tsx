'use client'

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import {
  formatHex,
  hasEyeDropper,
  hsvaToRgba,
  hslaToRgba,
  normalizeHex,
  parseHex,
  rgbaCss,
  rgbaToHsla,
  rgbaToHsva,
  type Hsva,
  type Rgba,
} from './color-utils'

export type ColorPickerProps = {
  value?: string
  onChange?: (hex: string) => void
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Built-in swatch trigger (default true). Set false when host owns the trigger. */
  showTrigger?: boolean
  /** Position panel relative to this element when `showTrigger` is false. */
  anchorRef?: RefObject<HTMLElement | null>
  /**
   * Inline body only (no portal / positioning). For hosts that embed the editor
   * (e.g. TokenPicker combined browser).
   */
  embedded?: boolean
  disabled?: boolean
  'aria-label'?: string
  hexLabel?: string
  rgbLabel?: string
  hslLabel?: string
  eyedropperLabel?: string
  className?: string
  /** Optional custom trigger (replaces default swatch when `showTrigger`). */
  trigger?: ReactNode
}

type FormatTab = 'hex' | 'rgb' | 'hsl'

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

const FALLBACK: Rgba = { r: 0, g: 0, b: 0, a: 1 }

function resolveRgba(value: string | undefined): Rgba {
  return parseHex(value ?? '') ?? FALLBACK
}

function placeBelow(el: HTMLElement | null): { top: number; left: number } {
  if (!el || typeof window === 'undefined') return { top: 8, left: 8 }
  const rect = el.getBoundingClientRect()
  const w = 260
  const h = 320
  let left = rect.left
  let top = rect.bottom + 6
  left = Math.max(8, Math.min(left, window.innerWidth - w - 8))
  top = Math.max(8, Math.min(top, window.innerHeight - h - 8))
  return { top, left }
}

/**
 * Digital color editor — HSV plane, hue/alpha, Hex|RGB|HSL, optional EyeDropper.
 * Spec: specs/domain/zaoly-ui-color-picker.md
 */
export function ColorPicker({
  value = '#000000',
  onChange,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  showTrigger = true,
  anchorRef,
  embedded = false,
  disabled = false,
  'aria-label': ariaLabel = 'Color picker',
  hexLabel = 'Hex',
  rgbLabel = 'RGB',
  hslLabel = 'HSL',
  eyedropperLabel = 'Sample color',
  className,
  trigger,
}: ColorPickerProps) {
  const titleId = useId()
  const uncontrolled = openProp === undefined
  const [openInternal, setOpenInternal] = useState(defaultOpen)
  const open = uncontrolled ? openInternal : openProp
  const setOpen = useCallback(
    (next: boolean) => {
      if (uncontrolled) setOpenInternal(next)
      onOpenChange?.(next)
    },
    [onOpenChange, uncontrolled],
  )

  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const svRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 8, left: 8 })
  const [hsva, setHsva] = useState<Hsva>(() => rgbaToHsva(resolveRgba(value)))
  const [tab, setTab] = useState<FormatTab>('hex')
  const [hexDraft, setHexDraft] = useState(() => formatHex(resolveRgba(value)))
  const [eyeOk, setEyeOk] = useState(false)

  useEffect(() => {
    setEyeOk(hasEyeDropper())
  }, [])

  useEffect(() => {
    const next = rgbaToHsva(resolveRgba(value))
    setHsva(next)
    setHexDraft(formatHex(hsvaToRgba(next)))
  }, [value])

  const emit = useCallback(
    (next: Hsva) => {
      setHsva(next)
      const hex = formatHex(hsvaToRgba(next))
      setHexDraft(hex)
      onChange?.(hex)
    },
    [onChange],
  )

  const place = useCallback(() => {
    const el = showTrigger ? triggerRef.current : anchorRef?.current ?? null
    setPos(placeBelow(el))
  }, [anchorRef, showTrigger])

  useEffect(() => {
    if (embedded || !open) return
    place()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node
      if (panelRef.current?.contains(t)) return
      if (triggerRef.current?.contains(t)) return
      if (anchorRef?.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('resize', place)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('resize', place)
    }
  }, [open, place, setOpen, anchorRef, embedded])

  const pickSv = useCallback(
    (clientX: number, clientY: number) => {
      const el = svRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const s = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
      const v = Math.min(1, Math.max(0, 1 - (clientY - rect.top) / rect.height))
      emit({ ...hsva, s, v })
    },
    [emit, hsva],
  )

  useEffect(() => {
    if (!embedded && !open) return
    let dragging = false
    const onMove = (e: MouseEvent) => {
      if (!dragging) return
      pickSv(e.clientX, e.clientY)
    }
    const onUp = () => {
      dragging = false
    }
    const el = svRef.current
    const onDown = (e: MouseEvent) => {
      dragging = true
      pickSv(e.clientX, e.clientY)
    }
    el?.addEventListener('mousedown', onDown)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      el?.removeEventListener('mousedown', onDown)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [open, pickSv, embedded])

  const rgba = hsvaToRgba(hsva)
  const hsla = rgbaToHsla(rgba)
  const hueColor = rgbaCss({ ...hsvaToRgba({ h: hsva.h, s: 1, v: 1, a: 1 }), a: 1 })

  async function runEyedropper() {
    const Ctor = (window as Window & { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } })
      .EyeDropper
    if (!Ctor) return
    try {
      const result = await new Ctor().open()
      const normalized = normalizeHex(result.sRGBHex)
      if (!normalized) return
      const next = rgbaToHsva(parseHex(normalized)!)
      emit({ ...next, a: hsva.a })
    } catch {
      /* user cancelled */
    }
  }

  const panelInner = (
    <>
      {!embedded ? (
        <div id={titleId} className="ds-color-picker__title">
          {ariaLabel}
        </div>
      ) : null}
      <div
        ref={svRef}
        className="ds-color-picker__sv"
        data-testid="color-picker-sv"
        style={{ backgroundColor: hueColor }}
      >
        <div className="ds-color-picker__sv-white" />
        <div className="ds-color-picker__sv-black" />
        <span
          className="ds-color-picker__sv-thumb"
          style={{ left: `${hsva.s * 100}%`, top: `${(1 - hsva.v) * 100}%` }}
        />
      </div>
      <label className="ds-color-picker__slider-row">
        <span className="visually-hidden">Hue</span>
        <input
          type="range"
          min={0}
          max={360}
          step={1}
          value={Math.round(hsva.h)}
          className="ds-color-picker__hue"
          aria-label="Hue"
          data-testid="color-picker-hue"
          onChange={(e) => emit({ ...hsva, h: Number(e.target.value) })}
        />
      </label>
      <label className="ds-color-picker__slider-row ds-color-picker__slider-row--alpha">
        <span className="visually-hidden">Alpha</span>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(hsva.a * 100)}
          className="ds-color-picker__alpha"
          aria-label="Alpha"
          data-testid="color-picker-alpha"
          style={
            {
              ['--ds-color-picker-alpha-fg' as string]: rgbaCss({ ...rgba, a: 1 }),
            } as CSSProperties
          }
          onChange={(e) => emit({ ...hsva, a: Number(e.target.value) / 100 })}
        />
      </label>
      <div className="ds-color-picker__tabs" role="tablist" aria-label="Color format">
        {(
          [
            ['hex', hexLabel],
            ['rgb', rgbLabel],
            ['hsl', hslLabel],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={cx('ds-color-picker__tab', tab === id && 'ds-color-picker__tab--active')}
            data-testid={`color-picker-tab-${id}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
        {eyeOk ? (
          <button
            type="button"
            className="ds-color-picker__eyedropper"
            aria-label={eyedropperLabel}
            title={eyedropperLabel}
            data-testid="color-picker-eyedropper"
            onClick={() => void runEyedropper()}
          >
            ⌖
          </button>
        ) : null}
      </div>
      <div className="ds-color-picker__fields" role="tabpanel">
        {tab === 'hex' ? (
          <input
            className="ds-color-picker__hex"
            value={hexDraft}
            aria-label={hexLabel}
            data-testid="color-picker-hex"
            onChange={(e) => setHexDraft(e.target.value)}
            onBlur={() => {
              const n = normalizeHex(hexDraft)
              if (n) emit(rgbaToHsva(parseHex(n)!))
              else setHexDraft(formatHex(rgba))
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            }}
          />
        ) : null}
        {tab === 'rgb' ? (
          <div className="ds-color-picker__triplet">
            {(['r', 'g', 'b'] as const).map((key) => (
              <label key={key} className="ds-color-picker__num">
                <span>{key.toUpperCase()}</span>
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={Math.round(rgba[key])}
                  aria-label={key.toUpperCase()}
                  data-testid={`color-picker-rgb-${key}`}
                  onChange={(e) => {
                    const n = Number(e.target.value)
                    const next = { ...rgba, [key]: n }
                    emit(rgbaToHsva(next))
                  }}
                />
              </label>
            ))}
            <label className="ds-color-picker__num">
              <span>A</span>
              <input
                type="number"
                min={0}
                max={100}
                value={Math.round(rgba.a * 100)}
                aria-label="Alpha percent"
                data-testid="color-picker-rgb-a"
                onChange={(e) => emit({ ...hsva, a: Number(e.target.value) / 100 })}
              />
            </label>
          </div>
        ) : null}
        {tab === 'hsl' ? (
          <div className="ds-color-picker__triplet">
            <label className="ds-color-picker__num">
              <span>H</span>
              <input
                type="number"
                min={0}
                max={360}
                value={Math.round(hsla.h)}
                aria-label="Hue"
                data-testid="color-picker-hsl-h"
                onChange={(e) => {
                  const next = hslaToRgba({ ...hsla, h: Number(e.target.value) })
                  emit(rgbaToHsva(next))
                }}
              />
            </label>
            <label className="ds-color-picker__num">
              <span>S</span>
              <input
                type="number"
                min={0}
                max={100}
                value={Math.round(hsla.s * 100)}
                aria-label="Saturation"
                data-testid="color-picker-hsl-s"
                onChange={(e) => {
                  const next = hslaToRgba({ ...hsla, s: Number(e.target.value) / 100 })
                  emit(rgbaToHsva(next))
                }}
              />
            </label>
            <label className="ds-color-picker__num">
              <span>L</span>
              <input
                type="number"
                min={0}
                max={100}
                value={Math.round(hsla.l * 100)}
                aria-label="Lightness"
                data-testid="color-picker-hsl-l"
                onChange={(e) => {
                  const next = hslaToRgba({ ...hsla, l: Number(e.target.value) / 100 })
                  emit(rgbaToHsva(next))
                }}
              />
            </label>
            <label className="ds-color-picker__num">
              <span>A</span>
              <input
                type="number"
                min={0}
                max={100}
                value={Math.round(hsla.a * 100)}
                aria-label="Alpha percent"
                data-testid="color-picker-hsl-a"
                onChange={(e) => emit({ ...hsva, a: Number(e.target.value) / 100 })}
              />
            </label>
          </div>
        ) : null}
      </div>
      <div className="ds-color-picker__preview" style={{ background: rgbaCss(rgba) }} aria-hidden />
    </>
  )

  if (embedded) {
    return (
      <div
        className={cx('ds-color-picker', 'ds-color-picker--embedded', className)}
        data-testid="color-picker-panel"
        aria-label={ariaLabel}
      >
        {panelInner}
      </div>
    )
  }

  const panel =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={panelRef}
            className="ds-color-picker__panel"
            role="dialog"
            aria-modal="false"
            aria-labelledby={titleId}
            data-testid="color-picker-panel"
            style={{ top: pos.top, left: pos.left } satisfies CSSProperties}
          >
            {panelInner}
          </div>,
          document.body,
        )
      : null

  return (
    <div className={cx('ds-color-picker', className)}>
      {showTrigger ? (
        trigger != null ? (
          <span
            className="ds-color-picker__trigger-wrap"
            onClick={() => {
              if (!disabled) setOpen(!open)
            }}
          >
            {trigger}
          </span>
        ) : (
          <button
            ref={triggerRef}
            type="button"
            className="ds-color-picker__trigger"
            disabled={disabled}
            aria-label={ariaLabel}
            aria-expanded={open}
            aria-haspopup="dialog"
            data-testid="color-picker-trigger"
            onClick={() => setOpen(!open)}
          >
            <span
              className="ds-color-picker__swatch"
              style={{ background: rgbaCss(rgba) }}
              aria-hidden
            />
          </button>
        )
      ) : null}
      {panel}
    </div>
  )
}
