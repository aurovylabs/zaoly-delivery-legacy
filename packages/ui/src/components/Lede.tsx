import type { HTMLAttributes, ReactNode } from 'react'

export type LedeTone = 'default' | 'pos' | 'low' | 'neg' | 'ok' | 'choice'

export type LedeStep = {
  id: string
  label: ReactNode
}

export type LedeProps = {
  value?: ReactNode
  label: ReactNode
  unit?: ReactNode
  tone?: LedeTone
  kind?: 'number' | 'text' | 'empty'
  className?: string
} & Omit<HTMLAttributes<HTMLLIElement>, 'className' | 'children'>

export type LedeStripProps = {
  /** `metrics` = magazine KPI ledes; `steps` = numbered wizard strip (same hairline language). */
  variant?: 'metrics' | 'steps'
  children?: ReactNode
  columns?: number
  compact?: boolean
  className?: string
  'aria-label'?: string
  /** Steps mode */
  steps?: LedeStep[]
  activeIndex?: number
  onStepSelect?: (index: number) => void
} & Omit<HTMLAttributes<HTMLElement>, 'className' | 'children' | 'onSelect'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/**
 * Single magazine lede cell (display value + uppercase label).
 * Spec: specs/domain/zaoly-ui-lede.md
 */
export function Lede({
  value,
  label,
  unit,
  tone = 'default',
  kind = 'number',
  className,
  ...rest
}: LedeProps) {
  return (
    <li
      className={cx('ds-lede', 'ds-stat-lede', className)}
      data-tone={tone}
      data-kind={kind}
      {...rest}
    >
      <strong
        className={cx(
          kind === 'text' ? 'ds-lede-choice ds-stat-lede-choice' : 'ds-lede-num ds-stat-lede-num',
          kind !== 'text' && 'ds-text-numeric',
        )}
      >
        {value}
        {unit != null && kind !== 'text' ? (
          <span className="ds-lede-unit ds-stat-lede-unit">{unit}</span>
        ) : null}
      </strong>
      <span className="ds-lede-label ds-stat-lede-label">{label}</span>
    </li>
  )
}

/**
 * Magazine band: KPI metrics grid or numbered wizard steps — one hairline language.
 */
export function LedeStrip({
  variant = 'metrics',
  children,
  columns = 3,
  compact = false,
  className,
  'aria-label': ariaLabel,
  steps,
  activeIndex = 0,
  onStepSelect,
  ...rest
}: LedeStripProps) {
  if (variant === 'steps') {
    const list = steps ?? []
    return (
      <nav
        className={cx('ds-lede-strip', 'ds-lede-strip--steps', 'ds-wizard-steps', className)}
        aria-label={ariaLabel ?? 'Steps'}
        data-variant="steps"
        {...rest}
      >
        <ol className="ds-lede-strip-list ds-wizard-steps-list">
          {list.map((step, index) => {
            const state =
              index < activeIndex ? 'done' : index === activeIndex ? 'active' : 'todo'
            const interactive = typeof onStepSelect === 'function' && index <= activeIndex
            return (
              <li
                key={step.id}
                className="ds-lede ds-lede--step ds-wizard-step"
                data-state={state}
              >
                {interactive ? (
                  <button
                    type="button"
                    className="ds-lede-step-btn ds-wizard-step-btn"
                    aria-current={state === 'active' ? 'step' : undefined}
                    onClick={() => onStepSelect(index)}
                  >
                    <span className="ds-lede-index ds-wizard-step-index" aria-hidden>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="ds-lede-label ds-wizard-step-label">{step.label}</span>
                  </button>
                ) : (
                  <span
                    className="ds-lede-step-static ds-wizard-step-static"
                    aria-current={state === 'active' ? 'step' : undefined}
                  >
                    <span className="ds-lede-index ds-wizard-step-index" aria-hidden>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="ds-lede-label ds-wizard-step-label">{step.label}</span>
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    )
  }

  return (
    <ul
      className={cx(
        'ds-lede-strip',
        'ds-lede-strip--metrics',
        'ds-stat-lede-group',
        compact && 'ds-lede-strip--compact ds-stat-lede-group--compact',
        className,
      )}
      style={{ ['--ds-stat-cols' as string]: String(columns) }}
      aria-label={ariaLabel}
      data-variant="metrics"
      {...rest}
    >
      {children}
    </ul>
  )
}

/** @deprecated Prefer `Lede` — alias kept for product cutover. */
export const StatLede = Lede
/** @deprecated Prefer `LedeStrip` — alias kept for product cutover. */
export const StatLedeGroup = LedeStrip

export type StatLedeTone = LedeTone
export type StatLedeProps = LedeProps
export type StatLedeGroupProps = LedeStripProps
