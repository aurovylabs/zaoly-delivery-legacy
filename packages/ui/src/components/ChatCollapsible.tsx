'use client'

import { useState, type HTMLAttributes, type ReactNode } from 'react'
import { Button } from './Button'
import { Text } from './Text'

export type ChatCollapsibleDensity = 'default' | 'compact'

export type ChatCollapsibleProps = {
  title: string
  defaultOpen?: boolean
  /** `compact` = inspect/rail chrome (sm ghost button + padded trigger). */
  density?: ChatCollapsibleDensity
  children?: ReactNode
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children' | 'title'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/**
 * Single disclosure for long assistant detail — specs/domain/zaoly-ui-chat-collapsible.md
 */
export function ChatCollapsible({
  title,
  defaultOpen = false,
  density = 'default',
  children,
  className,
  ...rest
}: ChatCollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen)
  const compact = density === 'compact'

  return (
    <div
      className={cx('ds-chat-collapsible', compact && 'ds-chat-collapsible--compact', open && 'is-open', className)}
      {...rest}
    >
      <Button
        type="button"
        variant="ghost"
        size={compact ? 'sm' : 'md'}
        shape={compact ? 'rounded' : 'square'}
        className="ds-chat-collapsible__trigger"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Text
          role={compact ? 'label' : 'title'}
          size={compact ? undefined : 'xl'}
          as="span"
          className="ds-chat-collapsible__title"
        >
          {title}
        </Text>
        <Text role="meta" as="span" aria-hidden>
          {open ? '▾' : '▸'}
        </Text>
      </Button>
      {open ? <div className="ds-chat-collapsible__body">{children}</div> : null}
    </div>
  )
}
