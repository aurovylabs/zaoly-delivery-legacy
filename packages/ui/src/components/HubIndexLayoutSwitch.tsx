import type { ReactNode } from 'react'

export type HubIndexLayout = 'cards' | 'list'

export type HubIndexLayoutSwitchProps = {
  value: HubIndexLayout
  onChange: (next: HubIndexLayout) => void
  cardsLabel?: ReactNode
  listLabel?: ReactNode
  className?: string
  'aria-label'?: string
}

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/**
 * Cards | List pill switch for hub index surfaces.
 * Spec: specs/domain/zaoly-ui-hub-index-layout-switch.md · Origin: Audion hubs.
 */
export function HubIndexLayoutSwitch({
  value,
  onChange,
  cardsLabel = 'Cards',
  listLabel = 'List',
  className,
  'aria-label': ariaLabel = 'Layout',
}: HubIndexLayoutSwitchProps) {
  return (
    <div
      className={cx('ds-hub-index-layout-switch', className)}
      role="group"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        className={value === 'cards' ? 'is-active' : undefined}
        aria-pressed={value === 'cards'}
        onClick={() => onChange('cards')}
      >
        {cardsLabel}
      </button>
      <button
        type="button"
        className={value === 'list' ? 'is-active' : undefined}
        aria-pressed={value === 'list'}
        onClick={() => onChange('list')}
      >
        {listLabel}
      </button>
    </div>
  )
}
