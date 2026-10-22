'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Input, Slider } from '@zaoly/ui'
import {
  clampOpacityPercent,
  formatOpacityPercentLabel,
  opacityToPercent,
  percentToOpacityLiteral,
} from '../lib/inspect/opacity-format'

type InspectOpacityFieldProps = {
  sliderAriaLabel: string
  percentAriaLabel: string
  /** Bound token path if any */
  tokenPath: string
  /** Literal prop value (0–1 or %) */
  literalValue: string
  /** Resolved CSS preview when token-bound (e.g. "0.4") */
  resolvedPreview?: string
  mixed?: boolean
  mixedLabel: string
  disabled?: boolean
  onCommitLiteral: (opacity01: number) => void
  tokenPicker: ReactNode
}

export function InspectOpacityField({
  sliderAriaLabel,
  percentAriaLabel,
  tokenPath,
  literalValue,
  resolvedPreview,
  mixed,
  mixedLabel,
  disabled,
  onCommitLiteral,
  tokenPicker,
}: InspectOpacityFieldProps) {
  const sourceForPercent = tokenPath ? (resolvedPreview ?? literalValue) : literalValue
  const derived = mixed ? null : opacityToPercent(sourceForPercent)
  const [draftPercent, setDraftPercent] = useState(() => derived ?? 100)
  const [percentText, setPercentText] = useState(() =>
    mixed ? mixedLabel : formatOpacityPercentLabel(derived ?? 100),
  )

  useEffect(() => {
    if (mixed) {
      setPercentText(mixedLabel)
      return
    }
    const next = opacityToPercent(sourceForPercent) ?? 100
    setDraftPercent(next)
    setPercentText(formatOpacityPercentLabel(next))
  }, [sourceForPercent, mixed, mixedLabel])

  function commitPercent(raw: number) {
    const next = clampOpacityPercent(raw)
    setDraftPercent(next)
    setPercentText(formatOpacityPercentLabel(next))
    onCommitLiteral(percentToOpacityLiteral(next))
  }

  return (
    <div className="creation-inspect-opacity" data-testid="inspect-opacity-field">
      <div className="creation-inspect-opacity__row">
        <Slider
          value={mixed ? 100 : draftPercent}
          min={0}
          max={100}
          step={1}
          disabled={disabled || mixed}
          aria-label={sliderAriaLabel}
          data-testid="inspect-opacity-slider"
          onChange={(value) => {
            setDraftPercent(value)
            setPercentText(formatOpacityPercentLabel(value))
          }}
          onCommit={(value) => commitPercent(value)}
        />
        <Input
          value={percentText}
          disabled={disabled || mixed}
          aria-label={percentAriaLabel}
          data-testid="inspect-opacity-percent"
          className="creation-inspect-opacity__percent"
          onChange={(e) => setPercentText(e.target.value)}
          onBlur={() => {
            if (mixed) return
            const parsed = Number(String(percentText).replace(/%/g, '').trim())
            if (!Number.isFinite(parsed)) {
              setPercentText(formatOpacityPercentLabel(draftPercent))
              return
            }
            commitPercent(parsed)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              ;(e.target as HTMLInputElement).blur()
            }
          }}
        />
        <span className="creation-inspect-opacity__suffix" aria-hidden="true">
          %
        </span>
      </div>
      <div className="creation-inspect-opacity__token">{tokenPicker}</div>
    </div>
  )
}
