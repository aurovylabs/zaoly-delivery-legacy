'use client'

import {
  Children,
  cloneElement,
  isValidElement,
  useId,
  type ReactElement,
  type ReactNode,
} from 'react'
import { Text } from './Text'

export type FieldSize = 'sm' | 'md'

export type FieldProps = {
  label?: ReactNode
  /** Optional 16px leading glyph in the label row (inspect density). */
  icon?: ReactNode
  hint?: ReactNode
  /** Validation message — sets invalid chrome + aria when present */
  error?: ReactNode
  /** Force invalid styling without an error message */
  invalid?: boolean
  size?: FieldSize
  /** `stack` (default) = label above; `inline` = label beside control */
  layout?: 'stack' | 'inline'
  /** Override auto id (also used for label htmlFor) */
  htmlFor?: string
  children: ReactNode
  className?: string
}

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

type ControlChildProps = {
  id?: string
  size?: FieldSize
  className?: string
  'aria-invalid'?: boolean | 'true' | 'false'
  'aria-describedby'?: string
}

/**
 * Labeled field shell — specs/domain/zaoly-ui-field.md · zaoly-ui-forms.md
 * Wires label ↔ control id; forwards size + a11y invalid/describedby.
 */
export function Field({
  label,
  icon,
  hint,
  error,
  invalid,
  size = 'sm',
  layout = 'stack',
  htmlFor,
  children,
  className,
}: FieldProps) {
  const autoId = useId()
  const id = htmlFor ?? autoId
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const showError = error != null && error !== false && error !== ''
  const isInvalid = Boolean(invalid) || showError
  const describedBy = [hint != null ? hintId : null, showError ? errorId : null]
    .filter(Boolean)
    .join(' ') || undefined

  const control = Children.map(children, (child) => {
    if (!isValidElement(child)) return child
    const el = child as ReactElement<ControlChildProps>
    return cloneElement(el, {
      id: el.props.id ?? id,
      size: el.props.size ?? size,
      'aria-invalid': isInvalid ? true : el.props['aria-invalid'],
      'aria-describedby':
        [el.props['aria-describedby'], describedBy].filter(Boolean).join(' ') || undefined,
      className: cx(el.props.className, isInvalid && 'ds-control--invalid'),
    })
  })

  return (
    <div
      className={cx(
        'ds-field',
        `ds-field--${size}`,
        layout === 'inline' && 'ds-field--inline',
        isInvalid && 'ds-field--invalid',
        className,
      )}
    >
      {label != null || icon != null ? (
        <label className="ds-field-label" htmlFor={id} suppressHydrationWarning>
          {icon != null ? (
            <span className="ds-field-icon" aria-hidden>
              {icon}
            </span>
          ) : null}
          {typeof label === 'string' || typeof label === 'number' ? (
            <Text role="label" as="span">
              {label}
            </Text>
          ) : (
            label
          )}
        </label>
      ) : null}
      {control}
      {hint != null ? (
        <div className="ds-field-hint" id={hintId}>
          {typeof hint === 'string' || typeof hint === 'number' ? (
            <Text role="hint" as="span">
              {hint}
            </Text>
          ) : (
            hint
          )}
        </div>
      ) : null}
      {showError ? (
        <div className="ds-field-error" id={errorId} role="alert">
          {typeof error === 'string' || typeof error === 'number' ? (
            <Text role="hint" as="span">
              {error}
            </Text>
          ) : (
            error
          )}
        </div>
      ) : null}
    </div>
  )
}
