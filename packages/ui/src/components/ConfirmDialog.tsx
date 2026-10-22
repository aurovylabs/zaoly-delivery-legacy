'use client'

import type { ReactNode } from 'react'
import { Button } from './Button'
import { Dialog, type DialogProps } from './Dialog'

export type ConfirmDialogProps = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  children?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** Destructive confirm uses danger-looking primary action */
  danger?: boolean
  className?: string
} & Pick<DialogProps, 'id'>

/**
 * Confirm pattern on Dialog — specs/domain/zaoly-ui-forms.md
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirm',
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  className,
  id,
}: ConfirmDialogProps) {
  return (
    <Dialog
      id={id}
      open={open}
      onClose={onClose}
      title={title}
      className={className}
      actions={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? 'ghost' : 'primary'}
            size="sm"
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Dialog>
  )
}
