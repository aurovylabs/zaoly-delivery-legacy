import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'

export type CanvasViewportProps = {
  children?: ReactNode
  className?: string
  /** Artboard width in CSS px (logical). */
  artboardWidth?: number
  /** Artboard height in CSS px (logical). */
  artboardHeight?: number
  /** Zoom scale (1 = 100%). */
  zoom?: number
  /** Pan offset. */
  panX?: number
  panY?: number
  overlays?: ReactNode
  'aria-label'?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/**
 * Pan/zoom artboard host for composition editors.
 * Apps own gesture handlers; this is chrome + transform slot.
 */
export function CanvasViewport({
  children,
  className,
  artboardWidth = 1280,
  artboardHeight = 800,
  zoom = 1,
  panX = 0,
  panY = 0,
  overlays,
  'aria-label': ariaLabel = 'Canvas',
  ...rest
}: CanvasViewportProps) {
  const artboardStyle: CSSProperties = {
    width: artboardWidth,
    height: artboardHeight,
    transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
    transformOrigin: '0 0',
  }

  return (
    <div
      className={cx('ds-canvas-viewport', className)}
      aria-label={ariaLabel}
      data-zoom={zoom}
      {...rest}
    >
      <div className="ds-canvas-viewport__stage">
        <div className="ds-canvas-viewport__artboard" style={artboardStyle} data-testid="canvas-artboard">
          {children}
        </div>
      </div>
      {overlays ? <div className="ds-canvas-viewport__overlays">{overlays}</div> : null}
    </div>
  )
}
