import type { DragEvent, HTMLAttributes, ReactNode } from 'react'
import { Button } from './Button'

export type ComponentPaletteItem = {
  id: string
  label: string
  description?: string
  /** Optional leading type glyph. */
  icon?: ReactNode
}

/** MIME for palette type drag onto a canvas drop target. */
export const COMPONENT_PALETTE_DND_MIME = 'application/x-zaoly-component-palette-type'

export type ComponentPaletteProps = {
  className?: string
  title?: string
  items: ComponentPaletteItem[]
  onAdd?: (id: string) => void
  /** Extra drag payload; MIME is always set to the item id. */
  onItemDragStart?: (id: string, event: DragEvent<HTMLElement>) => void
  footer?: ReactNode
  'aria-label'?: string
} & Omit<HTMLAttributes<HTMLElement>, 'className' | 'children' | 'title'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Clickable + draggable type list for inserting composition nodes. */
export function ComponentPalette({
  className,
  title = 'Components',
  items,
  onAdd,
  onItemDragStart,
  footer,
  'aria-label': ariaLabel = 'Component palette',
  ...rest
}: ComponentPaletteProps) {
  function handleDragStart(itemId: string, event: DragEvent<HTMLElement>) {
    event.dataTransfer.setData(COMPONENT_PALETTE_DND_MIME, itemId)
    event.dataTransfer.setData('text/plain', itemId)
    event.dataTransfer.effectAllowed = 'copy'
    onItemDragStart?.(itemId, event)
  }

  return (
    <nav className={cx('ds-component-palette', className)} aria-label={ariaLabel} {...rest}>
      <header className="ds-component-palette__head">
        <strong>{title}</strong>
      </header>
      <ul className="ds-component-palette__list">
        {items.map((item) => (
          <li
            key={item.id}
            className="ds-component-palette__item"
            draggable
            onDragStart={(event) => handleDragStart(item.id, event)}
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={item.icon}
              className="ds-component-palette__btn"
              onClick={() => onAdd?.(item.id)}
            >
              <span className="ds-component-palette__label">{item.label}</span>
              {item.description ? (
                <>
                  {' '}
                  <span className="ds-component-palette__desc">{item.description}</span>
                </>
              ) : null}
            </Button>
          </li>
        ))}
      </ul>
      {footer ? <footer className="ds-component-palette__footer">{footer}</footer> : null}
    </nav>
  )
}
