'use client'

import React from 'react'
import type { PresenceActivityChip } from '../lib/editor/presence-activity'

interface PresenceActivityRibbonProps {
  chips: PresenceActivityChip[]
}

export function PresenceActivityRibbon({ chips }: PresenceActivityRibbonProps) {
  if (chips.length === 0) return null

  return (
    <div
      className="creation-presence-activity-ribbon"
      data-testid="presence-activity-ribbon"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
        alignItems: 'center',
        maxWidth: '420px',
      }}
      aria-label="Collaborator activity"
    >
      {chips.map((chip) => (
        <span
          key={chip.userId}
          data-testid="presence-activity-chip"
          title={chip.label}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '10px',
            fontWeight: 600,
            lineHeight: 1.2,
            padding: '2px 6px',
            borderRadius: '4px',
            background: 'var(--surface-2, #27272a)',
            color: 'var(--muted, #a1a1aa)',
            opacity: chip.isIdle ? 0.55 : 1,
            whiteSpace: 'nowrap',
            maxWidth: '160px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          <span
            aria-hidden
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: chip.color,
              flexShrink: 0,
            }}
          />
          {chip.label}
        </span>
      ))}
    </div>
  )
}
