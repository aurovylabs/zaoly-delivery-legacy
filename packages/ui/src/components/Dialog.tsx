'use client'

import {
  useEffect,
  useRef,
  type ReactNode,
  type DialogHTMLAttributes,
  type SyntheticEvent,
} from 'react'
import { Button } from './Button'

export type DialogProps = {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children?: ReactNode
  /** Footer actions (defaults to Close button if omitted and title set) */
  actions?: ReactNode
  className?: string
} & Omit<DialogHTMLAttributes<HTMLDialogElement>, 'className' | 'open' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Native dialog modal — specs/domain/zaoly-ui-extended.md */
export function Dialog({
  open,
  onClose,
  title,
  children,
  actions,
  className,
  ...rest
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  /** Programmatic close() in effect cleanup must not notify the host — otherwise
   * React Strict Mode remount (or conditional mount) races: close → onClose → open=false. */
  const suppressHostCloseRef = useRef(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const closeQuietly = () => {
      if (!node.open) return
      suppressHostCloseRef.current = true
      try {
        if (typeof node.close === 'function') node.close()
        else node.removeAttribute('open')
      } finally {
        suppressHostCloseRef.current = false
      }
    }

    if (open) {
      if (!node.open) {
        if (typeof node.showModal === 'function') node.showModal()
        else node.setAttribute('open', '')
      }
    } else {
      closeQuietly()
    }
    return () => {
      // Unmounting an open showModal() dialog without close() leaves the browser
      // top-layer inert — clicks appear "locked" until a full page refresh.
      closeQuietly()
    }
  }, [open])

  const handleNativeClose = (_e: SyntheticEvent<HTMLDialogElement>) => {
    if (suppressHostCloseRef.current) return
    onClose()
  }

  return (
    <dialog
      ref={ref}
      className={cx('ds-dialog', className)}
      onClose={handleNativeClose}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      {...rest}
    >
      <div className="ds-dialog-sheet">
        {title != null ? (
          <header className="ds-dialog-header">
            <h2 className="ds-dialog-title">{title}</h2>
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
              ×
            </Button>
          </header>
        ) : null}
        <div className="ds-dialog-body">{children}</div>
        {actions != null ? <footer className="ds-dialog-actions">{actions}</footer> : null}
      </div>
    </dialog>
  )
}
