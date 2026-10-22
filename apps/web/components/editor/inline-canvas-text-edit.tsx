'use client'

import { useEffect, useRef, type CSSProperties, type KeyboardEvent, type Ref } from 'react'
import { dispatchOnboardingAction } from '../../lib/editor/onboarding'
import { paths } from '../../lib/paths'

type InlineCanvasTextEditProps = {
  editRef: Ref<HTMLSpanElement>
  value: string
  style?: CSSProperties
  className?: string
  onCommit: (text: string) => void
  onCancel: () => void
}

function dispatchInlineEditActive(active: boolean) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent(paths.inlineEditActiveEvent, { detail: { active } }),
  )
}

/**
 * Canvas contenteditable for text leaves (Text / Heading / SiteText / Link / SiteLink).
 * Spec: knowledge/canvas-inline-text-edit.md
 */
export function InlineCanvasTextEdit({
  editRef,
  value,
  style,
  className,
  onCommit,
  onCancel,
}: InlineCanvasTextEditProps) {
  const cancelledRef = useRef(false)

  useEffect(() => {
    dispatchInlineEditActive(true)
    return () => dispatchInlineEditActive(false)
  }, [])

  return (
    <span
      ref={editRef}
      contentEditable
      role="textbox"
      data-testid="creation-inline-edit"
      suppressContentEditableWarning
      className={className}
      style={{
        ...style,
        outline: '1px dashed currentColor',
      }}
      onBlur={(e) => {
        if (cancelledRef.current) {
          cancelledRef.current = false
          return
        }
        onCommit(e.currentTarget.textContent ?? '')
        dispatchOnboardingAction('inlineText')
      }}
      onKeyDown={(e: KeyboardEvent<HTMLSpanElement>) => {
        e.stopPropagation()
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          e.currentTarget.blur()
        }
        if (e.key === 'Escape') {
          e.preventDefault()
          cancelledRef.current = true
          onCancel()
        }
      }}
    >
      {value}
    </span>
  )
}
