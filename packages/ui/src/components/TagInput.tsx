'use client'

import { useId, useState, type KeyboardEvent } from 'react'
import { Button } from './Button'

export type TagInputProps = {
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  disabled?: boolean
  id?: string
  size?: 'sm' | 'md'
  className?: string
  'aria-label'?: string
  'aria-invalid'?: boolean | 'true' | 'false'
  'aria-describedby'?: string
}

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

function normalizeTag(raw: string): string {
  return raw.trim().replace(/^,+|,+$/g, '').trim()
}

/**
 * Dismissible string tags — specs/domain/zaoly-ui-forms.md
 * Add via Enter or comma; remove via chip dismiss or Backspace on empty input.
 */
export function TagInput({
  value,
  onChange,
  placeholder = 'Add…',
  disabled,
  id,
  size = 'sm',
  className,
  'aria-label': ariaLabel,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}: TagInputProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const [draft, setDraft] = useState('')

  function commit(raw: string) {
    const tag = normalizeTag(raw)
    if (!tag) return
    if (value.some((v) => v.toLowerCase() === tag.toLowerCase())) {
      setDraft('')
      return
    }
    onChange([...value, tag])
    setDraft('')
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commit(draft)
      return
    }
    if (e.key === 'Backspace' && !draft && value.length) {
      e.preventDefault()
      removeAt(value.length - 1)
    }
  }

  return (
    <div
      className={cx(
        'ds-tag-input',
        `ds-tag-input--${size}`,
        disabled && 'ds-tag-input--disabled',
        ariaInvalid === true || ariaInvalid === 'true' ? 'ds-control--invalid' : null,
        className,
      )}
    >
      <ul className="ds-tag-input-list" aria-label={ariaLabel ?? 'Tags'}>
        {value.map((tag, index) => (
          <li key={`${tag}-${index}`} className="ds-tag-input-item">
            <span className="ds-chip ds-chip--sm ds-chip--static dense">{tag}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              aria-label={`Remove ${tag}`}
              onClick={() => removeAt(index)}
            >
              ×
            </Button>
          </li>
        ))}
      </ul>
      <input
        id={inputId}
        className={cx('ds-input', `ds-input--${size}`, 'ds-tag-input-field')}
        value={draft}
        disabled={disabled}
        placeholder={placeholder}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => {
          if (draft.trim()) commit(draft)
        }}
      />
    </div>
  )
}

export type TagInputLabel = string
