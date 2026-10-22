'use client'

import {
  useCallback,
  useRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type SVGProps,
} from 'react'

export type EditorBreakpoint = 'mobile' | 'tablet' | 'desktop' | 'print'

export type BreakpointSwitcherProps = {
  value: EditorBreakpoint
  onChange: (value: EditorBreakpoint) => void
  /** `text` (default) shows labels; `icon` shows device glyphs with labels as aria/title. */
  variant?: 'text' | 'icon'
  /** Partial label overrides for each breakpoint. */
  labels?: Partial<Record<EditorBreakpoint, ReactNode>>
  /** Icon overrides when `variant="icon"`. */
  icons?: Partial<Record<EditorBreakpoint, ReactNode>>
  /** Subset / order of breakpoints (default mobile → tablet → desktop). */
  options?: EditorBreakpoint[]
  className?: string
  'aria-label'?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'onChange' | 'children'>

const DEFAULT_OPTIONS: EditorBreakpoint[] = ['mobile', 'tablet', 'desktop']

const DEFAULT_LABELS: Record<EditorBreakpoint, string> = {
  mobile: 'Mobile',
  tablet: 'Tablet',
  desktop: 'Desktop',
  print: 'Print',
}

function Glyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="ui-icon"
      {...props}
    />
  )
}

/** Built-in glyphs — avoid lucide named exports (vitest/legacy peer interop). */
const DEFAULT_ICONS: Record<EditorBreakpoint, ReactNode> = {
  mobile: (
    <Glyph>
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M11 18h2" />
    </Glyph>
  ),
  tablet: (
    <Glyph>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M11 17h2" />
    </Glyph>
  ),
  desktop: (
    <Glyph>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </Glyph>
  ),
  print: (
    <Glyph>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </Glyph>
  ),
}

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

function accessibleName(
  bp: EditorBreakpoint,
  labels?: Partial<Record<EditorBreakpoint, ReactNode>>,
): string {
  const override = labels?.[bp]
  return typeof override === 'string' ? override : DEFAULT_LABELS[bp]
}

/** Mobile / tablet / desktop (/ optional print) segmented control for editor preview chrome. */
export function BreakpointSwitcher({
  value,
  onChange,
  variant = 'text',
  labels,
  icons,
  options = DEFAULT_OPTIONS,
  className,
  'aria-label': ariaLabel = 'Breakpoint',
  ...rest
}: BreakpointSwitcherProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([])
  const iconMode = variant === 'icon'

  const focusAt = useCallback((index: number) => {
    const el = refs.current[index]
    el?.focus()
  }, [])

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End']
    if (!keys.includes(event.key)) return
    event.preventDefault()
    const idx = options.indexOf(value)
    const last = options.length - 1
    let next = idx
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      next = idx < 0 ? 0 : (idx + 1) % options.length
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      next = idx < 0 ? last : (idx - 1 + options.length) % options.length
    } else if (event.key === 'Home') {
      next = 0
    } else if (event.key === 'End') {
      next = last
    }
    const nextValue = options[next]
    if (nextValue) {
      onChange(nextValue)
      focusAt(next)
    }
  }

  return (
    <div
      className={cx(
        'ds-breakpoint-switcher',
        iconMode && 'ds-breakpoint-switcher--icon',
        className,
      )}
      role="radiogroup"
      aria-label={ariaLabel}
      data-testid="breakpoint-switcher"
      onKeyDown={onKeyDown}
      {...rest}
    >
      {options.map((bp, index) => {
        const checked = value === bp
        const name = accessibleName(bp, labels)
        const content = iconMode
          ? (icons?.[bp] ?? DEFAULT_ICONS[bp])
          : (labels?.[bp] ?? DEFAULT_LABELS[bp])
        return (
          <button
            key={bp}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={iconMode ? name : undefined}
            title={iconMode ? name : undefined}
            data-testid={`breakpoint-switcher-${bp}`}
            className={cx(
              'ds-breakpoint-switcher__btn',
              checked && 'ds-breakpoint-switcher__btn--selected',
            )}
            tabIndex={checked ? 0 : -1}
            ref={(el) => {
              refs.current[index] = el
            }}
            onClick={() => onChange(bp)}
          >
            {content}
          </button>
        )
      })}
    </div>
  )
}
