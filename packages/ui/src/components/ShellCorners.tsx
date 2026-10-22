import type { HTMLAttributes } from 'react'
import { ZaolyCornerBox } from '../brand/ZaolyCornerBox'
import {
  BOTTOM_LEFT_SHELL_CORNERS,
  BOTTOM_RIGHT_SHELL_CORNERS,
  ZAOLY_SHELL_CORNER_RADIUS,
  TOP_LEFT_SHELL_CORNERS,
} from '../brand/zaolyCutdown'

export type ShellCornersProps = {
  borderRadius?: number
  /** When true, skip TL ornament — reserved for `ShellBackButton` / `AppFrame.backCorner`. */
  omitTopLeft?: boolean
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/**
 * Viewport corner ornaments at TL / BL / BR — one concave cutdown each.
 * Top-right is reserved for `BrandCorner`. Top-left may be reserved for back.
 */
export function ShellCorners({
  borderRadius = ZAOLY_SHELL_CORNER_RADIUS,
  omitTopLeft = false,
  className,
  ...rest
}: ShellCornersProps) {
  return (
    <div
      className={cx('shell-corners', className)}
      data-testid="shell-corners"
      aria-hidden
      {...rest}
    >
      {omitTopLeft ? null : (
        <div className="shell-corner shell-corner--top-left">
          <ZaolyCornerBox
            className="shell-corner-box"
            borderRadius={borderRadius}
            topLeft={TOP_LEFT_SHELL_CORNERS.topLeft}
            topRight={TOP_LEFT_SHELL_CORNERS.topRight}
            bottomLeft={TOP_LEFT_SHELL_CORNERS.bottomLeft}
            bottomRight={TOP_LEFT_SHELL_CORNERS.bottomRight}
            style={{ width: 0, height: borderRadius }}
          />
        </div>
      )}
      <div className="shell-corner shell-corner--bottom-left">
        <ZaolyCornerBox
          className="shell-corner-box"
          borderRadius={borderRadius}
          topLeft={BOTTOM_LEFT_SHELL_CORNERS.topLeft}
          topRight={BOTTOM_LEFT_SHELL_CORNERS.topRight}
          bottomLeft={BOTTOM_LEFT_SHELL_CORNERS.bottomLeft}
          bottomRight={BOTTOM_LEFT_SHELL_CORNERS.bottomRight}
          style={{ width: 0, height: borderRadius }}
        />
      </div>
      <div className="shell-corner shell-corner--bottom-right">
        <ZaolyCornerBox
          className="shell-corner-box"
          borderRadius={borderRadius}
          topLeft={BOTTOM_RIGHT_SHELL_CORNERS.topLeft}
          topRight={BOTTOM_RIGHT_SHELL_CORNERS.topRight}
          bottomLeft={BOTTOM_RIGHT_SHELL_CORNERS.bottomLeft}
          bottomRight={BOTTOM_RIGHT_SHELL_CORNERS.bottomRight}
          style={{ width: 0, height: borderRadius }}
        />
      </div>
    </div>
  )
}
