'use client'

import { useMemo, useState } from 'react'
import type { ScenePage } from '@zaoly/contracts'
import { Button, ContextMenu } from '@zaoly/ui'

export type EditorPageTabsLabels = {
  ariaLabel: string
  addPage: string
  rename: string
  duplicate: string
  delete: string
  renamePrompt: string
  moreActions: string
}

type PageMenuState = {
  open: boolean
  x: number
  y: number
  pageId: string
}

type EditorPageTabsProps = {
  pages: ScenePage[]
  activePageId: string
  onSelect: (pageId: string) => void
  onAdd: () => void
  onRename: (pageId: string, name: string) => void
  onDuplicate: (pageId: string) => void
  onDelete: (pageId: string) => void
  labels: EditorPageTabsLabels
}

export function EditorPageTabs({
  pages,
  activePageId,
  onSelect,
  onAdd,
  onRename,
  onDuplicate,
  onDelete,
  labels,
}: EditorPageTabsProps) {
  const [menu, setMenu] = useState<PageMenuState>({
    open: false,
    x: 0,
    y: 0,
    pageId: '',
  })

  const menuPage = useMemo(
    () => pages.find((p) => p.id === menu.pageId),
    [menu.pageId, pages],
  )

  const menuItems = useMemo(() => {
    if (!menu.open || !menuPage) return []
    const canDelete = pages.length > 1
    return [
      {
        id: 'rename',
        label: labels.rename,
        onSelect: () => {
          // Tabs keep a lightweight prompt fallback; primary UI is EditorPagesList inline rename.
          const next = window.prompt(labels.renamePrompt, menuPage.name)?.trim()
          if (next) onRename(menuPage.id, next)
        },
      },
      {
        id: 'duplicate',
        label: labels.duplicate,
        onSelect: () => onDuplicate(menuPage.id),
      },
      {
        id: 'delete',
        label: labels.delete,
        disabled: !canDelete,
        danger: true,
        onSelect: () => {
          if (canDelete) onDelete(menuPage.id)
        },
      },
    ]
  }, [labels, menu.open, menuPage, onDelete, onDuplicate, onRename, pages.length])

  return (
    <>
      <div
        className="creation-editor-page-tabs"
        role="tablist"
        aria-label={labels.ariaLabel}
        data-testid="editor-page-tabs"
      >
        {pages.map((page) => {
          const active = page.id === activePageId
          return (
            <div key={page.id} className="creation-editor-page-tabs__item">
              <button
                type="button"
                role="tab"
                aria-selected={active}
                className={
                  active
                    ? 'creation-editor-page-tabs__tab creation-editor-page-tabs__tab--active'
                    : 'creation-editor-page-tabs__tab'
                }
                data-testid={`editor-page-tab-${page.id}`}
                onClick={() => {
                  if (!active) onSelect(page.id)
                }}
                onContextMenu={(e) => {
                  e.preventDefault()
                  setMenu({ open: true, x: e.clientX, y: e.clientY, pageId: page.id })
                }}
              >
                {page.name}
              </button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="creation-editor-page-tabs__more"
                aria-label={labels.moreActions}
                title={labels.moreActions}
                data-testid={`editor-page-tab-more-${page.id}`}
                onClick={(e) => {
                  e.stopPropagation()
                  const rect = e.currentTarget.getBoundingClientRect()
                  setMenu({ open: true, x: rect.left, y: rect.bottom + 4, pageId: page.id })
                }}
              >
                ⋯
              </Button>
            </div>
          )
        })}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="creation-editor-page-tabs__add"
          aria-label={labels.addPage}
          title={labels.addPage}
          data-testid="editor-page-add"
          onClick={onAdd}
        >
          +
        </Button>
      </div>
      <ContextMenu
        open={menu.open}
        x={menu.x}
        y={menu.y}
        items={menuItems}
        onClose={() => setMenu((m) => ({ ...m, open: false }))}
      />
    </>
  )
}
