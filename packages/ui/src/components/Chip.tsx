import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ChipSize = 'sm' | 'md'

type ChipShared = {
  selected?: boolean
  size?: ChipSize
  children?: ReactNode
  className?: string
}

export type ChipProps =
  | (ChipShared & {
      static?: false
    } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>)
  | (ChipShared & {
      static: true
    })

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

function chipClass({
  selected,
  size,
  className,
  isStatic,
}: {
  selected: boolean
  size: ChipSize
  className?: string
  isStatic: boolean
}): string {
  return cx(
    'ds-chip',
    'chip',
    `ds-chip--${size}`,
    size === 'sm' && 'dense',
    selected && 'ds-chip--selected',
    selected && 'active',
    isStatic && 'ds-chip--static',
    isStatic && 'static',
    className,
  )
}

/**
 * Filter / toggle chip — specs/domain/zaoly-ui-chip.md
 * Legacy pages may still use `.chip`; prefer `<Chip>` for new UI.
 */
export function Chip(props: ChipProps) {
  const selected = props.selected ?? false
  const size = props.size ?? 'sm'
  const className = props.className

  if (props.static) {
    return (
      <span className={chipClass({ selected, size, className, isStatic: true })}>
        {props.children}
      </span>
    )
  }

  const { static: _s, selected: _sel, size: _sz, className: _c, children, type = 'button', ...rest } =
    props

  return (
    <button
      type={type}
      className={chipClass({ selected, size, className, isStatic: false })}
      aria-pressed={selected}
      {...rest}
    >
      {children}
    </button>
  )
}
