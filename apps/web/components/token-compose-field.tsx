'use client'

import React from 'react'
import { Chip, Field, Input, Select } from '../lib/zaoly-ui'
import { paths } from '../lib/paths'
import {
  buildColorMixExpr,
  buildSpacingHalfExpr,
  buildSpacingScaleExpr,
  COLOR_SHADE_PRESETS,
  extractTokenRefs,
  looksLikeTokenExpr,
  resolveTokenExpr,
  SPACING_SCALE_PRESETS,
  type ResolveTokenCss,
} from '../lib/tokens/token-expr'

type TokenComposeFieldProps = {
  type: 'spacing' | 'color'
  value: string
  onChange: (next: string) => void
  /** Smart-ranked, cycle-safe candidate paths (exclude self). */
  candidates: string[]
  /** Resolve pack digital for live readout. */
  resolveCss?: ResolveTokenCss
  /** Literal digital controls (wheel / color) — shown when value is not an expression. */
  literal: React.ReactNode
  disabled?: boolean
  onKeyDown?: (event: React.KeyboardEvent) => void
  t: (key: string) => string
  testId?: string
}

function primaryRef(value: string): string {
  return extractTokenRefs(value)[0] ?? ''
}

/**
 * Smart compose on the digital value field (no Literal/Derived mode toggle).
 * Spec: specs/domain/zaoly-token-studio.md
 */
export function TokenComposeField({
  type,
  value,
  onChange,
  candidates,
  resolveCss,
  literal,
  disabled = false,
  onKeyDown,
  t,
  testId = 'token-compose',
}: TokenComposeFieldProps) {
  const derived = looksLikeTokenExpr(value)
  const base = primaryRef(value) || candidates[0] || ''
  const options = candidates.map((path) => ({ value: path, label: path }))
  const resolved =
    derived && resolveCss ? resolveTokenExpr(value, resolveCss) : derived ? value : null

  function linkFromToken() {
    if (!base) return
    if (type === 'spacing') onChange(buildSpacingScaleExpr(base, 2))
    else onChange(buildColorMixExpr(base, 22, 'white'))
  }

  function unlinkToLiteral() {
    onChange(type === 'color' ? paths.brandPrimaryHex : '1rem')
  }

  function setBase(nextPath: string) {
    if (!nextPath) return
    if (type === 'spacing') {
      const half = /\/\s*2\)\s*$/.test(value)
      const m = value.match(/\*\s*([\d.]+)\s*\)\s*$/)
      if (half) onChange(buildSpacingHalfExpr(nextPath))
      else if (m) onChange(buildSpacingScaleExpr(nextPath, Number(m[1])))
      else onChange(buildSpacingScaleExpr(nextPath, 2))
      return
    }
    const soft = COLOR_SHADE_PRESETS.find((p) => value.includes(`${p.percent}%`))
    const preset = soft ?? COLOR_SHADE_PRESETS[0]!
    onChange(buildColorMixExpr(nextPath, preset.percent, preset.toward))
  }

  if (!derived) {
    return (
      <div className="zaoly-token-studio__compose" data-testid={testId}>
        {literal}
        {candidates.length > 0 ? (
          <div className="zaoly-token-studio__compose-link" role="group" aria-label={t('tokens.composeLink')}>
            <Chip size="sm" disabled={disabled} onClick={linkFromToken} data-testid={`${testId}-link`}>
              {`{ } ${t('tokens.composeLink')}`}
            </Chip>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="zaoly-token-studio__compose" data-testid={testId}>
      <Field label={t('tokens.value')}>
        <div
          className="zaoly-token-studio__expr-input"
          data-testid={`${testId}-expr`}
          title={t('tokens.composeExprHint')}
        >
          <span className="zaoly-token-studio__expr-badge" aria-hidden>
            {'{ }'}
          </span>
          <Input
            className="zaoly-token-studio__expr-input-control"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={disabled}
            spellCheck={false}
            autoComplete="off"
            aria-label={t('tokens.value')}
            data-testid={`${testId}-expr-input`}
          />
        </div>
      </Field>
      <Field label={t('tokens.composeBase')}>
        <Select
          value={base}
          options={options}
          disabled={disabled || options.length === 0}
          aria-label={t('tokens.composeBase')}
          onChange={(next) => setBase(next)}
        />
      </Field>
      {type === 'spacing' ? (
        <div className="zaoly-token-studio__compose-presets" role="group" aria-label={t('tokens.composeScale')}>
          {SPACING_SCALE_PRESETS.map((preset) => {
            const expr =
              preset.factor === 0.5
                ? buildSpacingHalfExpr(base)
                : buildSpacingScaleExpr(base, preset.factor)
            return (
              <Chip
                key={preset.id}
                size="sm"
                selected={value === expr}
                disabled={disabled || !base}
                onClick={() => onChange(expr)}
              >
                {t(preset.labelKey)}
              </Chip>
            )
          })}
        </div>
      ) : (
        <div className="zaoly-token-studio__compose-presets" role="group" aria-label={t('tokens.composeShade')}>
          {COLOR_SHADE_PRESETS.map((preset) => {
            const expr = buildColorMixExpr(base, preset.percent, preset.toward)
            return (
              <Chip
                key={preset.id}
                size="sm"
                selected={value === expr}
                disabled={disabled || !base}
                onClick={() => onChange(expr)}
              >
                {t(preset.labelKey)}
              </Chip>
            )
          })}
        </div>
      )}
      <div
        className={
          resolved
            ? 'zaoly-token-studio__compose-resolve'
            : 'zaoly-token-studio__compose-resolve zaoly-token-studio__compose-resolve--invalid'
        }
        data-testid={`${testId}-resolve`}
        aria-live="polite"
      >
        {resolved ? (
          <>
            {type === 'color' ? (
              <span
                className="zaoly-token-studio__compose-resolve-swatch"
                style={{ background: resolved }}
                aria-hidden
              />
            ) : null}
            <code>→ {resolved}</code>
          </>
        ) : (
          <span>{t('tokens.composeUnresolved')}</span>
        )}
      </div>
      <div className="zaoly-token-studio__compose-link">
        <Chip size="sm" disabled={disabled} onClick={unlinkToLiteral} data-testid={`${testId}-unlink`}>
          {t('tokens.composeUnlink')}
        </Chip>
      </div>
    </div>
  )
}
