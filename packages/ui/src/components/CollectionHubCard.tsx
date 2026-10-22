import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Text } from './Text'

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export type CollectionHubMetricProps = {
  icon?: ReactNode
  value: ReactNode
  label: ReactNode
  /** When false, value may render muted (app CSS via data-linked). */
  linked?: boolean
  className?: string
}

/** Metric cell inside CollectionHubCard stats. Spec: zaoly-ui-collection-hub-card.md */
export function CollectionHubMetric({
  icon,
  value,
  label,
  linked = true,
  className,
}: CollectionHubMetricProps) {
  return (
    <div
      className={cx('ds-collection-hub-metric', className)}
      data-linked={linked ? 'true' : 'false'}
    >
      {icon != null ? (
        <span className="ds-collection-hub-metric__icon" aria-hidden>
          {icon}
        </span>
      ) : (
        <span className="ds-collection-hub-metric__icon" aria-hidden />
      )}
      <span className="ds-collection-hub-metric__value">{value}</span>
      <span className="ds-collection-hub-metric__label">{label}</span>
    </div>
  )
}

type CollectionHubCardShared = {
  title: ReactNode
  kicker?: ReactNode
  badge?: ReactNode
  /** Maps to `data-status` on the badge wrapper (e.g. in_sync | error | pending). */
  badgeStatus?: string
  hint?: ReactNode
  stats?: ReactNode
  actions?: ReactNode
  className?: string
}

export type CollectionHubCardProps =
  | (CollectionHubCardShared & {
      variant?: 'default'
    })
  | (CollectionHubCardShared & {
      variant: 'create'
    } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children' | 'title'>)

/**
 * Magazine Collection / capability-project hub card.
 * Spec: specs/domain/zaoly-ui-collection-hub-card.md · Origin: Brandion project tiles.
 */
export function CollectionHubCard(props: CollectionHubCardProps) {
  const {
    title,
    kicker,
    badge,
    badgeStatus,
    hint,
    stats,
    actions,
    variant = 'default',
    className,
    ...rest
  } = props
  const create = variant === 'create'
  const rootClass = cx(
    'ds-collection-hub-card',
    create && 'ds-collection-hub-card--create',
    className,
  )

  const body = (
    <>
      <header className="ds-collection-hub-card__head">
        <Text role="meta" as="p" className="ds-collection-hub-card__kicker">
          {kicker ?? '\u00a0'}
        </Text>
        {badge != null ? (
          <span
            className="ds-collection-hub-card__badge"
            data-status={badgeStatus}
          >
            {badge}
          </span>
        ) : null}
      </header>

      <Text
        role="headline"
        as={create ? 'span' : 'h3'}
        className="ds-collection-hub-card__title"
      >
        {title}
      </Text>

      {hint != null ? (
        <Text role="meta" as={create ? 'span' : 'p'} className="ds-collection-hub-card__hint">
          {hint}
        </Text>
      ) : null}

      {stats != null ? (
        <div className="ds-collection-hub-card__stats">{stats}</div>
      ) : null}

      {actions != null ? (
        <div className="ds-collection-hub-card__actions">{actions}</div>
      ) : null}
    </>
  )

  if (create) {
    const buttonRest = rest as ButtonHTMLAttributes<HTMLButtonElement>
    return (
      <button
        type={buttonRest.type ?? 'button'}
        {...buttonRest}
        className={rootClass}
      >
        {body}
      </button>
    )
  }

  return <article className={rootClass}>{body}</article>
}
