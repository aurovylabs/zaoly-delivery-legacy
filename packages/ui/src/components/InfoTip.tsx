'use client'

import type { ReactNode } from 'react'
import { Button, type ButtonSize } from './Button'
import { IconInfo } from './icons'
import { Tooltip } from './Tooltip'

export type InfoTipProps = {
  /** Short tip body — callers own copy/locale. */
  content: ReactNode
  /** Required trigger aria-label. */
  label: string
  size?: Extract<ButtonSize, 'sm' | 'md'>
  className?: string
}

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/**
 * Ghost IconInfo + hover/focus Tooltip. Language-agnostic.
 * Spec: specs/domain/zaoly-ui-infotip.md
 */
export function InfoTip({ content, label, size = 'sm', className }: InfoTipProps) {
  return (
    <span className={cx('ds-infotip', className)}>
      <Tooltip content={content}>
        <Button
          type="button"
          variant="ghost"
          size={size}
          shape="square"
          icon={<IconInfo size={12} strokeWidth={2} />}
          aria-label={label}
          className="ds-infotip__trigger"
        />
      </Tooltip>
    </span>
  )
}
