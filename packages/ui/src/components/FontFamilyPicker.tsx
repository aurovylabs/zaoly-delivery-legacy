'use client'

import { useEffect, useMemo, useState } from 'react'
import type { FieldSize } from './Field'
import { Field } from './Field'
import { Input } from './Input'
import {
  filterGoogleFontsCatalog,
  GOOGLE_FONTS_CATALOG,
  type GoogleFontCatalogEntry,
} from '../lib/google-fonts-catalog'
import { ensureGoogleFontStylesheet, resolveGoogleFontFamily } from '../lib/google-font-loader'

export type FontFamilyPickerLabels = {
  search: string
  family: string
  custom: string
  /** Shown when search results exceed maxListResults (TP-2). */
  moreResults?: string
}

export type FontFamilyPickerProps = {
  value: string
  onChange: (next: string) => void
  labels?: FontFamilyPickerLabels
  previewText?: string
  catalog?: readonly GoogleFontCatalogEntry[]
  /** Cap visible rows after search (large remote catalogs). */
  maxListResults?: number
  size?: FieldSize
  className?: string
  controlClassName?: string
  /** Optional test id for the family value input (custom / selected). */
  valueTestId?: string
  'data-testid'?: string
}

const DEFAULT_LABELS: FontFamilyPickerLabels = {
  search: 'Search fonts',
  family: 'Family',
  custom: 'Custom family',
}

const DEFAULT_PREVIEW = 'The quick brown fox jumps over the lazy dog.'

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

function FontRow({
  entry,
  active,
  previewText,
  onSelect,
  testId,
}: {
  entry: GoogleFontCatalogEntry
  active: boolean
  previewText: string
  onSelect: () => void
  testId?: string
}) {
  useEffect(() => {
    ensureGoogleFontStylesheet(entry.family)
  }, [entry.family])

  const resolved = resolveGoogleFontFamily(entry.family) ?? entry.family

  return (
    <button
      type="button"
      className={cx('ds-font-family-picker__row', active && 'ds-font-family-picker__row--active')}
      onClick={onSelect}
      data-testid={testId}
    >
      <span className="ds-font-family-picker__row-meta">
        <span className="ds-font-family-picker__row-name">{entry.family}</span>
        <span className="ds-font-family-picker__row-category">{entry.category}</span>
      </span>
      <span
        className="ds-font-family-picker__row-sample"
        style={{ fontFamily: `"${resolved}", system-ui, sans-serif` }}
      >
        {previewText}
      </span>
    </button>
  )
}

export function FontFamilyPicker({
  value,
  onChange,
  labels = DEFAULT_LABELS,
  previewText = DEFAULT_PREVIEW,
  catalog = GOOGLE_FONTS_CATALOG,
  maxListResults,
  size = 'md',
  className,
  controlClassName,
  valueTestId,
  'data-testid': testId,
}: FontFamilyPickerProps) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => filterGoogleFontsCatalog(query, catalog), [catalog, query])
  const visible = useMemo(() => {
    if (maxListResults == null || filtered.length <= maxListResults) return filtered
    return filtered.slice(0, maxListResults)
  }, [filtered, maxListResults])
  const truncated = maxListResults != null && filtered.length > maxListResults
  const tid = (suffix: string) => (testId ? `${testId}-${suffix}` : undefined)

  useEffect(() => {
    if (value.trim()) ensureGoogleFontStylesheet(value)
  }, [value])

  const valueInCatalog = catalog.some(
    (entry) => entry.family.toLowerCase() === value.trim().toLowerCase(),
  )

  return (
    <div className={cx('ds-font-family-picker', className)} data-testid={testId}>
      <Field label={labels.search} size={size}>
        <Input
          size={size}
          block
          className={controlClassName}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={labels.search}
          data-testid={tid('search-input')}
        />
      </Field>

      <div
        className="ds-font-family-picker__list"
        role="listbox"
        aria-label={labels.family}
        data-testid={tid('list')}
      >
        {visible.map((entry) => (
          <FontRow
            key={entry.family}
            entry={entry}
            active={entry.family.toLowerCase() === value.trim().toLowerCase()}
            previewText={previewText}
            onSelect={() => onChange(entry.family)}
            testId={tid(`option-${entry.family.replace(/\s+/g, '-')}`)}
          />
        ))}
        {filtered.length === 0 ? (
          <p className="ds-font-family-picker__empty">—</p>
        ) : null}
        {truncated && labels.moreResults ? (
          <p className="ds-font-family-picker__more" data-testid={tid('more-results')}>
            {labels.moreResults}
          </p>
        ) : null}
      </div>

      {!valueInCatalog && value.trim() ? (
        <p className="ds-font-family-picker__current" data-testid={tid('current-custom')}>
          {labels.family}: <strong>{value}</strong>
        </p>
      ) : null}

      <Field label={labels.custom} size={size} hint={labels.family}>
        <Input
          size={size}
          block
          className={controlClassName}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Inter"
          aria-label={labels.custom}
          data-testid={valueTestId ?? tid('custom-input')}
        />
      </Field>
    </div>
  )
}

export type { GoogleFontCatalogEntry } from '../lib/google-fonts-catalog'
