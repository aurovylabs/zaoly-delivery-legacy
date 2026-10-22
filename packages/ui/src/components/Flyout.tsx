'use client'

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Button } from './Button'

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Open/close helpers for icon-triggered flyouts (Escape + outside click). */
export function useFlyout(resetKey?: string | null) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onPointer)
    }
  }, [open])

  useEffect(() => {
    setOpen(false)
  }, [resetKey])

  return { open, setOpen, rootRef, toggle: () => setOpen((v) => !v) }
}

export type FlyoutSurface = 'solid' | 'glass'

export type FlyoutProps = {
  label: string
  icon: ReactNode
  /** Magazine default is solid (hairline + opaque). Glass is legacy opt-in. */
  surface?: FlyoutSurface
  resetKey?: string | null
  triggerClassName?: string
  panelClassName?: string
  disabled?: boolean
  children: (ctx: { close: () => void }) => ReactNode
}

/**
 * Ghost icon trigger + anchored panel. No page-level overlay/scrim.
 * Spec: specs/domain/zaoly-ui-flyout.md
 */
export function Flyout({
  label,
  icon,
  surface = 'solid',
  resetKey,
  triggerClassName,
  panelClassName,
  disabled,
  children,
}: FlyoutProps) {
  const panelId = useId()
  const { open, setOpen, rootRef, toggle } = useFlyout(resetKey)

  return (
    <div className="ds-flyout" ref={rootRef}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cx(triggerClassName, open && 'is-active')}
        icon={icon}
        aria-label={label}
        aria-expanded={open}
        aria-controls={panelId}
        disabled={disabled}
        onClick={toggle}
      />
      {open ? (
        <div
          id={panelId}
          className={cx(
            'ds-flyover',
            'ds-motion-reveal',
            surface === 'glass' && 'ds-flyover--glass',
            panelClassName,
          )}
          data-surface={surface}
          role="dialog"
          aria-label={label}
        >
          {children({ close: () => setOpen(false) })}
        </div>
      ) : null}
    </div>
  )
}
