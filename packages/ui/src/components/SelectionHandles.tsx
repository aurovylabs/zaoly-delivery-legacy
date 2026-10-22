import type { HTMLAttributes, PointerEvent } from 'react'

export type SelectionHandleCorner = 'nw' | 'ne' | 'sw' | 'se'

export type SelectionHandlesProps = {
  className?: string
  width?: number
  height?: number
  left?: number
  top?: number
  visible?: boolean
  /** When true, corner handles accept pointer events. */
  interactive?: boolean
  onHandlePointerDown?: (
    handle: SelectionHandleCorner,
    event: PointerEvent<HTMLSpanElement>,
  ) => void
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

const CORNERS: SelectionHandleCorner[] = ['nw', 'ne', 'sw', 'se']

/** Visual bounding box + corner handles (no resize math). */
export function SelectionHandles({
  className,
  width = 120,
  height = 80,
  left = 0,
  top = 0,
  visible = true,
  interactive = false,
  onHandlePointerDown,
  style,
  ...rest
}: SelectionHandlesProps) {
  if (!visible) return null
  return (
    <div
      className={cx(
        'ds-selection-handles',
        interactive && 'ds-selection-handles--interactive',
        className,
      )}
      style={{ width, height, left, top, ...style }}
      data-testid="selection-handles"
      aria-hidden
      {...rest}
    >
      {CORNERS.map((corner) => (
        <span
          key={corner}
          className={cx(
            'ds-selection-handles__corner',
            `ds-selection-handles__corner--${corner}`,
          )}
          data-handle={corner}
          onPointerDown={
            interactive
              ? (event) => {
                  event.stopPropagation()
                  onHandlePointerDown?.(corner, event)
                }
              : undefined
          }
        />
      ))}
    </div>
  )
}
