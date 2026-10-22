'use client'

import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  MouseEvent,
  ReactNode,
} from 'react'
import { ZaolyCornerBox } from '../brand/ZaolyCornerBox'
import {
  ZAOLY_SHELL_CORNER_RADIUS,
  TOP_LEFT_BACK_CORNERS,
  type CornerKey,
  type CornerStyle,
} from '../brand/zaolyCutdown'
import { IconArrowLeft } from './icons'

type SharedProps = {
  /** Accessible name — required for the icon-only control. */
  label?: string
  /** Leading icon override (default `IconArrowLeft`). */
  icon?: ReactNode
  borderRadius?: number
  corners?: Record<CornerKey, CornerStyle>
  className?: string
  disabled?: boolean
}

export type ShellBackButtonProps =
  | (SharedProps & {
      href?: undefined
      onClick?: ButtonHTMLAttributes<HTMLButtonElement>['onClick']
    } & Omit<
      ButtonHTMLAttributes<HTMLButtonElement>,
      'className' | 'children' | 'onClick' | 'disabled' | 'type'
    >)
  | (SharedProps & {
      href: string
      onClick?: AnchorHTMLAttributes<HTMLAnchorElement>['onClick']
    } & Omit<
      AnchorHTMLAttributes<HTMLAnchorElement>,
      'className' | 'children' | 'onClick' | 'href'
    >)

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/**
 * Fixed top-left shell history-back plaque — mirror of BrandCorner.
 * Spec: specs/domain/zaoly-ui-shell-back-button.md
 */
export function ShellBackButton(props: ShellBackButtonProps) {
  const {
    label = 'Back',
    icon,
    borderRadius = ZAOLY_SHELL_CORNER_RADIUS,
    corners = TOP_LEFT_BACK_CORNERS,
    className,
    disabled,
  } = props
  const mark = icon ?? <IconArrowLeft size={18} strokeWidth={2} aria-hidden />

  const control =
    props.href != null ? (
      <a
        href={props.href}
        className="shell-back-corner-btn"
        aria-label={label}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : undefined}
        onClick={(event: MouseEvent<HTMLAnchorElement>) => {
          if (disabled) {
            event.preventDefault()
            return
          }
          props.onClick?.(event)
        }}
      >
        {mark}
      </a>
    ) : (
      <button
        type="button"
        className="shell-back-corner-btn"
        aria-label={label}
        disabled={disabled}
        onClick={props.onClick}
      >
        {mark}
      </button>
    )

  return (
    <div
      className={cx('shell-back-corner', className)}
      data-testid="shell-back-corner"
    >
      <ZaolyCornerBox
        className="shell-back-corner-box"
        borderRadius={borderRadius}
        topLeft={corners.topLeft}
        topRight={corners.topRight}
        bottomLeft={corners.bottomLeft}
        bottomRight={corners.bottomRight}
      >
        {control}
      </ZaolyCornerBox>
    </div>
  )
}
