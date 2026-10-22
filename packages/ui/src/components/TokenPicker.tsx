'use client'

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

import { ColorPicker } from './ColorPicker'
import { normalizeHex, parseHex, rgbaCss } from './color-utils'
import { TokenPreview, type TokenPreviewKind } from './TokenPreview'

export type TokenPickerOption = {
  path: string
  label?: string
  /**
   * Resolved display value for browser/list columns (e.g. `0.5rem`, `Geist`).
   * When set, the strip shows `valueLabel · label` (or path).
   */
  valueLabel?: string
  /** Display-only CSS color / length for swatch or TokenPreview; not written as the value. */
  preview?: string
  /** Display-only font-family for the value label (type tokens). */
  fontPreview?: string
  /** Display-only CSS on the value label (size / weight samples). */
  sampleStyle?: {
    fontFamily?: string
    fontSize?: string
    fontWeight?: string
    lineHeight?: string
    letterSpacing?: string
  }
  /** Category for browser scope filtering (e.g. color, space, radius). */
  category?: string
}

function normalizeLiteralCompare(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, '')
}

/** True when a free literal equals an option's display / sample fields. */
export function optionMatchesLiteral(
  opt: TokenPickerOption,
  literal: string,
  previewKind: TokenPreviewKind = 'auto',
): boolean {
  const raw = literal.trim()
  if (!raw) return false
  const hex =
    previewKind === 'color' || previewKind === 'auto' ? normalizeHex(raw) : ''
  const norm = normalizeLiteralCompare(raw)
  if (hex && opt.preview) {
    const optHex = normalizeHex(opt.preview)
    if (optHex && optHex === hex) return true
  }
  if (opt.preview && normalizeLiteralCompare(opt.preview) === norm) return true
  if (opt.valueLabel && normalizeLiteralCompare(opt.valueLabel) === norm) return true
  if (opt.fontPreview && normalizeLiteralCompare(opt.fontPreview) === norm) return true
  // Font rows: role label (e.g. Body) only when this option is a type sample.
  if (opt.fontPreview && opt.label && normalizeLiteralCompare(opt.label) === norm) return true
  return false
}

/**
 * Find a catalog option whose resolved preview / valueLabel / font sample equals a free literal.
 * Colors compare via normalizeHex; other kinds via trimmed case-insensitive equality.
 */
export function matchLiteralToTokenOption(
  options: TokenPickerOption[],
  literal: string,
  previewKind: TokenPreviewKind = 'auto',
): TokenPickerOption | undefined {
  const raw = literal.trim()
  if (!raw) return undefined
  // Prefer synthetic literal paths (gf: / sz: / wt:) over Brandion roles with the same sample.
  const synthetic = options.find(
    (opt) =>
      (opt.path.startsWith('gf:') ||
        opt.path.startsWith('sz:') ||
        opt.path.startsWith('wt:')) &&
      optionMatchesLiteral(opt, raw, previewKind),
  )
  if (synthetic) return synthetic
  for (const opt of options) {
    if (optionMatchesLiteral(opt, raw, previewKind)) return opt
  }
  return undefined
}

function optionStripLabel(opt: TokenPickerOption): string {
  const name = opt.label ?? opt.path
  if (opt.valueLabel) return `${opt.valueLabel} · ${name}`
  return name
}

type OptionRowLayout = 'columns' | 'swatch' | 'lead'

function optionRowLayout(
  opt: TokenPickerOption,
  previewKind: TokenPreviewKind,
): OptionRowLayout {
  if (previewKind === 'type' || opt.fontPreview || opt.sampleStyle) return 'lead'
  if (opt.valueLabel) return 'columns'
  return 'swatch'
}

function OptionRowContent({
  opt,
  previewKind,
  layout,
}: {
  opt: TokenPickerOption
  previewKind: TokenPreviewKind
  layout: OptionRowLayout
}) {
  const name = opt.label ?? opt.path
  const preview =
    opt.preview != null && opt.preview !== '' ? (
      <TokenPreview kind={previewKind} value={opt.preview} size="sm" />
    ) : null

  if (layout === 'lead') {
    return (
      <>
        <span
          className={cx(
            'ds-token-picker__path',
            'ds-token-picker__path--lead',
            (opt.fontPreview || opt.sampleStyle) && 'ds-token-picker__path--font',
          )}
          style={optionTextStyle(opt)}
        >
          {name}
        </span>
        {opt.valueLabel ? (
          <span className="ds-token-picker__value">{opt.valueLabel}</span>
        ) : null}
      </>
    )
  }

  if (layout === 'swatch') {
    return (
      <>
        <span className="ds-token-picker__preview-slot" aria-hidden>
          {preview}
        </span>
        <span
          className={cx(
            'ds-token-picker__path',
            (opt.fontPreview || opt.sampleStyle) && 'ds-token-picker__path--font',
          )}
          style={optionTextStyle(opt)}
        >
          {name}
        </span>
      </>
    )
  }

  return (
    <>
      <span className="ds-token-picker__preview-slot" aria-hidden>
        {preview}
      </span>
      <span className="ds-token-picker__value">{opt.valueLabel ?? ''}</span>
      <span
        className={cx(
          'ds-token-picker__path',
          (opt.fontPreview || opt.sampleStyle) && 'ds-token-picker__path--font',
        )}
        style={optionTextStyle(opt)}
      >
        {name}
      </span>
    </>
  )
}

