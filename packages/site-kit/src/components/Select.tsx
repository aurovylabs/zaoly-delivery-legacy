import type { ReactNode, SelectHTMLAttributes } from 'react'

export type SiteSelectOption = { value: string; label: string }

/** Lines = options; optional `value|label` per line. */
export function parseSiteSelectOptions(raw: unknown): SiteSelectOption[] {
  if (Array.isArray(raw)) {
    const out: SiteSelectOption[] = []
    for (const item of raw) {
      if (item == null) continue
      if (typeof item === 'string') {
        const t = item.trim()
        if (t) out.push({ value: t, label: t })
        continue
      }
      if (typeof item === 'object') {
        const rec = item as Record<string, unknown>
        const value = String(rec.value ?? rec.label ?? '').trim()
        const label = String(rec.label ?? rec.value ?? '').trim()
        if (value) out.push({ value, label: label || value })
      }
    }
    return out
  }
  if (typeof raw !== 'string') return []
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const pipe = line.indexOf('|')
      if (pipe >= 0) {
        const value = line.slice(0, pipe).trim()
        const label = line.slice(pipe + 1).trim()
        return { value: value || label, label: label || value }
      }
      return { value: line, label: line }
    })
    .filter((o) => o.value)
}

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> & {
  /** Newline list or `value|label` rows; also accepts `{value,label}[]`. */
  options?: unknown
  children?: ReactNode
}

export function Select({ className, children, options, style, ...rest }: SelectProps) {
  const parsed = parseSiteSelectOptions(options)
  const optionNodes =
    children ??
    parsed.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))
  return (
    <select className={['site-select', className].filter(Boolean).join(' ')} style={style} {...rest}>
      {optionNodes}
    </select>
  )
}
