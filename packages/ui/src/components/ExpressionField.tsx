'use client'

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { IconChevronDown } from './icons'
import { SCHEMA_TREE_PATH_MIME } from './SchemaTree'

export type ExpressionSuggestion = {
  value: string
  label: string
}

export type ExpressionFieldProps = {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  hint?: string
  disabled?: boolean
  className?: string
  onFocusField?: () => void
  /** Insert a path dragged from SchemaTree (defaults to `{{ path }}`). */
  onDropPath?: (path: string) => void
  /**
   * Optional flat pick list (chevron). Picking calls `onChange(option.value)`.
   * No typeahead / fuzzy search in v1.
   */
  suggestions?: ExpressionSuggestion[]
} & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'className' | 'value' | 'onChange' | 'disabled' | 'placeholder'
>

export type ExpressionSegment =
  | { type: 'text'; value: string }
  | { type: 'expression'; value: string; raw: string }

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Split value into literal text and complete `{{ … }}` expressions. */
export function isBarePathExpression(value: string): boolean {
  const t = value.trim()
  if (!t) return false
  if (/^\$\(\s*['"][^'"]+['"]\s*\)(?:\.json)?(?:[.[\]]|$)/.test(t)) return true
  if (/^\$json(?:[.[\]]|$)/.test(t)) return true
  if (/^(scan|domain|geo|journey|run)\./.test(t)) return true
  return false
}

/** Wrap a catalog / node path for runtime expression resolution. */
export function wrapExpressionValue(value: string): string {
  const t = value.trim()
  if (!t) return value
  if (/^\{\{[\s\S]*\}\}$/.test(t)) return t
  if (isBarePathExpression(t)) return `{{ ${t} }}`
  return value
}

function insertExpressionAtSelection(
  value: string,
  rawPath: string,
  selectionStart?: number | null,
  selectionEnd?: number | null
): string {
  const expr = wrapExpressionValue(rawPath)
  const start = selectionStart ?? value.length
  const end = selectionEnd ?? start
  return `${value.slice(0, start)}${expr}${value.slice(end)}`
}

export function parseExpressionSegments(value: string): ExpressionSegment[] {
  if (!value) return []
  const segments: ExpressionSegment[] = []
  const re = /\{\{\s*([\s\S]*?)\s*\}\}/g
  let last = 0
  let match: RegExpExecArray | null
  while ((match = re.exec(value)) !== null) {
    if (match.index > last) {
      segments.push({ type: 'text', value: value.slice(last, match.index) })
    }
    segments.push({
      type: 'expression',
      value: match[1]!.trim(),
      raw: match[0]!,
    })
    last = match.index + match[0]!.length
  }
  if (last < value.length) {
    segments.push({ type: 'text', value: value.slice(last) })
  }
  if (segments.some((s) => s.type === 'expression')) return segments
  if (isBarePathExpression(value)) {
    const t = value.trim()
    return [{ type: 'expression', value: t, raw: t }]
  }
  return segments
}

function ExpressionMirror({ value }: { value: string }) {
  const segments = useMemo(() => parseExpressionSegments(value), [value])
  const hasExpressions = segments.some((s) => s.type === 'expression')

  // Only chip-paint real expressions — plain text must not duplicate the input layer.
  if (!value || !hasExpressions) return null

  return (
    <div className="ds-expression-field-mirror" aria-hidden>
      {segments.map((seg, i) =>
        seg.type === 'expression' ? (
          <span key={`${seg.raw}-${i}`} className="ds-expression-chip">
            {seg.value || '…'}
          </span>
        ) : (
          <span key={`t-${i}`} className="ds-expression-field-mirror-text">
            {seg.value}
          </span>
        )
      )}
    </div>
  )
}

const MENU_MAX_H = 224

function suggestionOptionId(listId: string, index: number): string {
  return `${listId}-sug-${index}`
}

/**
 * Path / {{ expression }} parameter field with inline expression chips.
 * Spec: specs/domain/zaoly-ui-expression-field.md
 */