export type TokenPickerVariant = 'compact' | 'list'

export type TokenPickerScope = {
  id: string
  label: string
}

export type TokenPickerProps = {
  className?: string
  options: TokenPickerOption[]
  value?: string | null
  onChange?: (path: string) => void
  /** Clear binding affordance — apps map to clear_token_binding (not onChange('')). */
  onClear?: () => void
  clearLabel?: string
  /** Include a none/empty option that invokes onClear. */
  allowNone?: boolean
  /** Listbox none option only — never the empty strip. */
  noneLabel?: string
  /** Current-strip placeholder when unbound (default em dash). */
  emptyLabel?: string
  /** Show −/+ on the current strip to cycle prev/next through cycle options. */
  allowCycle?: boolean
  prevLabel?: string
  nextLabel?: string
  label?: string
  /** Optional 16px glyph beside the label. */
  icon?: ReactNode
  /**
   * `compact` (default): Penpot strip; option list is a popover.
   * `list`: always-open dense list (Storybook / debug).
   */
  variant?: TokenPickerVariant
  /**
   * When true with `compact`: portal multi-context browser
   * (search, scopes, Recent, drag header, keyboard, rich previews).
   */
  browser?: boolean
  scopes?: TokenPickerScope[]
  scope?: string
  onScopeChange?: (scopeId: string) => void
  suggestedPaths?: string[]
  recentPaths?: string[]
  onRecentPathsChange?: (paths: string[]) => void
  contextTitle?: string
  previewKind?: TokenPreviewKind
  searchPlaceholder?: string
  'aria-label'?: string
  /**
   * When true: Penpot-style hybrid strip — editable literal input plus token browser.
   * Typing calls `onLiteralChange`; picking still calls `onChange(path)`.
   */
  allowLiteral?: boolean
  /** App-owned freeform value when no token `value` is bound. */
  literalValue?: string
  onLiteralChange?: (raw: string) => void
  /** Placeholder for the literal input (defaults to `emptyLabel`). */
  literalPlaceholder?: string
  /** Read-only literal (e.g. mixed multi-select). */
  literalReadOnly?: boolean
  /** Optional `data-testid` on the literal input. */
  literalTestId?: string
  /**
   * When set with `allowLiteral`: show a promote (+) control while a free literal is set
   * and no token path is bound. App owns create/bind flow (dialog).
   */
  onPromoteLiteral?: () => void
  /** Accessible name for the promote control (defaults to “Save as token”). */
  promoteLiteralLabel?: string
  /** Leading list/browser promote row label (default “Add your own token”). */
  listPromoteLabel?: string
  /**
   * Sticky “Current …” row above the option list (default true).
   * Set false when the host already shows the active value (e.g. HUD menu head).
   */
  showActiveHeader?: boolean
  /** When true with `compact` + `browser`, open the browser on mount. */
  defaultOpen?: boolean
  /**
   * When the search query is empty, cap how many options render (large catalogs).
   * Searching shows the full filtered set.
   */
  emptyQueryCap?: number
  /**
   * Portal mount for browser mode (default: nearest `<dialog>` ancestor, else `document.body`).
   * Keeps the browser in the modal top layer when used inside `Dialog`.
   */
  browserPortalTarget?: HTMLElement | null
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children' | 'onChange'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

function optionTextStyle(opt: TokenPickerOption): {
  fontFamily?: string
  fontSize?: string
  fontWeight?: string
  lineHeight?: string
  letterSpacing?: string
} | undefined {
  if (!opt.fontPreview && !opt.sampleStyle) return undefined
  return {
    ...(opt.fontPreview ? { fontFamily: opt.fontPreview } : {}),
    ...opt.sampleStyle,
  }
}

function cycleIndex(value: string | null, options: TokenPickerOption[]): number {
  if (!value) return -1
  return options.findIndex((opt) => opt.path === value)
}

/** Browser panels must mount inside modal `<dialog>` to stay above `showModal()` top layer. */
export function resolveBrowserPortalTarget(
  root: HTMLElement | null,
  explicit?: HTMLElement | null,
): HTMLElement {
  if (typeof document === 'undefined') {
    return null as unknown as HTMLElement
  }
  if (explicit) return explicit
  let el: HTMLElement | null = root
  while (el) {
    if (el instanceof HTMLDialogElement) return el
    el = el.parentElement
  }
  return document.body
}

const PANEL_W_DEFAULT = 300
const PANEL_H_DEFAULT = 380
const PANEL_W_COLOR = 560
const PANEL_H_COLOR = 420
const PANEL_W_MIN = 240
const PANEL_H_MIN = 200
const PANEL_W_MAX = 960
const PANEL_H_MAX = 800
const RECENT_MAX = 8

type BrowserResizeEdge = 'e' | 's' | 'se'

function clampPanelSize(w: number, h: number, left: number, top: number) {
  const maxW = Math.min(PANEL_W_MAX, Math.max(PANEL_W_MIN, window.innerWidth - left - 8))
  const maxH = Math.min(PANEL_H_MAX, Math.max(PANEL_H_MIN, window.innerHeight - top - 8))
  return {
    w: Math.max(PANEL_W_MIN, Math.min(maxW, w)),
    h: Math.max(PANEL_H_MIN, Math.min(maxH, h)),
  }
}

/** Interactive token path picker — paths by default; optional hybrid literal strip. */
export function TokenPicker({
  className,
  options,
  value = null,
  onChange,
  onClear,
  clearLabel = 'Clear',
  allowNone = false,
  noneLabel = 'None',
  emptyLabel = '—',
  allowCycle = false,
  prevLabel = 'Previous token',
  nextLabel = 'Next token',
  label = 'Token',
  icon,
  variant = 'compact',
  browser = false,
  scopes,
  scope: scopeProp,
  onScopeChange,
  suggestedPaths,
  recentPaths = [],
  onRecentPathsChange,
  contextTitle,
  previewKind = 'auto',
  searchPlaceholder = 'Search tokens…',
  'aria-label': ariaLabel = 'Token picker',
  allowLiteral = false,
  literalValue = '',
  onLiteralChange,
  literalPlaceholder,
  literalReadOnly = false,
  literalTestId,
  onPromoteLiteral,
  promoteLiteralLabel = 'Save as token',
  listPromoteLabel = 'Add your own token',
  showActiveHeader = true,
  defaultOpen = false,
  emptyQueryCap,
  browserPortalTarget,
  ...rest
}: TokenPickerProps) {
  const listId = useId()
  const selectedOption = value ? options.find((opt) => opt.path === value) : undefined
  const displayText = selectedOption
    ? optionStripLabel(selectedOption)
    : (value ?? emptyLabel)
  const literalPlaceholderText = literalPlaceholder ?? emptyLabel
  const showPromote = Boolean(
    allowLiteral && onPromoteLiteral && !literalReadOnly && !value && String(literalValue).trim(),
  )
  const activeDisplay = value
    ? displayText
    : String(literalValue).trim()
      ? String(literalValue).trim()
      : emptyLabel
  const colorEditor = Boolean(allowLiteral && previewKind === 'color')
  const colorFillCss = (() => {
    if (!colorEditor) return ''
    if (value && selectedOption?.preview) {
      const parsed = parseHex(selectedOption.preview)
      if (parsed) return rgbaCss(parsed)
      return selectedOption.preview
    }
    const lit = parseHex(literalValue)
    return lit ? rgbaCss(lit) : ''
  })()
  const colorValueHex =
    (value && selectedOption?.preview && normalizeHex(selectedOption.preview)) ||
    normalizeHex(literalValue) ||
    '#000000'
  const stripInputValue = value
    ? selectedOption
      ? optionStripLabel(selectedOption)
      : value
    : literalValue
  const [literalDraft, setLiteralDraft] = useState<string | null>(null)
  const displayedStripValue = literalDraft != null ? literalDraft : stripInputValue
  const valueStyle = selectedOption
    ? {
        ...(selectedOption.fontPreview ? { fontFamily: selectedOption.fontPreview } : {}),
        ...selectedOption.sampleStyle,
      }
    : undefined
  const fontPreview = Boolean(selectedOption?.fontPreview || selectedOption?.sampleStyle)
  const showClear = Boolean(onClear && (value || (allowLiteral && literalValue)))
  const compact = variant === 'compact'
  const useBrowser = compact && browser
  const [open, setOpen] = useState(() => Boolean(defaultOpen && compact && browser))
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [scopeInternal, setScopeInternal] = useState(scopes?.[0]?.id ?? 'suggested')
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 })
  const [panelSize, setPanelSize] = useState({
    w: colorEditor ? PANEL_W_COLOR : PANEL_W_DEFAULT,
    h: colorEditor ? PANEL_H_COLOR : PANEL_H_DEFAULT,
  })
  const colorTriggerRef = useRef<HTMLButtonElement>(null)
  const [standaloneColorOpen, setStandaloneColorOpen] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [resizing, setResizing] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const resizeSession = useRef<{
    edge: BrowserResizeEdge
    startX: number
    startY: number
    startW: number
    startH: number
  } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  /** Skip strip blur-commit while an option pick is in flight (mousedown→click / unmount). */
  const pickingRef = useRef(false)

  const isOptionSelected = useCallback(
    (opt: TokenPickerOption) => {
      if (value === opt.path) return true
      // Unbound literal that matches a sample (e.g. Google `gf:` face) stays highlighted.
      if (!value && allowLiteral && optionMatchesLiteral(opt, literalValue, previewKind)) {
        return true
      }
      return false
    },
    [value, allowLiteral, literalValue, previewKind],
  )

  const activeScope = scopeProp ?? scopeInternal

  const setScope = useCallback(
    (id: string) => {
      onScopeChange?.(id)
      if (scopeProp === undefined) setScopeInternal(id)
    },
    [onScopeChange, scopeProp],
  )

  const cycleOptions = useMemo(() => {
    if (suggestedPaths?.length) {
      const ordered = suggestedPaths
        .map((p) => options.find((o) => o.path === p))
        .filter((o): o is TokenPickerOption => Boolean(o))
      return ordered.length ? ordered : options
    }
    return options
  }, [options, suggestedPaths])

  const index = cycleIndex(value, cycleOptions)

  const scopedOptions = useMemo(() => {
    if (!useBrowser || !scopes?.length) return options
    if (activeScope === 'all') return options
    if (activeScope === 'suggested') {
      if (suggestedPaths?.length) {
        const set = new Set(suggestedPaths)
        return options.filter((o) => set.has(o.path))
      }
      return options
    }
    const scopeMeta = scopes.find((s) => s.id === activeScope)
    const key = activeScope.toLowerCase()
    const labelKey = (scopeMeta?.label ?? '').toLowerCase()
    return options.filter((o) => {
      const cat = (o.category ?? '').toLowerCase()
      return cat === key || cat === labelKey
    })
  }, [useBrowser, scopes, activeScope, suggestedPaths, options])

  const filtered = useMemo(() => {
    const base = useBrowser ? scopedOptions : options
    const q = query.trim().toLowerCase()
    if (!q) return base
    return base.filter(
      (o) =>
        o.path.toLowerCase().includes(q) ||
        (o.label ?? '').toLowerCase().includes(q) ||
        (o.valueLabel ?? '').toLowerCase().includes(q) ||
        (o.category ?? '').toLowerCase().includes(q),
    )
  }, [useBrowser, scopedOptions, options, query])

  const visibleOptions = useMemo(() => {
    if (!emptyQueryCap || query.trim()) return filtered
    if (filtered.length <= emptyQueryCap) return filtered
    return filtered.slice(0, emptyQueryCap)
  }, [emptyQueryCap, filtered, query])

  const listTruncated = Boolean(
    emptyQueryCap && !query.trim() && filtered.length > emptyQueryCap,
  )

  const pushRecent = useCallback(
    (path: string) => {
      if (!onRecentPathsChange) return
      const next = [path, ...recentPaths.filter((p) => p !== path)].slice(0, RECENT_MAX)
      onRecentPathsChange(next)
    },
    [onRecentPathsChange, recentPaths],
  )

  const panelSizeRef = useRef(panelSize)
  panelSizeRef.current = panelSize
  const panelPosRef = useRef(panelPos)
  panelPosRef.current = panelPos

  const placePanel = useCallback(() => {
    const el = triggerRef.current
    if (!el || typeof window === 'undefined') return
    const r = el.getBoundingClientRect()
    const { w, h } = panelSizeRef.current
    let left = r.left
    let top = r.bottom + 6
    if (left + w > window.innerWidth - 8) left = Math.max(8, window.innerWidth - w - 8)
    if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 6)
    setPanelPos({ top, left })
  }, [])

  const toggleOpen = useCallback(() => {
    if (!compact) return
    setOpen((next) => {
      const opening = !next
      if (opening && useBrowser) placePanel()
      return opening
    })
  }, [compact, useBrowser, placePanel])

  useEffect(() => {
    if (!compact || !open) return
    const onDoc = (event: MouseEvent) => {
      const t = event.target as Node
      if (rootRef.current?.contains(t)) return
      if (panelRef.current?.contains(t)) return
      setOpen(false)
      setQuery('')
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [compact, open])

  useEffect(() => {
    if (!open || !useBrowser) return
    placePanel()
    const t = window.setTimeout(() => searchRef.current?.focus(), 0)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setQuery('')
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(t)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, useBrowser, placePanel])

  useEffect(() => {
    setActiveIndex(0)
  }, [query, activeScope, open])

  useEffect(() => {
    if (!dragging || !useBrowser) return
    const onMove = (e: MouseEvent) => {
      const maxL = window.innerWidth - panelSize.w - 8
      const maxT = window.innerHeight - panelSize.h - 8
      setPanelPos({
        left: Math.max(8, Math.min(maxL, e.clientX - dragOffset.current.x)),
        top: Math.max(8, Math.min(maxT, e.clientY - dragOffset.current.y)),
      })
    }
    const onUp = () => setDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragging, useBrowser, panelSize.w, panelSize.h])

  useEffect(() => {
    if (!resizing || !useBrowser) return
    const onMove = (e: MouseEvent) => {
      const session = resizeSession.current
      if (!session) return
      const dw = e.clientX - session.startX
      const dh = e.clientY - session.startY
      let nextW = session.startW
      let nextH = session.startH
      if (session.edge === 'e' || session.edge === 'se') nextW = session.startW + dw
      if (session.edge === 's' || session.edge === 'se') nextH = session.startH + dh
      setPanelSize(
        clampPanelSize(nextW, nextH, panelPosRef.current.left, panelPosRef.current.top),
      )
    }
    const onUp = () => {
      resizeSession.current = null
      setResizing(false)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [resizing, useBrowser])

  const onHeaderDown = (e: ReactMouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    if ((e.target as HTMLElement).closest('[data-resize-edge]')) return
    e.preventDefault()
    dragOffset.current = { x: e.clientX - panelPos.left, y: e.clientY - panelPos.top }
    setDragging(true)
  }

  const onResizeDown = (edge: BrowserResizeEdge) => (e: ReactMouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    resizeSession.current = {
      edge,
      startX: e.clientX,
      startY: e.clientY,
      startW: panelSize.w,
      startH: panelSize.h,
    }
    setResizing(true)
  }

  const step = (direction: -1 | 1) => {
    if (cycleOptions.length === 0) return
    if (direction === 1) {
      if (index < 0) {
        onChange?.(cycleOptions[0]!.path)
        return
      }
      if (index >= cycleOptions.length - 1) {
        if (allowNone) onClear?.()
        return
      }
      onChange?.(cycleOptions[index + 1]!.path)
      return
    }
    if (index < 0) {
      onChange?.(cycleOptions[cycleOptions.length - 1]!.path)
      return
    }
    if (index === 0) {
      if (allowNone) onClear?.()
      return
    }
    onChange?.(cycleOptions[index - 1]!.path)
  }

  const pick = (path: string | null) => {
    pickingRef.current = true
    if (path == null) onClear?.()
    else {
      onChange?.(path)
      pushRecent(path)
    }
    if (compact) {
      setOpen(false)
      setQuery('')
    }
    // After React commit/unmount blur — queueMicrotask is too early and lets blur overwrite the pick.
    window.setTimeout(() => {
      pickingRef.current = false
    }, 0)
  }

  const onOptionMouseDown = (e: ReactMouseEvent) => {
    // Keep strip input from blurring before click — blur would recommit the old value.
    e.preventDefault()
  }

  const commitLiteral = useCallback(
    (raw: string) => {
      const matched = matchLiteralToTokenOption(options, raw, previewKind)
      if (matched) {
        onChange?.(matched.path)
        pushRecent(matched.path)
        if (compact) {
          setOpen(false)
          setQuery('')
        }
        return
      }
      onLiteralChange?.(raw)
    },
    [options, previewKind, onChange, onLiteralChange, pushRecent, compact],
  )

  const onListKeyDown = (e: ReactKeyboardEvent) => {
    if (!visibleOptions.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      e.stopPropagation()
      setActiveIndex((i) => Math.min(visibleOptions.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      e.stopPropagation()
      setActiveIndex((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      const opt = visibleOptions[activeIndex]
      if (opt) pick(opt.path)
    }
  }

  const stripPreview =
    selectedOption?.preview &&
    (previewKind === 'color' ||
      previewKind === 'auto' ||
      previewKind === 'space' ||
      previewKind === 'radius' ||
      previewKind === 'opacity' ||
      previewKind === 'size' ||
      previewKind === 'shadow' ||
      previewKind === 'type')

  const activeHeader = showActiveHeader ? (
    <div className="ds-token-picker__active" data-testid="token-picker-active">
      <span className="ds-token-picker__active-label">Current</span>
      <span className="ds-token-picker__active-value">{activeDisplay}</span>
      {showPromote ? (
        <button
          type="button"
          className="ds-token-picker__promote ds-token-picker__promote--inline"
          aria-label={promoteLiteralLabel}
          title={promoteLiteralLabel}
          data-testid="token-picker-active-promote"
          onClick={() => onPromoteLiteral?.()}
        >
          +
        </button>
      ) : null}
    </div>
  ) : null

  const listPromoteRow = showPromote ? (
    <button
      type="button"
      role="option"
      aria-selected={false}
      className="ds-token-picker__option ds-token-picker__option--promote"
      data-testid="token-picker-list-promote"
      onClick={() => onPromoteLiteral?.()}
    >
      <span className="ds-token-picker__promote-glyph" aria-hidden>
        +
      </span>
      <span className="ds-token-picker__path">{listPromoteLabel}</span>
    </button>
  ) : null

  const flatList = (
    <ul
      className="ds-token-picker__list"
      role="listbox"
      aria-label={ariaLabel}
      hidden={compact && !open}
    >
      {(open || !compact) && activeHeader ? <li className="ds-token-picker__active-wrap">{activeHeader}</li> : null}
      {listPromoteRow ? <li>{listPromoteRow}</li> : null}
      {allowNone ? (
        <li>
          <button
            type="button"
            role="option"
            aria-selected={!value && !String(literalValue).trim()}
            className={cx(
              'ds-token-picker__option',
              !value && !String(literalValue).trim() && 'ds-token-picker__option--selected',
            )}
            onMouseDown={onOptionMouseDown}
            onClick={() => pick(null)}
          >
            <span className="ds-token-picker__swatch ds-token-picker__swatch--empty" aria-hidden />
            <span className="ds-token-picker__path">{noneLabel}</span>
          </button>
        </li>
      ) : null}
      {options.map((opt) => {
        const selected = isOptionSelected(opt)
        return (
          <li key={opt.path}>
            <button
              type="button"
              role="option"
              aria-selected={selected}
              className={cx(
                'ds-token-picker__option',
                selected && 'ds-token-picker__option--selected',
              )}
              onMouseDown={onOptionMouseDown}
              onClick={() => pick(opt.path)}
            >
              {opt.preview ? (
                <span
                  className="ds-token-picker__swatch"
                  style={{ background: opt.preview }}
                  aria-hidden
                />
              ) : null}
              <span
                className={cx(
                  'ds-token-picker__path',
                  (opt.fontPreview || opt.sampleStyle) && 'ds-token-picker__path--font',
                )}
                style={optionTextStyle(opt)}
              >
                {optionStripLabel(opt)}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )

  const browserTokens = (
    <>
      <div className="ds-token-picker__browser-search">
        <input
          ref={searchRef}
          type="search"
          className="ds-token-picker__search"
          placeholder={searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onListKeyDown}
          aria-label="Search tokens"
          data-testid="token-picker-search"
        />
      </div>
      {scopes && scopes.length > 0 ? (
        <div className="ds-token-picker__scopes" role="tablist" aria-label="Token scopes">
          {scopes.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={activeScope === s.id}
              className={cx(
                'ds-token-picker__scope',
                activeScope === s.id && 'ds-token-picker__scope--active',
              )}
              onClick={() => setScope(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      ) : null}
      {recentPaths.length > 0 && !query ? (
        <div className="ds-token-picker__recent">
          <span className="ds-token-picker__recent-label">Recent</span>
          <div className="ds-token-picker__recent-chips">
            {recentPaths.map((p) => {
              const opt = options.find((o) => o.path === p)
              if (!opt) return null
              return (
                <button
                  key={p}
                  type="button"
                  className="ds-token-picker__recent-chip"
                  onMouseDown={onOptionMouseDown}
                  onClick={() => pick(p)}
                >
                  {opt.preview && previewKind === 'color' ? (
                    <TokenPreview kind="color" value={opt.preview} size="sm" />
                  ) : null}
                  <span>{opt.label ?? opt.path}</span>
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
      <div
        id={listId}
        className="ds-token-picker__browser-body"
        role="listbox"
        aria-label={ariaLabel}
      >
        {activeHeader}
        {listPromoteRow}
        {filtered.length === 0 ? (
          <p className="ds-token-picker__empty-msg">No matching tokens</p>
        ) : (
          visibleOptions.map((opt, i) => {
            const selected = isOptionSelected(opt)
            const highlight = i === activeIndex
            const layout = optionRowLayout(opt, previewKind)
            return (
              <button
                key={opt.path}
                type="button"
                role="option"
                aria-selected={selected}
                aria-label={optionStripLabel(opt)}
                className={cx(
                  'ds-token-picker__option',
                  layout === 'columns' && 'ds-token-picker__option--columns',
                  layout === 'swatch' && 'ds-token-picker__option--swatch',
                  layout === 'lead' && 'ds-token-picker__option--lead',
                  selected && 'ds-token-picker__option--selected',
                  highlight && 'ds-token-picker__option--highlight',
                )}
                onMouseDown={onOptionMouseDown}
                onClick={() => pick(opt.path)}
                onMouseEnter={() => setActiveIndex(i)}
              >
                <OptionRowContent opt={opt} previewKind={previewKind} layout={layout} />
              </button>
            )
          })
        )}
        {listTruncated ? (
          <p className="ds-token-picker__empty-msg" data-testid="token-picker-list-cap">
            Type to search all {filtered.length} options
          </p>
        ) : null}
      </div>
      {allowNone && onClear ? (
        <div className="ds-token-picker__browser-footer">
          <button
            type="button"
            role="option"
            aria-selected={!value && !String(literalValue).trim()}
            className={cx(
              'ds-token-picker__option',
              !value && !String(literalValue).trim() && 'ds-token-picker__option--selected',
            )}
            onMouseDown={onOptionMouseDown}
            onClick={() => pick(null)}
          >
            <span className="ds-token-picker__swatch ds-token-picker__swatch--empty" aria-hidden />
            <span className="ds-token-picker__path">{noneLabel}</span>
          </button>
        </div>
      ) : null}
    </>
  )

  const browserPanel =
    useBrowser && open && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={panelRef}
            className={cx(
              'ds-token-picker__browser',
              colorEditor && 'ds-token-picker__browser--with-color',
              dragging && 'ds-token-picker__browser--dragging',
              resizing && 'ds-token-picker__browser--resizing',
            )}
            style={{
              top: panelPos.top,
              left: panelPos.left,
              width: panelSize.w,
              height: panelSize.h,
              minHeight: panelSize.h,
            }}
            role="dialog"
            aria-label={colorEditor ? `${label} color and tokens` : `${label} token browser`}
            data-testid="token-picker-browser"
          >
            <div
              className="ds-token-picker__browser-header"
              onMouseDown={onHeaderDown}
              data-testid="token-picker-drag-header"
            >
              <div className="ds-token-picker__browser-title">
                <strong>{label}</strong>
                {contextTitle ? (
                  <span className="ds-token-picker__browser-context">{contextTitle}</span>
                ) : null}
              </div>
              <button
                type="button"
                className="ds-token-picker__browser-close"
                aria-label="Close"
                onClick={() => {
                  setOpen(false)
                  setQuery('')
                }}
              >
                ×
              </button>
            </div>
            {colorEditor ? (
              <div className="ds-token-picker__browser-main">
                <aside className="ds-token-picker__browser-color" aria-label={`${label} color`}>
                  <ColorPicker
                    value={colorValueHex}
                    embedded
                    showTrigger={false}
                    aria-label={`${label} color`}
                    onChange={(hex) => commitLiteral(hex)}
                  />
                </aside>
                <div className="ds-token-picker__browser-tokens">{browserTokens}</div>
              </div>
            ) : (
              browserTokens
            )}
            <div
              className="ds-token-picker__browser-resize ds-token-picker__browser-resize--e"
              data-resize-edge="e"
              data-testid="token-picker-resize-e"
              onMouseDown={onResizeDown('e')}
              aria-hidden
            />
            <div
              className="ds-token-picker__browser-resize ds-token-picker__browser-resize--s"
              data-resize-edge="s"
              data-testid="token-picker-resize-s"
              onMouseDown={onResizeDown('s')}
              aria-hidden
            />
            <div
              className="ds-token-picker__browser-resize ds-token-picker__browser-resize--se"
              data-resize-edge="se"
              data-testid="token-picker-resize-se"
              onMouseDown={onResizeDown('se')}
              aria-hidden
            />
          </div>,
          resolveBrowserPortalTarget(rootRef.current, browserPortalTarget),
        )
      : null

  return (
    <div
      ref={rootRef}
        className={cx(
          'ds-token-picker',
          compact ? 'ds-token-picker--compact' : 'ds-token-picker--list',
          useBrowser && 'ds-token-picker--browser',
          allowLiteral && 'ds-token-picker--literal',
          compact && open && 'ds-token-picker--open',
          className,
        )}
      aria-label={ariaLabel}
      {...rest}
    >
      <div className="ds-token-picker__label">
        {icon != null ? (
          <span className="ds-token-picker__icon" aria-hidden>
            {icon}
          </span>
        ) : null}
        {label}
      </div>

      <div className="ds-token-picker__current">
        {allowLiteral ? (
          <>
            {colorEditor ? (
              <button
                ref={colorTriggerRef}
                type="button"
                className="ds-token-picker__color"
                data-testid="token-picker-color"
                aria-label={`${label} color`}
                aria-expanded={compact ? open : undefined}
                aria-haspopup="dialog"
                disabled={literalReadOnly}
                onClick={() => {
                  if (useBrowser) toggleOpen()
                  else setStandaloneColorOpen((v) => !v)
                }}
              >
                <span
                  className={cx(
                    'ds-token-picker__swatch',
                    !colorFillCss && 'ds-token-picker__swatch--empty',
                  )}
                  style={colorFillCss ? { background: colorFillCss } : undefined}
                  aria-hidden
                />
              </button>
            ) : null}
            <button
              ref={triggerRef}
              type="button"
              className="ds-token-picker__trigger ds-token-picker__trigger--browse"
              data-testid="token-picker-trigger"
              aria-expanded={compact ? open : undefined}
              aria-haspopup={compact ? 'listbox' : undefined}
              aria-label={`${label} token`}
              onClick={toggleOpen}
            >
              {colorEditor ? (
                <span className="ds-token-picker__browse-glyph" aria-hidden>
                  ▾
                </span>
              ) : selectedOption?.preview ? (
                stripPreview && previewKind !== 'auto' && previewKind !== 'color' ? (
                  <TokenPreview kind={previewKind} value={selectedOption.preview} size="sm" />
                ) : (
                  <span
                    className="ds-token-picker__swatch"
                    style={{ background: selectedOption.preview }}
                    aria-hidden
                  />
                )
              ) : (
                <span className="ds-token-picker__swatch ds-token-picker__swatch--empty" aria-hidden />
              )}
            </button>
            <input
              type="text"
              className={cx(
                'ds-token-picker__literal',
                !value && !literalValue && 'ds-token-picker__literal--empty',
                fontPreview && 'ds-token-picker__literal--font',
              )}
              style={valueStyle}
              value={displayedStripValue}
              placeholder={literalPlaceholderText}
              readOnly={literalReadOnly}
              aria-label={label}
              data-testid={literalTestId ?? 'token-picker-value'}
              onFocus={(e) => {
                setLiteralDraft(stripInputValue)
                if (value) e.currentTarget.select()
              }}
              onChange={(e) => setLiteralDraft(e.target.value)}
              onBlur={(e) => {
                if (pickingRef.current) {
                  setLiteralDraft(null)
                  return
                }
                const related = e.relatedTarget as Node | null
                if (related && rootRef.current?.contains(related)) {
                  setLiteralDraft(null)
                  return
                }
                const raw = e.currentTarget.value
                setLiteralDraft(null)
                // Focus+blur without edits (or unmount after pick) must not rewrite the bound value.
                if (raw === stripInputValue) return
                commitLiteral(raw)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  e.currentTarget.blur()
                }
              }}
            />
            {showPromote ? (
              <button
                type="button"
                className="ds-token-picker__promote"
                aria-label={promoteLiteralLabel}
                title={promoteLiteralLabel}
                data-testid="token-picker-promote"
                onClick={() => onPromoteLiteral?.()}
              >
                +
              </button>
            ) : null}
            {colorEditor && !useBrowser ? (
              <ColorPicker
                value={colorValueHex}
                showTrigger={false}
                anchorRef={colorTriggerRef}
                open={standaloneColorOpen}
                onOpenChange={setStandaloneColorOpen}
                aria-label={`${label} color`}
                onChange={(hex) => commitLiteral(hex)}
              />
            ) : null}
          </>
        ) : (
          <button
            ref={triggerRef}
            type="button"
            className="ds-token-picker__trigger"
            data-testid="token-picker-trigger"
            aria-expanded={compact ? open : undefined}
            aria-haspopup={compact ? 'listbox' : undefined}
            aria-label={label}
            onClick={toggleOpen}
          >
            {selectedOption?.preview ? (
              stripPreview && previewKind !== 'auto' && previewKind !== 'color' ? (
                <TokenPreview kind={previewKind} value={selectedOption.preview} size="sm" />
              ) : (
                <span
                  className="ds-token-picker__swatch"
                  style={{ background: selectedOption.preview }}
                  aria-hidden
                />
              )
            ) : null}
            <span
              className={cx(
                'ds-token-picker__path',
                !value && 'ds-token-picker__path--empty',
                fontPreview && 'ds-token-picker__path--font',
              )}
              style={valueStyle}
              data-testid="token-picker-value"
            >
              {displayText}
            </span>
          </button>
        )}
        {allowCycle ? (
          <span className="ds-token-picker__cycle">
            <button
              type="button"
              className="ds-token-picker__cycle-btn"
              aria-label={prevLabel}
              onClick={() => step(-1)}
            >
              −
            </button>
            <button
              type="button"
              className="ds-token-picker__cycle-btn"
              aria-label={nextLabel}
              onClick={() => step(1)}
            >
              +
            </button>
          </span>
        ) : null}
        {showClear ? (
          <button
            type="button"
            className="ds-token-picker__clear"
            aria-label={clearLabel}
            onClick={() => onClear?.()}
          >
            ×
          </button>
        ) : null}
      </div>

      {useBrowser ? browserPanel : flatList}
    </div>
  )
}
