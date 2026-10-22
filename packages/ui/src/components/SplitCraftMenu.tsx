'use client'

import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'

export type SplitCraftMenuProps = {
  /** Accessible name for the dialog (and default head text when `header` is unset). */
  title: string
  /** Optional custom head (e.g. token picker row). Replaces the plain title text. */
  header?: ReactNode
  left: ReactNode
  right: ReactNode
  leftLabel?: string
  rightLabel?: string
  footer?: ReactNode
  className?: string
  /** Panel width hint (default 400). */
  width?: number | string
  /** Panel height hint (default 272). */
  height?: number | string
  'data-testid'?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children' | 'title'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/**
 * Compact two-column craft popover shell (left list · right properties).
 * Spec: `specs/domain/zaoly-ui-split-craft-menu.md`
 */
export function SplitCraftMenu({
  title,
  header,
  left,
  right,
  leftLabel,
  rightLabel,
  footer,
  className,
  width = 400,
  height = 272,
  'data-testid': testId = 'split-craft-menu',
  style,
  ...rest
}: SplitCraftMenuProps) {
  const sizeStyle: CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    minHeight: typeof height === 'number' ? `${height}px` : height,
    ...style,
  }

  return (
    <div
      className={cx('ds-split-craft-menu', className)}
      role="dialog"
      aria-label={title}
      data-testid={testId}
      style={sizeStyle}
      {...rest}
    >
      <div className="ds-split-craft-menu__head" data-testid="split-craft-menu-head">
        {header ?? title}
      </div>
      <div className="ds-split-craft-menu__body">
        <div className="ds-split-craft-menu__left" data-testid="split-craft-menu-left">
          {leftLabel ? (
            <div className="ds-split-craft-menu__col-label">{leftLabel}</div>
          ) : null}
          <div className="ds-split-craft-menu__left-scroll">{left}</div>
        </div>
        <div className="ds-split-craft-menu__right" data-testid="split-craft-menu-right">
          {rightLabel ? (
            <div className="ds-split-craft-menu__col-label">{rightLabel}</div>
          ) : null}
          <div className="ds-split-craft-menu__right-stack">{right}</div>
        </div>
      </div>
      {footer != null ? (
        <div className="ds-split-craft-menu__footer" data-testid="split-craft-menu-footer">
          {footer}
        </div>
      ) : null}
    </div>
  )
}
