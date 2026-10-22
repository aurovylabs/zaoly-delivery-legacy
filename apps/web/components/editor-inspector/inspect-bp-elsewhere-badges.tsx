'use client'

import type { SceneBreakpointId } from '@zaoly/contracts'
import { breakpointChipAbbrev } from '../../lib/scene/breakpoint-field-overrides'

type ElsewhereBp = Exclude<SceneBreakpointId, 'desktop'>

export function InspectBpElsewhereBadges({
  bps,
  tip,
  onSelectBreakpoint,
}: {
  bps: ElsewhereBp[]
  tip: string
  /** When set, chips jump to that breakpoint (toolbar-equivalent). */
  onSelectBreakpoint?: (bp: ElsewhereBp) => void
}) {
  if (!bps.length) return null
  return (
    <span
      className="creation-inspect-bp-elsewhere"
      title={tip}
      data-testid="inspect-bp-elsewhere"
      aria-label={tip}
    >
      {bps.map((bp) => {
        const label = breakpointChipAbbrev(bp)
        if (onSelectBreakpoint) {
          return (
            <button
              key={bp}
              type="button"
              className="creation-inspect-bp-elsewhere__chip creation-inspect-bp-elsewhere__chip--button"
              data-bp={bp}
              data-testid="inspect-bp-elsewhere-chip"
              aria-label={tip}
              title={tip}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onSelectBreakpoint(bp)
              }}
            >
              {label}
            </button>
          )
        }
        return (
          <span
            key={bp}
            className="creation-inspect-bp-elsewhere__chip"
            data-bp={bp}
          >
            {label}
          </span>
        )
      })}
    </span>
  )
}

/** Build localized tip for elsewhere chips. */
export function elsewhereBreakpointsTip(
  bps: ElsewhereBp[],
  t: (key: string, params?: Record<string, string>) => string,
  clickable = false,
): string {
  const names = bps.map((bp) => t(`editor.breakpoint.${bp}`))
  const base = t('editor.bpElsewhereTip', { bps: names.join(', ') })
  if (!clickable) return base
  return `${base} · ${t('editor.bpElsewhereJumpTip')}`
}
