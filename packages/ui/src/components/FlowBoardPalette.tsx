import type { HTMLAttributes, ReactNode } from 'react'
import { Button } from './Button'

export type FlowBoardPaletteProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  children?: ReactNode
  fabLabel?: string
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Bausteine palette chrome — kinds via children when open. */
export function FlowBoardPalette({
  open,
  onOpenChange,
  title = 'Bausteine',
  children,
  fabLabel = 'Bausteine',
  className,
  ...rest
}: FlowBoardPaletteProps) {
  if (!open) {
    return (
      <div className={cx('zaoly-flow-palette-fab-wrap', className)} {...rest}>
        <Button
          type="button"
          variant="primary"
          size="lg"
          shape="pill"
          className="zaoly-flow-palette-fab"
          aria-label={fabLabel}
          title={fabLabel}
          onClick={() => onOpenChange(true)}
        >
          +
        </Button>
      </div>
    )
  }

  return (
    <div className={cx('zaoly-flow-palette', className)} {...rest}>
      <div className="zaoly-flow-palette-head">
        <strong>{title}</strong>
        <Button type="button" size="sm" variant="ghost" onClick={() => onOpenChange(false)}>
          Schließen
        </Button>
      </div>
      <div className="zaoly-flow-palette-body">{children}</div>
    </div>
  )
}
