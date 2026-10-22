'use client'

import { useEffect, useState } from 'react'
import { Input } from '@zaoly/ui'

/** P78: local draft while typing; commit on blur / Enter (one history entry). */
export function CommitOnBlurInput({
  value,
  onCommit,
  placeholder,
  'aria-label': ariaLabel,
  'data-testid': testId,
  readOnly,
}: {
  value: string
  onCommit: (next: string) => void
  placeholder?: string
  'aria-label'?: string
  'data-testid'?: string
  readOnly?: boolean
}) {
  const [draft, setDraft] = useState(value)
  useEffect(() => {
    setDraft(value)
  }, [value])

  function commitFrom(raw: string) {
    if (readOnly) return
    if (raw === value) return
    onCommit(raw)
  }

  return (
    <Input
      block
      value={draft}
      placeholder={placeholder}
      aria-label={ariaLabel}
      data-testid={testId}
      readOnly={readOnly}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={(e) => {
        const next = e.currentTarget.value
        setDraft(next)
        commitFrom(next)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          ;(e.target as HTMLInputElement).blur()
        }
      }}
    />
  )
}
