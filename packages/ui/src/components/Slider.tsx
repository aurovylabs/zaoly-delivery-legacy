import type { InputHTMLAttributes } from 'react'

export type SliderProps = {
  value: number
  min?: number
  max?: number
  step?: number
  /** Continuous updates while dragging */
  onChange?: (value: number) => void
  /** Commit on mouseup / touchend / blur / arrow keyup */
  onCommit?: (value: number) => void
  /** Full width (default true) */
  block?: boolean
  className?: string
} & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'min' | 'max' | 'step' | 'onChange' | 'className' | 'children'
>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

function fillPct(value: number, min: number, max: number): number {
  if (max <= min) return 0
  const raw = ((value - min) / (max - min)) * 100
  return Math.max(0, Math.min(100, raw))
}

/**
 * Tokenized range control — specs/domain/zaoly-ui-slider.md
 * Fill uses `--ds-slider-pct` (0–100).
 */
export function Slider({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  onCommit,
  block = true,
  disabled,
  className,
  onMouseUp,
  onTouchEnd,
  onBlur,
  onKeyUp,
  style,
  ...rest
}: SliderProps) {
  const pct = fillPct(value, min, max)

  return (
    <input
      type="range"
      className={cx('ds-slider', block && 'ds-slider--block', className)}
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      style={{
        ...style,
        ['--ds-slider-pct' as string]: `${pct}%`,
      }}
      onChange={(e) => onChange?.(Number(e.target.value))}
      onMouseUp={(e) => {
        onMouseUp?.(e)
        onCommit?.(Number(e.currentTarget.value))
      }}
      onTouchEnd={(e) => {
        onTouchEnd?.(e)
        onCommit?.(Number(e.currentTarget.value))
      }}
      onBlur={(e) => {
        onBlur?.(e)
        onCommit?.(Number(e.currentTarget.value))
      }}
      onKeyUp={(e) => {
        onKeyUp?.(e)
        if (
          e.key === 'ArrowLeft' ||
          e.key === 'ArrowRight' ||
          e.key === 'Home' ||
          e.key === 'End' ||
          e.key === 'PageUp' ||
          e.key === 'PageDown'
        ) {
          onCommit?.(Number(e.currentTarget.value))
        }
      }}
      {...rest}
    />
  )
}
