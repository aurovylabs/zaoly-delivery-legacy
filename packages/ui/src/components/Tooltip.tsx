'use client'

import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

export type TooltipProps = {
  content: ReactNode
  children: ReactNode
  className?: string
} & Omit<HTMLAttributes<HTMLSpanElement>, 'className' | 'children' | 'content'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

const VIEWPORT_PAD = 8
const ANCHOR_GAP = 4

type Placement = {
  top: number
  left: number
  width: number
}

function measureSize(el: HTMLElement): { width: number; height: number } {
  const rect = el.getBoundingClientRect()
  const width = rect.width || el.offsetWidth || el.scrollWidth
  const height = rect.height || el.offsetHeight || el.scrollHeight
  return { width, height }
}

function placementEqual(a: Placement | null, b: Placement): boolean {
  if (!a) return false
  return a.top === b.top && a.left === b.left && a.width === b.width
}

function computePlacement(
  anchor: DOMRect,
  tipW: number,
  tipH: number,
  vw: number,
  vh: number,
): Placement {
  const maxW = Math.max(0, vw - VIEWPORT_PAD * 2)
  const width = Math.min(tipW, maxW)
  // Re-wrap may change height; callers remeasure after applying width when needed.
  const height = tipH

  let left = anchor.left + anchor.width / 2 - width / 2
  left = Math.min(Math.max(VIEWPORT_PAD, left), Math.max(VIEWPORT_PAD, vw - width - VIEWPORT_PAD))

  const spaceAbove = anchor.top - VIEWPORT_PAD
  const spaceBelow = vh - anchor.bottom - VIEWPORT_PAD
  const need = height + ANCHOR_GAP

  let top: number
  if (spaceAbove >= need) {
    top = anchor.top - height - ANCHOR_GAP
  } else if (spaceBelow >= need) {
    top = anchor.bottom + ANCHOR_GAP
  } else if (spaceAbove >= spaceBelow) {
    // Prefer above, pin into viewport without jumping away from the anchor.
    top = Math.max(VIEWPORT_PAD, anchor.top - height - ANCHOR_GAP)
  } else {
    top = Math.min(vh - height - VIEWPORT_PAD, anchor.bottom + ANCHOR_GAP)
  }

  return { top, left, width }
}

/** Hover/focus tooltip — specs/domain/zaoly-ui-extended.md */
export function Tooltip({ content, children, className, ...rest }: TooltipProps) {
  const tipId = useId()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const anchorRef = useRef<HTMLSpanElement>(null)
  const bubbleRef = useRef<HTMLSpanElement>(null)
  const [placement, setPlacement] = useState<Placement | null>(null)
  const placementRef = useRef<Placement | null>(null)
  const rafRef = useRef<number | null>(null)

  function show() {
    setOpen(true)
  }
  function hide() {
    setOpen(false)
    placementRef.current = null
    setPlacement(null)
  }

  function place() {
    const anchorEl = anchorRef.current
    const bubble = bubbleRef.current
    if (!anchorEl || !bubble || typeof window === 'undefined') return

    const anchor = anchorEl.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight

    // First pass: natural size at a safe off-screen measure point.
    const first = measureSize(bubble)
    if (first.width <= 0 || first.height <= 0) return

    let next = computePlacement(anchor, first.width, first.height, vw, vh)

    // Second pass: apply clamped width so wrapping height is accurate, then recompute.
    bubble.style.width = `${next.width}px`
    const second = measureSize(bubble)
    next = computePlacement(anchor, second.width || next.width, second.height || first.height, vw, vh)

    if (placementEqual(placementRef.current, next)) return
    placementRef.current = next
    setPlacement(next)
  }

  function schedulePlace() {
    if (rafRef.current != null) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      place()
    })
  }

  useLayoutEffect(() => {
    setMounted(true)
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    place()
    schedulePlace()
    const onReposition = () => schedulePlace()
    window.addEventListener('scroll', onReposition, { capture: true, passive: true })
    window.addEventListener('resize', onReposition, { passive: true })
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      window.removeEventListener('scroll', onReposition, true)
      window.removeEventListener('resize', onReposition)
    }
  }, [open, content])

  const bubbleStyle: CSSProperties = placement
    ? {
        position: 'fixed',
        top: placement.top,
        left: placement.left,
        width: placement.width,
        right: 'auto',
        bottom: 'auto',
        transform: 'none',
        visibility: 'visible',
        zIndex: 1000,
      }
    : {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 'auto',
        bottom: 'auto',
        transform: 'none',
        visibility: 'hidden',
        pointerEvents: 'none',
        zIndex: 1000,
      }

  const bubble =
    open && mounted ? (
      createPortal(
        <span
          ref={bubbleRef}
          id={tipId}
          role="tooltip"
          className="ds-tooltip-bubble ds-tooltip-bubble--portal"
          style={bubbleStyle}
        >
          {content}
        </span>,
        document.body,
      )
    ) : null

  return (
    <span
      className={cx('ds-tooltip', open && 'ds-tooltip--open', className)}
      {...rest}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={(e: FocusEvent<HTMLSpanElement>) => {
        show()
        rest.onFocus?.(e)
      }}
      onBlur={(e: FocusEvent<HTMLSpanElement>) => {
        hide()
        rest.onBlur?.(e)
      }}
    >
      <span
        ref={anchorRef}
        className="ds-tooltip-anchor"
        aria-describedby={open ? tipId : undefined}
      >
        {children}
      </span>
      {bubble}
    </span>
  )
}
