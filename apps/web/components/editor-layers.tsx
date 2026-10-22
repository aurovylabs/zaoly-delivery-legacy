'use client'

import { useMemo } from 'react'
import type { SceneBreakpointId, SceneNode } from '@zaoly/contracts'
import {
  LayersPanel,
  type LayersPanelItem,
  type LayersPanelReorderDropPosition,
  type LayersPanelSelectMods,
} from '@zaoly/ui'
import { paletteTypeIcon } from '../lib/inspect/icons'
import { isSceneContainerType } from '../lib/scene/ops'
import { cascadeNodeHidden } from '../lib/scene/breakpoint-visibility'
import type { DigitalPrimaryBreakpoint } from '../lib/scene/cascade'

function toLayersItem(
  node: SceneNode,
  breakpoint: SceneBreakpointId,
  primary: DigitalPrimaryBreakpoint,
): LayersPanelItem {
  const sealedInstance = node.type === 'Instance'
  const isInstance = sealedInstance || Boolean(node.instanceOf)
  return {
    id: node.id,
    label: isInstance
      ? `${node.name?.trim() || 'Instance'} · Instance`
      : node.name?.trim() || node.type,
    icon: paletteTypeIcon(isInstance ? 'Instance' : node.type),
    hidden: cascadeNodeHidden(node, breakpoint, primary),
    locked: Boolean(node.locked),
    acceptsChildren: sealedInstance ? false : isSceneContainerType(node.type),
    children: sealedInstance
      ? undefined
      : node.children?.map((child) => toLayersItem(child, breakpoint, primary)),
  }
}

/** Maps CompositionScene tree → shared LayersPanel (reorder + hide/lock + multi). */
export function EditorLayers({
  root,
  selectedId,
  selectedIds,
  activeBreakpoint = 'desktop',
  primaryBreakpoint = 'desktop',
  onSelect,
  onMoveUp,
  onMoveDown,
  onReorderDrop,
  onToggleHidden,
  onToggleLocked,
  onItemContextMenu,
  onLayerDragStart,
  onLayerDragEnd,
  title,
  emptyLabel,
  masterEdit = false,
}: {
  root: SceneNode
  selectedId: string | null
  /** Canvas selection SSOT — native DS `selectedIds` highlight. */
  selectedIds?: string[]
  /** Wave D — Layers eye reflects cascade visibility at active BP. */
  activeBreakpoint?: SceneBreakpointId
  /** Wave H — OP-9 cascade base. */
  primaryBreakpoint?: DigitalPrimaryBreakpoint
  onSelect: (id: string, mods?: LayersPanelSelectMods) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  onReorderDrop: (
    id: string,
    targetId: string,
    position: LayersPanelReorderDropPosition,
  ) => void
  onToggleHidden: (id: string) => void
  onToggleLocked: (id: string) => void
  onItemContextMenu?: (
    id: string,
    event: { clientX: number; clientY: number; preventDefault: () => void },
  ) => void
  onLayerDragStart?: (id: string) => void
  onLayerDragEnd?: () => void
  title: string
  emptyLabel: string
  /** Master-Edit mode — tint Layers wrap so it is not confused with the scene board. */
  masterEdit?: boolean
}) {
  const items = useMemo(
    () => [toLayersItem(root, activeBreakpoint, primaryBreakpoint)],
    [root, activeBreakpoint, primaryBreakpoint],
  )

  return (
    <div
      className={
        masterEdit
          ? 'creation-editor-layers-wrap creation-editor-layers-wrap--master-edit'
          : 'creation-editor-layers-wrap'
      }
      data-testid="creation-editor-layers-wrap"
      data-master-edit={masterEdit ? 'true' : undefined}
      onDragStartCapture={(e) => {
        const row = (e.target as HTMLElement).closest('[data-testid^="layers-panel-row-"]')
        if (!(row instanceof HTMLElement)) return
        const testId = row.getAttribute('data-testid') ?? ''
        const id = testId.replace('layers-panel-row-', '').trim()
        if (id) onLayerDragStart?.(id)
      }}
      onDragEndCapture={() => onLayerDragEnd?.()}
    >
      <LayersPanel
        className="creation-editor-layers"
        title={title}
        items={items}
        selectedId={selectedId}
        selectedIds={selectedIds}
        onSelect={onSelect}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onReorderDrop={onReorderDrop}
        onToggleHidden={onToggleHidden}
        onToggleLocked={onToggleLocked}
        onItemContextMenu={onItemContextMenu}
        emptyLabel={emptyLabel}
        data-testid="creation-editor-layers"
      />
    </div>
  )
}
