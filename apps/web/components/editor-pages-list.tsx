'use client'

import { useEffect, useMemo, useRef, useState, type DragEvent, type KeyboardEvent } from 'react'
import type { ScenePage } from '@zaoly/contracts'
import { Button, ContextMenu, LAYERS_PANEL_DND_MIME, type ContextMenuItem } from '@zaoly/ui'
import type { EditorPageTabsLabels } from './editor-page-tabs'

function hasLayerPanelDrag(transfer: DataTransfer | null): boolean {
  if (!transfer) return false
  return Array.from(transfer.types).includes(LAYERS_PANEL_DND_MIME)
}

function layerIdFromDrop(transfer: DataTransfer): string {
  return transfer.getData(LAYERS_PANEL_DND_MIME).trim()
}

type PageMenuState = {
  open: boolean
  x: number
  y: number
  pageId: string
}

type EditorPagesListProps = {
  pages: ScenePage[]
  activePageId: string
  coverPageId?: string | null
  onSelect: (pageId: string) => void
  onAdd: () => void
  onRename: (pageId: string, name: string) => void
  onDuplicate: (pageId: string) => void
  onDelete: (pageId: string) => void
  onSetCover?: (pageId: string) => void
  onSaveAsPattern?: (pageId: string) => void
  onSaveAllAsPatterns?: () => void
  onLayerDropToPage?: (nodeId: string, pageId: string) => void
  labels: EditorPageTabsLabels & {
    setAsCover: string
    coverBadge: string
    saveAsPattern?: string
    saveAllAsPatterns?: string
  }
  patternActionsEnabled?: boolean
  patternActionsBusy?: boolean
}

