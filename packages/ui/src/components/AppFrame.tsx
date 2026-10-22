import type { HTMLAttributes, ReactNode } from 'react'
import { ShellCorners } from './ShellCorners'
import { ZAOLY_SHELL_CORNER_RADIUS } from '../brand/zaolyCutdown'

export type AppFrameRailEdge = 'left' | 'right' | 'top' | 'bottom'

export type AppFrameProps = {
  children: ReactNode
  rail?: ReactNode
  brandCorner?: ReactNode
  /** Fixed top-left history-back plaque (`ShellBackButton`). */
  backCorner?: ReactNode
  topbar?: ReactNode
  railEdge?: AppFrameRailEdge
  /** Viewport cutdowns at TL / BL / BR (TR reserved for brand; TL skipped when `backCorner` set). */
  shellCorners?: boolean
  shellCornerRadius?: number
  className?: string
} & Omit<HTMLAttributes<HTMLElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function AppFrame({
  children,
  rail,
  brandCorner,
  backCorner,
  topbar,
  railEdge = 'left',
  shellCorners = true,
  shellCornerRadius = ZAOLY_SHELL_CORNER_RADIUS,
  className,
  ...rest
}: AppFrameProps) {
  return (
    <main className={cx('app-frame', className)} data-rail-edge={railEdge} {...rest}>
      <div className="atmosphere" aria-hidden />
      {shellCorners ? (
        <ShellCorners borderRadius={shellCornerRadius} omitTopLeft={Boolean(backCorner)} />
      ) : null}
      {backCorner}
      {brandCorner}
      {rail}
      <div className="app-main">
        {topbar ? <header className="topbar">{topbar}</header> : null}
        <div className="page-body">{children}</div>
      </div>
    </main>
  )
}
