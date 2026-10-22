import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type AddTileProps = {
  label?: ReactNode
  plus?: ReactNode
  className?: string
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Dashed grid “add” tile — Brandion token board empty slot. */
export function AddTile({
  label = 'Add',
  plus = '+',
  className,
  type = 'button',
  ...rest
}: AddTileProps) {
  return (
    <button type={type} className={cx('ds-add-tile', className)} {...rest}>
      <span className="ds-add-tile__plus" aria-hidden>
        {plus}
      </span>
      <span className="ds-add-tile__label">{label}</span>
    </button>
  )
}