export function EditorPagesList({
  pages,
  activePageId,
  coverPageId,
  onSelect,
  onAdd,
  onRename,
  onDuplicate,
  onDelete,
  onSetCover,
  onSaveAsPattern,
  onSaveAllAsPatterns,
  onLayerDropToPage,
  labels,
  patternActionsEnabled = false,
  patternActionsBusy = false,
}: EditorPagesListProps) {
  const [menu, setMenu] = useState<PageMenuState>({
    open: false,
    x: 0,
    y: 0,
    pageId: '',
  })
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameDraft, setRenameDraft] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)

  const menuPage = useMemo(
    () => pages.find((p) => p.id === menu.pageId),
    [menu.pageId, pages],
  )

  useEffect(() => {
    if (!renamingId) return
    queueMicrotask(() => {
      renameInputRef.current?.focus()
      renameInputRef.current?.select()
    })
  }, [renamingId])

  function beginRename(page: ScenePage) {
    setMenu((m) => ({ ...m, open: false }))
    setRenamingId(page.id)
    setRenameDraft(page.name)
  }

  function commitRename() {
    if (!renamingId) return
    const next = renameDraft.trim()
    const current = pages.find((p) => p.id === renamingId)
    setRenamingId(null)
    if (next && current && next !== current.name) onRename(renamingId, next)
  }

  function cancelRename() {
    setRenamingId(null)
  }

  function openMenuFor(pageId: string, x: number, y: number) {
    setMenu({ open: true, x, y, pageId })
  }

  const menuItems = useMemo((): ContextMenuItem[] => {
    if (!menu.open || !menuPage) return []
    const canDelete = pages.length > 1
    const items: ContextMenuItem[] = [
      {
        id: 'rename',
        label: labels.rename,
        onSelect: () => beginRename(menuPage),
      },
      {
        id: 'duplicate',
        label: labels.duplicate,
        onSelect: () => onDuplicate(menuPage.id),
      },
    ]
    if (onSetCover) {
      items.push({
        id: 'set-cover',
        label: labels.setAsCover,
        onSelect: () => onSetCover(menuPage.id),
      })
    }
    if (onSaveAsPattern && labels.saveAsPattern) {
      items.push({
        id: 'save-pattern',
        label: labels.saveAsPattern,
        disabled: !patternActionsEnabled || patternActionsBusy,
        testId: 'editor-page-save-as-pattern',
        onSelect: () => onSaveAsPattern(menuPage.id),
      })
    }
    if (onSaveAllAsPatterns && labels.saveAllAsPatterns) {
      items.push({
        id: 'save-all-patterns',
        label: labels.saveAllAsPatterns,
        disabled: !patternActionsEnabled || patternActionsBusy,
        testId: 'editor-page-save-all-as-patterns',
        onSelect: () => onSaveAllAsPatterns(),
      })
    }
    items.push({
      id: 'delete',
      label: labels.delete,
      disabled: !canDelete,
      danger: true,
      onSelect: () => {
        if (canDelete) onDelete(menuPage.id)
      },
    })
    return items
  }, [
    labels,
    menu.open,
    menuPage,
    onDelete,
    onDuplicate,
    onSaveAllAsPatterns,
    onSaveAsPattern,
    onSetCover,
    pages.length,
    patternActionsBusy,
    patternActionsEnabled,
  ])

  return (
    <>
      <section className="creation-editor-pages-list" data-testid="editor-pages-list">
        <div className="creation-editor-pages-list__header">
          <span className="creation-editor-pages-list__title">{labels.ariaLabel}</span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="creation-editor-pages-list__add"
            aria-label={labels.addPage}
            title={labels.addPage}
            data-testid="editor-page-add"
            onClick={onAdd}
          >
            +
          </Button>
        </div>
        <ul className="creation-editor-pages-list__items" role="listbox" aria-label={labels.ariaLabel}>
          {pages.map((page) => {
            const active = page.id === activePageId
            const isCover = Boolean(coverPageId && page.id === coverPageId)
            const renaming = renamingId === page.id
            return (
              <li key={page.id} className="creation-editor-pages-list__item">
                {renaming ? (
                  <input
                    ref={renameInputRef}
                    className="creation-editor-pages-list__rename"
                    value={renameDraft}
                    aria-label={labels.rename}
                    data-testid={`editor-page-rename-${page.id}`}
                    onChange={(e) => setRenameDraft(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        commitRename()
                      } else if (e.key === 'Escape') {
                        e.preventDefault()
                        cancelRename()
                      }
                    }}
                  />
                ) : (
                  <>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      className={
                        active
                          ? 'creation-editor-pages-list__row creation-editor-pages-list__row--active'
                          : 'creation-editor-pages-list__row'
                      }
                      data-testid={`editor-page-row-${page.id}`}
                      onClick={() => {
                        if (!active) onSelect(page.id)
                      }}
                      onDoubleClick={(e) => {
                        e.preventDefault()
                        beginRename(page)
                      }}
                      onDragOver={(e: DragEvent<HTMLButtonElement>) => {
                        if (!onLayerDropToPage || !hasLayerPanelDrag(e.dataTransfer)) return
                        e.preventDefault()
                        e.dataTransfer.dropEffect = 'move'
                        e.currentTarget.classList.add('creation-editor-pages-list__row--drop-target')
                      }}
                      onDragLeave={(e: DragEvent<HTMLButtonElement>) => {
                        const next = e.relatedTarget
                        if (next instanceof Node && e.currentTarget.contains(next)) return
                        e.currentTarget.classList.remove('creation-editor-pages-list__row--drop-target')
                      }}
                      onDrop={(e: DragEvent<HTMLButtonElement>) => {
                        if (!onLayerDropToPage) return
                        const nodeId = layerIdFromDrop(e.dataTransfer)
                        if (!nodeId) return
                        e.preventDefault()
                        e.stopPropagation()
                        e.currentTarget.classList.remove('creation-editor-pages-list__row--drop-target')
                        onLayerDropToPage(nodeId, page.id)
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault()
                        openMenuFor(page.id, e.clientX, e.clientY)
                      }}
                    >
                      <span className="creation-editor-pages-list__row-label">
                        <span>{page.name}</span>
                        {isCover ? (
                          <span
                            className="creation-editor-pages-list__cover-badge"
                            data-testid={`editor-page-cover-${page.id}`}
                          >
                            {labels.coverBadge}
                          </span>
                        ) : null}
                      </span>
                    </button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="creation-editor-pages-list__more"
                      aria-label={labels.moreActions}
                      title={labels.moreActions}
                      data-testid={`editor-page-more-${page.id}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        const rect = e.currentTarget.getBoundingClientRect()
                        openMenuFor(page.id, rect.left, rect.bottom + 4)
                      }}
                    >
                      ⋯
                    </Button>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      </section>
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
