'use client'

import React, { useEffect, useState } from 'react'
import { Chip, Field, Input } from '../lib/zaoly-ui'
import {
  applyPickerHex,
  COLOR_FORMAT_LABEL_KEYS,
  COLOR_FORMATS,
  convertColorFormat,
  detectColorFormat,
  isValidCssColor,
  toPickerHex,
  type ColorFormat,
} from '../lib/tokens/color-css'

type TokenColorFieldProps = {
  value: string
  onChange: (next: string) => void
  disabled?: boolean
  onKeyDown?: (event: React.KeyboardEvent) => void
  t: (key: string) => string
  testId?: string
}

/**
 * Multi-format color literal control (HEX / RGB / HSL / OKLCH).
 * Spec: specs/domain/zaoly-token-studio.md
 */
export function TokenColorField({
  value,
  onChange,
  disabled = false,
  onKeyDown,
  t,
  testId = 'token-color',
}: TokenColorFieldProps) {
  const [format, setFormat] = useState<ColorFormat>(() => detectColorFormat(value))
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    setDraft(value)
    if (isValidCssColor(value)) setFormat(detectColorFormat(value))
  }, [value])

  function commitFormat(next: ColorFormat) {
    setFormat(next)
    const converted = convertColorFormat(value, next)
    if (!converted) return
    setDraft(converted)
    onChange(converted)
  }

  function onDraftChange(next: string) {
    setDraft(next)
    if (!isValidCssColor(next)) return
    setFormat(detectColorFormat(next))
    onChange(next)
  }

  function onPicker(nextHex: string) {
    const next = applyPickerHex(isValidCssColor(draft) ? draft : value, nextHex)
    setDraft(next)
    onChange(next)
  }

  return (
    <div className="zaoly-token-studio__color-field" data-testid={testId}>
      <Field label={t('tokens.value')}>
        <div className="zaoly-token-studio__color-row">
          <input
            type="color"
            aria-label={t('tokens.colorPicker')}
            value={toPickerHex(isValidCssColor(draft) ? draft : value)}
            onChange={(e) => onPicker(e.target.value)}
            disabled={disabled}
            data-testid={`${testId}-picker`}
          />
          <Input
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={disabled}
            spellCheck={false}
            autoComplete="off"
            aria-label={t('tokens.value')}
            data-testid={`${testId}-input`}
          />
        </div>
      </Field>
      <div
        className="zaoly-token-studio__color-formats"
        role="group"
        aria-label={t('tokens.colorFormats')}
      >
        {COLOR_FORMATS.map((id) => (
          <Chip
            key={id}
            size="sm"
            selected={format === id}
            disabled={disabled || !isValidCssColor(value)}
            onClick={() => commitFormat(id)}
            data-testid={`${testId}-format-${id}`}
          >
            {t(COLOR_FORMAT_LABEL_KEYS[id])}
          </Chip>
        ))}
      </div>
    </div>
  )
}