export function ExpressionField({
  label,
  value,
  onChange,
  placeholder = '{{ path }}',
  hint,
  disabled,
  className,
  onFocusField,
  onDropPath,
  suggestions,
  id,
  ...rest
}: ExpressionFieldProps) {
  const autoId = useId()
  const inputId = id ?? (label ? `expr-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined)
  const listId = `${inputId ?? autoId}-suggestions`
  const inputRef = useRef<HTMLInputElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const pickRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLUListElement | null>(null)
  const selectionRef = useRef<{ start: number; end: number } | null>(null)
  const [dropActive, setDropActive] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({})
  const [activeIndex, setActiveIndex] = useState(0)

  const suggestionList = suggestions ?? []
  const hasSuggestions = suggestionList.length > 0 && !disabled
  const selectedIndex = useMemo(
    () => suggestionList.findIndex((s) => s.value === value),
    [suggestionList, value]
  )

  const hasExpressions = useMemo(
    () => parseExpressionSegments(value).some((s) => s.type === 'expression'),
    [value]
  )

  /** Matched suggestion label — avoid double-painting input + mirror for plain paths. */
  const matchedSuggestionLabel =
    !hasExpressions && selectedIndex >= 0 ? suggestionList[selectedIndex]!.label : null

  const useChipOverlay = hasExpressions || Boolean(matchedSuggestionLabel)

  const closeMenu = useCallback(() => setMenuOpen(false), [])

  const pickSuggestion = useCallback(
    (next: string) => {
      onFocusField?.()
      onChange(next)
      setMenuOpen(false)
    },
    [onChange, onFocusField]
  )

  const updateMenuPosition = useCallback(() => {
    const anchor = wrapRef.current
    if (!anchor) return
    const rect = anchor.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const openAbove = spaceBelow < Math.min(MENU_MAX_H, 180) && spaceAbove > spaceBelow
    const width = Math.max(rect.width, 160)
    const left = Math.min(rect.left, Math.max(8, window.innerWidth - width - 8))
    if (openAbove) {
      setMenuStyle({
        position: 'fixed',
        left,
        width,
        bottom: window.innerHeight - rect.top + 4,
        top: 'auto',
        maxHeight: Math.min(MENU_MAX_H, Math.max(80, spaceAbove - 12)),
        zIndex: 1000,
      })
    } else {
      setMenuStyle({
        position: 'fixed',
        left,
        width,
        top: rect.bottom + 4,
        bottom: 'auto',
        maxHeight: Math.min(MENU_MAX_H, Math.max(80, spaceBelow - 12)),
        zIndex: 1000,
      })
    }
  }, [])

  const openMenu = useCallback(() => {
    if (!hasSuggestions) return
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
    setMenuOpen(true)
  }, [hasSuggestions, selectedIndex])

  useLayoutEffect(() => {
    if (!menuOpen) return
    updateMenuPosition()
  }, [menuOpen, updateMenuPosition, suggestionList.length])

  useEffect(() => {
    if (!menuOpen) return
    function onReposition() {
      updateMenuPosition()
    }
    window.addEventListener('resize', onReposition)
    window.addEventListener('scroll', onReposition, true)
    return () => {
      window.removeEventListener('resize', onReposition)
      window.removeEventListener('scroll', onReposition, true)
    }
  }, [menuOpen, updateMenuPosition])

  useEffect(() => {
    if (!menuOpen) return
    function onDocPointer(e: MouseEvent) {
      const t = e.target as Node
      if (wrapRef.current?.contains(t)) return
      if (menuRef.current?.contains(t)) return
      closeMenu()
    }
    document.addEventListener('mousedown', onDocPointer)
    return () => document.removeEventListener('mousedown', onDocPointer)
  }, [menuOpen, closeMenu])

  useEffect(() => {
    if (!menuOpen) return
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeMenu()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen, closeMenu])

  useEffect(() => () => setMenuOpen(false), [])

  function moveActive(delta: number) {
    if (!suggestionList.length) return
    setActiveIndex((prev) => (prev + delta + suggestionList.length) % suggestionList.length)
  }

  function onPickKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (!hasSuggestions) return
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (!menuOpen) openMenu()
        else moveActive(1)
        break
      case 'ArrowUp':
        e.preventDefault()
        if (!menuOpen) openMenu()
        else moveActive(-1)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (!menuOpen) openMenu()
        else {
          const opt = suggestionList[activeIndex]
          if (opt) pickSuggestion(opt.value)
        }
        break
      case 'Escape':
        if (menuOpen) {
          e.preventDefault()
          closeMenu()
        }
        break
      default:
        break
    }
  }

  const readDroppedPath = (event: DragEvent): string | null => {
    const path =
      event.dataTransfer.getData(SCHEMA_TREE_PATH_MIME) ||
      event.dataTransfer.getData('text/plain')
    return path.trim() || null
  }

  const acceptsPathDrop = (event: DragEvent): boolean => {
    if (disabled) return false
    const types = Array.from(event.dataTransfer.types)
    return types.includes(SCHEMA_TREE_PATH_MIME) || types.includes('text/plain')
  }

  const handleDragOver = (event: DragEvent) => {
    if (!acceptsPathDrop(event)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    setDropActive(true)
  }

  const handleDragLeave = () => {
    setDropActive(false)
  }

  const rememberSelection = () => {
    const el = inputRef.current
    if (!el) return
    selectionRef.current = {
      start: el.selectionStart ?? el.value.length,
      end: el.selectionEnd ?? el.selectionStart ?? el.value.length,
    }
  }

  const handleDrop = (event: DragEvent) => {
    if (!acceptsPathDrop(event)) return
    event.preventDefault()
    setDropActive(false)
    const path = readDroppedPath(event)
    if (!path) return
    onFocusField?.()
    if (onDropPath) {
      onDropPath(path)
      return
    }
    const saved = selectionRef.current
    const next = insertExpressionAtSelection(
      value,
      path,
      inputRef.current?.selectionStart ?? saved?.start,
      inputRef.current?.selectionEnd ?? saved?.end
    )
    onChange(next)
  }

  const activeDesc =
    menuOpen && suggestionList[activeIndex]
      ? suggestionOptionId(listId, activeIndex)
      : undefined

  const menu =
    menuOpen && typeof document !== 'undefined'
      ? createPortal(
          <ul
            ref={menuRef}
            id={listId}
            className="ds-select-menu ds-select-menu--portal"
            role="listbox"
            tabIndex={-1}
            style={menuStyle}
            data-testid="expression-field-suggestions"
          >
            {suggestionList.map((opt, i) => {
              const selectedOpt = opt.value === value
              const active = i === activeIndex
              return (
                <li
                  key={opt.value}
                  id={suggestionOptionId(listId, i)}
                  role="option"
                  aria-selected={selectedOpt}
                  className={cx(
                    'ds-select-option',
                    selectedOpt && 'ds-select-option--selected',
                    active && 'ds-select-option--active'
                  )}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseDown={(e) => {
                    e.preventDefault()
                  }}
                  onClick={() => pickSuggestion(opt.value)}
                >
                  {opt.label}
                </li>
              )
            })}
          </ul>,
          document.body
        )
      : null

  return (
    <div className={cx('ds-expression-field', className)}>
      {label ? (
        <label className="ds-expression-field-label" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <div
        ref={wrapRef}
        className={cx(
          'ds-expression-field-input-wrap',
          useChipOverlay && 'ds-expression-field-input-wrap--has-expr',
          dropActive && 'ds-expression-field-input-wrap--drop-target',
          hasSuggestions && 'ds-expression-field-input-wrap--has-suggestions'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {hasExpressions ? <ExpressionMirror value={value} /> : null}
        {matchedSuggestionLabel ? (
          <div className="ds-expression-field-mirror" aria-hidden>
            <span className="ds-expression-field-mirror-text">{matchedSuggestionLabel}</span>
          </div>
        ) : null}
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          className={cx(
            'ds-expression-field-input',
            useChipOverlay && 'ds-expression-field-input--chip-overlay',
            hasSuggestions && 'ds-expression-field-input--with-pick'
          )}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          spellCheck={false}
          autoComplete="off"
          onChange={(e) => onChange(e.target.value)}
          onClick={() => rememberSelection()}
          onMouseUp={() => rememberSelection()}
          onKeyUp={() => rememberSelection()}
          onSelect={() => rememberSelection()}
          {...rest}
          onFocus={(e) => {
            rest.onFocus?.(e)
            rememberSelection()
            onFocusField?.()
          }}
          onBlur={(e) => {
            rest.onBlur?.(e)
            if (isBarePathExpression(value)) {
              onChange(wrapExpressionValue(value))
            }
          }}
        />
        {hasSuggestions ? (
          <button
            ref={pickRef}
            type="button"
            className="ds-expression-field-pick"
            aria-label="Pick suggestion"
            aria-haspopup="listbox"
            aria-expanded={menuOpen}
            aria-controls={menuOpen ? listId : undefined}
            aria-activedescendant={activeDesc}
            data-testid="expression-field-pick"
            disabled={disabled}
            onClick={() => {
              if (menuOpen) closeMenu()
              else openMenu()
            }}
            onKeyDown={onPickKeyDown}
          >
            <IconChevronDown size={16} aria-hidden />
          </button>
        ) : null}
      </div>
      {menu}
      {hint ? <p className="ds-expression-field-hint">{hint}</p> : null}
    </div>
  )
}
