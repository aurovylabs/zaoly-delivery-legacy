'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { SceneNode, SceneOp } from '@zaoly/contracts'
import { inspectEnumIcon, inspectPropIcon, paletteTypeIcon } from '../lib/inspect/icons'
import {
  IconCopy as Copy,
  IconFolderPlus as FolderPlus,
  IconGrid as Grid2X2,
  IconTrash as Trash2,
  IconBringToFront as ArrowUpToLine,
  IconSendToBack as ArrowDownToLine,
  IconScissors as Scissors,
  IconType as Type,
  IconCard as Square,
  IconImage as ImageIcon,
  IconGroup as Group,
  IconUngroup as Ungroup,
  IconDiamond as Diamond,
} from '../lib/zaoly-ui'
import {
  MultiAlignToolbar,
  type SpatialAlignment,
  type SpatialDistribution,
} from './multi-align-toolbar'
import { isSmartHudEnabled } from '../lib/runtime-config'
import { trackHudEvent } from '../lib/inspect/hud-telemetry'
import type { HudQuickSlot } from '../lib/inspect/hud-quick-slots'
import { filterHudStripSlots } from '../lib/inspect/hud-quick-slots'
import { ensureGoogleFontStylesheet } from '../lib/fonts/google-fonts'
import { HudSlotValueChip, hudPrettyOptionLabel } from './hud-slot-value-chip'
import { HudSizeDimField } from './hud-size-dim-field'
import { HudTokenField, tokenGroupForHudSlot } from './hud-token-field'
import {
  buildHudSelectWriteOps,
  buildHudStructureOps,
  fanOutHudOpsToSelection,
  looksLikeTokenPath,
  readHudMultiSlotValue,
  readHudSlotValue,
  resolveHudModel,
  type HudModel,
} from '../lib/inspect/resolve-hud-model'
import { ChromeTip } from './chrome-tip'
import { useT } from '../lib/user-prefs'
import type { Translator } from '../lib/i18n'
import { paths } from '../lib/paths'

export type CanvasFloatingHudProps = {
  selectedNode: SceneNode | null
  selectedCount?: number
  selectedIds?: string[]
  selectedNodes?: SceneNode[]
  workingRootId?: string | null
  isMasterInstance: boolean
  smartHudEnabled?: boolean
  readOnly?: boolean
  softLocked?: boolean
  /** W4 interactive pseudo-state from Inspect switcher. */
  pseudoState?: string
  onAddPrimitive: (type: string) => void
  onWrapStack: () => void
  onWrapGrid: () => void
  onUnwrap?: () => void
  onGroupSelection?: () => void
  onDuplicate: () => void
  onDelete: () => void
  onMoveLayer: (delta: -1 | 1) => void
  onDetachMaster?: () => void
  onCreateMaster?: () => void
  onAlignSelected?: (alignment: SpatialAlignment) => void
  onDistributeSelected?: (axis: SpatialDistribution) => void
  /** Apply scene ops from Smart slots (set_prop / token / table_*). */
  onHudOps?: (ops: SceneOp[]) => void
  /** Host chrome actions (Asset Library, SVG deep-edit) — not SceneOps. */
  onHudHostAction?: (action: import('../lib/inspect/hud-quick-slots').HudHostActionId) => void
}

function useInlineEditingFlag(): boolean {
  const [inlineEditing, setInlineEditing] = useState(false)
  useEffect(() => {
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<{ active?: boolean }>).detail
      setInlineEditing(Boolean(detail?.active))
    }
    window.addEventListener(paths.inlineEditActiveEvent, onChange)
    // Hydrate if an editor is already mounted (rare race with HUD remount).
    setInlineEditing(Boolean(document.querySelector('[data-testid="creation-inline-edit"]')))
    return () => window.removeEventListener(paths.inlineEditActiveEvent, onChange)
  }, [])
  return inlineEditing
}

function SmartSlotControl({
  node,
  slot,
  disabled,
  onOps,
  onHostAction,
  valueOverride,
}: {
  node: SceneNode
  slot: HudQuickSlot
  disabled: boolean
  onOps?: (ops: SceneOp[]) => void
  onHostAction?: (action: import('../lib/inspect/hud-quick-slots').HudHostActionId) => void
  /** Multi-select mixed display (`—`) when provided. */
  valueOverride?: string
}) {
  const value = valueOverride ?? readHudSlotValue(node, slot)
  const label = slot.label ?? slot.key

  if (slot.control === 'action' && slot.source === 'hostAction' && slot.hostAction) {
    const icon = inspectPropIcon(slot.key)
    return (
      <ChromeTip tip={label}>
      <button
        type="button"
        className="creation-canvas-floating-hud__btn"
        disabled={disabled}
        data-testid={`hud-slot-${slot.key}`}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onHostAction?.(slot.hostAction!)
        }}
      >
        {icon ? (
          <span className="creation-canvas-floating-hud__token-icon-glyph" aria-hidden>
            {icon}
          </span>
        ) : null}
        <span>{label}</span>
      </button>
      </ChromeTip>
    )
  }

  if (slot.control === 'action' && slot.op) {
    const icon = inspectPropIcon(slot.key)
    return (
      <ChromeTip tip={label}>
      <button
        type="button"
        className="creation-canvas-floating-hud__btn"
        disabled={disabled}
        data-testid={`hud-slot-${slot.key}`}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onOps?.(buildHudStructureOps(node.id, slot.op!))
        }}
      >
        {icon ? (
          <span className="creation-canvas-floating-hud__token-icon-glyph" aria-hidden>
            {icon}
          </span>
        ) : null}
        <span>{label}</span>
      </button>
      </ChromeTip>
    )
  }

  if (slot.control === 'toggle') {
    const on = value === 'true' || value === '1' || value === true.toString()
    const boolOn = node.props?.[slot.key] === true || on
    return (
      <ChromeTip tip={label}>
      <button
        type="button"
        className={`creation-canvas-floating-hud__btn${boolOn ? ' creation-canvas-floating-hud__btn--on' : ''}`}
        disabled={disabled}
        data-testid={`hud-slot-${slot.key}`}
        aria-pressed={boolOn}
        onClick={() =>
          onOps?.([{ op: 'set_prop', nodeId: node.id, key: slot.key, value: !boolOn }])
        }
      >
        <span>{label}</span>
      </button>
      </ChromeTip>
    )
  }

  if (slot.control === 'tokenColor' || slot.control === 'tokenType') {
    return (
      <HudTokenField
        node={node}
        slotKey={slot.key}
        label={label}
        tokenGroup={tokenGroupForHudSlot(slot.control, slot.key)}
        disabled={disabled}
        onOps={onOps}
        layout="field"
        surface="compact"
      />
    )
  }

  if (slot.control === 'tokenLength') {
    return (
      <HudTokenField
        node={node}
        slotKey={slot.key}
        label={label}
        tokenGroup={tokenGroupForHudSlot(slot.control, slot.key)}
        disabled={disabled}
        onOps={onOps}
        layout="field"
        surface="compact"
      />
    )
  }

  if (slot.control === 'select' && slot.options) {
    const display = hudPrettyOptionLabel(slot.options, value)
    return (
      <HudSlotValueChip
        slotKey={slot.key}
        label={label}
        displayValue={display}
        currentValue={value}
        disabled={disabled}
        options={slot.options.map((opt) => ({
          value: opt.value,
          label: opt.label,
          optionLabel: (
            <span className="creation-canvas-floating-hud__select-option">
              {slot.key === 'fontFamily' && !looksLikeTokenPath(opt.value) ? (
                <span style={{ fontFamily: opt.value, fontSize: 12 }} aria-hidden>
                  Aa
                </span>
              ) : null}
              {opt.label}
            </span>
          ),
        }))}
        onPick={(next) => {
          onOps?.(buildHudSelectWriteOps(node, slot, next))
          if (slot.key === 'fontFamily' && !looksLikeTokenPath(next)) {
            ensureGoogleFontStylesheet(next)
          }
        }}
      />
    )
  }

  if (slot.control === 'segmented' && slot.options) {
    if (slot.options.length > 4) {
      return (
        <HudSlotValueChip
          slotKey={slot.key}
          label={label}
          displayValue={hudPrettyOptionLabel(slot.options, value)}
          currentValue={value}
          disabled={disabled}
          options={slot.options}
          onPick={(next) => {
            const key =
              slot.key === 'justify' && node.type !== 'SiteStack' && node.type !== 'Stack'
                ? 'justifyContent'
                : slot.key === 'align' && node.type !== 'SiteStack' && node.type !== 'Stack'
                  ? 'alignItems'
                  : slot.key
            onOps?.([{ op: 'set_prop', nodeId: node.id, key, value: next }])
          }}
        />
      )
    }
    return (
      <div
        className="creation-canvas-floating-hud__segmented creation-canvas-floating-hud__segmented--icon"
        data-testid={`hud-slot-${slot.key}`}
        role="group"
        aria-label={label}
      >
        {slot.options.map((opt) => {
          const active = value === opt.value || String(node.props?.[slot.key] ?? '') === opt.value
          const enumIcon = inspectEnumIcon(slot.key, opt.value)
          return (
            <button
              key={opt.value}
              type="button"
              className={`creation-canvas-floating-hud__btn creation-canvas-floating-hud__seg${active ? ' creation-canvas-floating-hud__btn--on' : ''}${enumIcon ? ' creation-canvas-floating-hud__seg--icon' : ''}`}
              title={`${label}: ${opt.label}`}
              disabled={disabled}
              aria-label={`${label}: ${opt.label}`}
              aria-pressed={active}
              onClick={() => {
                const key =
                  slot.key === 'justify' && node.type !== 'SiteStack' && node.type !== 'Stack'
                    ? 'justifyContent'
                    : slot.key === 'align' && node.type !== 'SiteStack' && node.type !== 'Stack'
                      ? 'alignItems'
                      : slot.key
                onOps?.([{ op: 'set_prop', nodeId: node.id, key, value: opt.value }])
              }}
            >
              {enumIcon ?? opt.label}
            </button>
          )
        })}
      </div>
    )
  }

  if (slot.control === 'sizeMode') {
    return (
      <HudSizeDimField
        node={node}
        dim={slot.key === 'height' ? 'height' : 'width'}
        label={label}
        disabled={disabled}
        onOps={onOps}
      />
    )
  }

  if ((slot.control === 'stepper' || slot.control === 'swatch') && slot.tokenLadder) {
    const ladder = slot.tokenLadder
    const opts = ladder.map((path) => ({
      value: path,
      label: path.split('.').slice(-1)[0] || path,
      optionLabel: (
        <span className="creation-canvas-floating-hud__select-option">
          {slot.control === 'swatch' ? (
            <span className="creation-canvas-floating-hud__swatch-dot" aria-hidden />
          ) : null}
          {path.split('.').slice(-1)[0] || path}
        </span>
      ),
    }))
    return (
      <HudSlotValueChip
        slotKey={slot.key}
        label={label}
        displayValue={hudPrettyOptionLabel(opts, value)}
        currentValue={value}
        disabled={disabled}
        leading={
          slot.control === 'swatch' ? (
            <span className="creation-canvas-floating-hud__swatch-dot" aria-hidden />
          ) : undefined
        }
        options={opts}
        onPick={(next) => {
          onOps?.([{ op: 'set_token_binding', nodeId: node.id, key: slot.key, tokenPath: next }])
        }}
      />
    )
  }

  return null
}

const HUD_OVERFLOW_INSERT: { type: string; label: string }[] = [
  { type: 'Stack', label: 'Stack' },
  { type: 'SiteText', label: 'Text' },
  { type: 'Button', label: 'Button' },
  { type: 'Image', label: 'Image' },
  { type: 'Grid', label: 'Grid' },
]

function StructureOverflow({
  t,
  selectedNode,
  isMasterInstance,
  disabled,
  showInsertOverflow,
  onAddPrimitive,
  onWrapStack,
  onWrapGrid,
  onUnwrap,
  onDuplicate,
  onDelete,
  onMoveLayer,
  onDetachMaster,
  onCreateMaster,
}: {
  t: Translator
  selectedNode: SceneNode | null
  isMasterInstance: boolean
  disabled: boolean
  showInsertOverflow?: boolean
  onAddPrimitive?: (type: string) => void
  onWrapStack: () => void
  onWrapGrid: () => void
  onUnwrap?: () => void
  onDuplicate: () => void
  onDelete: () => void
  onMoveLayer: (delta: -1 | 1) => void
  onDetachMaster?: () => void
  onCreateMaster?: () => void
}) {
  const canUnwrap =
    onUnwrap &&
    selectedNode &&
    ((selectedNode.children && selectedNode.children.length > 0) ||
      ['Stack', 'Grid', 'Container', 'Card', 'SiteStack', 'SiteGrid', 'SiteContainer'].includes(
        selectedNode.type,
      ))

  return (
    <details className="creation-canvas-floating-hud__overflow">
      {/* summary must be a direct child of details — aria-label only (no ChromeTip wrapper). */}
      <summary
        className="creation-canvas-floating-hud__btn"
        data-testid="hud-structure-overflow"
        aria-label={t('editor.hud.structureActions')}
      >
        ⋯
      </summary>
      <div className="creation-canvas-floating-hud__overflow-menu" role="menu">
        {showInsertOverflow && onAddPrimitive ? (
          <div
            className="creation-canvas-floating-hud__overflow-section"
            data-testid="hud-overflow-insert"
          >
            <div className="creation-canvas-floating-hud__overflow-label">{t('editor.hud.insertOverflow')}</div>
            {HUD_OVERFLOW_INSERT.map((item) => (
              <button
                key={item.type}
                type="button"
                role="menuitem"
                disabled={disabled}
                onClick={() => onAddPrimitive(item.type)}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}
        <button type="button" role="menuitem" disabled={disabled} onClick={onWrapStack}>
          {t('editor.hud.wrapStackMenu')}
        </button>
        <button type="button" role="menuitem" disabled={disabled} onClick={onWrapGrid}>
          {t('editor.hud.wrapGridMenu')}
        </button>
        {canUnwrap ? (
          <button type="button" role="menuitem" disabled={disabled} onClick={onUnwrap}>
            {t('editor.hud.unwrapMenu')}
          </button>
        ) : null}
        <button
          type="button"
          role="menuitem"
          disabled={disabled}
          onClick={() => onMoveLayer(1)}
        >
          {t('editor.hud.bringForwardMenu')}
        </button>
        <button
          type="button"
          role="menuitem"
          disabled={disabled}
          onClick={() => onMoveLayer(-1)}
        >
          {t('editor.hud.sendBackwardMenu')}
        </button>
        <button type="button" role="menuitem" disabled={disabled} onClick={onDuplicate}>
          {t('editor.hud.duplicateMenu')}
        </button>
        {!isMasterInstance && onCreateMaster ? (
          <button type="button" role="menuitem" disabled={disabled} onClick={onCreateMaster}>
            {t('editor.hud.createMasterMenu')}
          </button>
        ) : null}
        {isMasterInstance && onDetachMaster ? (
          <button type="button" role="menuitem" disabled={disabled} onClick={onDetachMaster}>
            {t('editor.hud.detachMenu')}
          </button>
        ) : null}
        <button
          type="button"
          role="menuitem"
          className="creation-canvas-floating-hud__overflow-danger"
          disabled={disabled}
          onClick={onDelete}
        >
          {t('editor.hud.deleteMenu')}
        </button>
      </div>
    </details>
  )
}

export function CanvasFloatingHud({
  selectedNode,
  selectedCount = 0,
  selectedIds,
  selectedNodes,
  workingRootId = null,
  isMasterInstance,
  smartHudEnabled: smartHudEnabledProp,
  readOnly = false,
  softLocked = false,
  pseudoState = 'default',
  onAddPrimitive,
  onWrapStack,
  onWrapGrid,
  onUnwrap,
  onGroupSelection,
  onDuplicate,
  onDelete,
  onMoveLayer,
  onDetachMaster,
  onCreateMaster,
  onAlignSelected,
  onDistributeSelected,
  onHudOps,
  onHudHostAction,
}: CanvasFloatingHudProps) {
  const t = useT()
  const smartHudEnabled = smartHudEnabledProp ?? isSmartHudEnabled()
  const inlineEditing = useInlineEditingFlag()
  const ids = selectedIds ?? (selectedNode ? [selectedNode.id] : [])
  const nodes = selectedNodes ?? (selectedNode ? [selectedNode] : [])
  const rootId = workingRootId ?? ''

  const model: HudModel = useMemo(
    () =>
      resolveHudModel({
        smartHudEnabled,
        selectedIds: ids,
        selectedNodes: nodes,
        workingRootId: rootId,
        primary: selectedNode,
        inlineEditing,
        readOnly,
        softLocked,
        pseudoState,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stabilize on id/fingerprint
    [
      smartHudEnabled,
      ids.join(','),
      nodes.map((n) => `${n.id}:${n.type}:${JSON.stringify(n.props)}:${JSON.stringify(n.tokenBindings)}`).join('|'),
      rootId,
      selectedNode?.id,
      inlineEditing,
      readOnly,
      softLocked,
      pseudoState,
    ],
  )

  const stripSlots = useMemo(() => filterHudStripSlots(model.slots), [model.slots])
  const legacySelection = !smartHudEnabled && selectedNode
  const count = selectedCount || ids.length
  const multiSmart = model.mode === 'multi' && model.showSmart
  const laneSig = useRef('')
  useEffect(() => {
    const lane = model.showSmart
      ? 'smart'
      : model.showArtboard
        ? 'artboard'
        : model.showInsert
          ? 'insert'
          : model.showAlignGroup
            ? 'align'
            : 'structure'
    const sig = `${model.mode}:${lane}:${model.familyId ?? ''}:${model.slots.length}`
    if (sig === laneSig.current) return
    laneSig.current = sig
    trackHudEvent({
      name: 'hud_lane_shown',
      lane,
      familyId: model.familyId,
      slotCount: model.slots.length,
    })
    trackHudEvent({
      name: 'hud_insert_collapsed',
      collapsed: !model.showInsert && model.mode !== 'legacy',
    })
  }, [model.mode, model.showSmart, model.showArtboard, model.showInsert, model.showAlignGroup, model.familyId, model.slots.length])

  const emitHudOps = (ops: SceneOp[]) => {
    if (!onHudOps) return
    if (!ops.length) {
      trackHudEvent({ name: 'hud_slot_reject', reason: 'empty_ops' })
      return
    }
    const key =
      'key' in ops[0]! && typeof (ops[0] as { key?: string }).key === 'string'
        ? (ops[0] as { key: string }).key
        : ops[0]!.op
    trackHudEvent({
      name: 'hud_slot_commit',
      familyId: model.familyId,
      key,
      source: ops[0]!.op,
    })
    if (multiSmart && nodes.length > 1) {
      onHudOps(fanOutHudOpsToSelection(ops, nodes))
      return
    }
    onHudOps(ops)
  }

  return (
    <div
      className="creation-canvas-floating-hud"
      data-testid="canvas-floating-hud"
      data-hud-mode={model.mode}
      role="toolbar"
      aria-label={t('editor.hud.toolbar')}
    >
      {model.mode === 'legacy' || model.showInsert ? (
        <div className="creation-canvas-floating-hud__group" data-testid="hud-insert-lane">
          <ChromeTip tip={t('editor.hud.addStack')}>
            <button
              type="button"
              className="creation-canvas-floating-hud__btn"
              onClick={() => onAddPrimitive('Stack')}
            >
              <Square className="creation-canvas-floating-hud__icon" />
              <span className="creation-canvas-floating-hud__key">F</span>
            </button>
          </ChromeTip>
          <ChromeTip tip={t('editor.hud.addText')}>
            <button
              type="button"
              className="creation-canvas-floating-hud__btn"
              onClick={() => onAddPrimitive('SiteText')}
            >
              <Type className="creation-canvas-floating-hud__icon" />
              <span className="creation-canvas-floating-hud__key">T</span>
            </button>
          </ChromeTip>
          <ChromeTip tip={t('editor.hud.addButton')}>
            <button
              type="button"
              className="creation-canvas-floating-hud__btn"
              onClick={() => onAddPrimitive('Button')}
            >
              <span className="creation-canvas-floating-hud__badge-b">B</span>
              <span className="creation-canvas-floating-hud__key">B</span>
            </button>
          </ChromeTip>
          <ChromeTip tip={t('editor.hud.addImage')}>
            <button
              type="button"
              className="creation-canvas-floating-hud__btn"
              onClick={() => onAddPrimitive('SiteImage')}
            >
              <ImageIcon className="creation-canvas-floating-hud__icon" />
              <span className="creation-canvas-floating-hud__key">I</span>
            </button>
          </ChromeTip>
          <ChromeTip tip={t('editor.hud.addGrid')}>
            <button
              type="button"
              className="creation-canvas-floating-hud__btn"
              onClick={() => onAddPrimitive('Grid')}
            >
              <Grid2X2 className="creation-canvas-floating-hud__icon" />
              <span className="creation-canvas-floating-hud__key">G</span>
            </button>
          </ChromeTip>
        </div>
      ) : null}

      {/* Legacy selection strip */}
      {legacySelection ? (
        <>
          <div className="creation-canvas-floating-hud__divider" />
          <div className="creation-canvas-floating-hud__group creation-canvas-floating-hud__selection">
            <div className="creation-canvas-floating-hud__node-tag">
              <span className="creation-canvas-floating-hud__node-icon">
                {paletteTypeIcon(selectedNode.type)}
              </span>
              <span className="creation-canvas-floating-hud__node-name">
                {selectedNode.name || selectedNode.type}
              </span>
              {isMasterInstance ? (
                <span className="creation-canvas-floating-hud__instance-pill">{t('editor.hud.instance')}</span>
              ) : null}
            </div>
                        <ChromeTip tip={t('editor.hud.wrapStack')}>
            <button
              type="button"
              className="creation-canvas-floating-hud__btn"
              onClick={onWrapStack}
            >
              <FolderPlus className="creation-canvas-floating-hud__icon" />
              <span>{t('editor.hud.stack')}</span>
            </button>
            </ChromeTip>
                        <ChromeTip tip={t('editor.hud.wrapGrid')}>
            <button
              type="button"
              className="creation-canvas-floating-hud__btn"
              onClick={onWrapGrid}
            >
              <Grid2X2 className="creation-canvas-floating-hud__icon" />
              <span>{t('editor.hud.grid')}</span>
            </button>
            </ChromeTip>
            {onUnwrap &&
            ((selectedNode.children && selectedNode.children.length > 0) ||
              ['Stack', 'Grid', 'Container', 'Card'].includes(selectedNode.type)) ? (
                            <ChromeTip tip={t('editor.hud.unwrap')}>
              <button
                type="button"
                className="creation-canvas-floating-hud__btn"
                onClick={onUnwrap}
              >
                <Ungroup className="creation-canvas-floating-hud__icon" />
                <span>{t('editor.hud.unwrapLabel')}</span>
              </button>
              </ChromeTip>
            ) : null}
                        <ChromeTip tip={t('editor.hud.bringForward')}>
            <button
              type="button"
              className="creation-canvas-floating-hud__btn"
              onClick={() => onMoveLayer(1)}
            >
              <ArrowUpToLine className="creation-canvas-floating-hud__icon" />
            </button>
            </ChromeTip>
                        <ChromeTip tip={t('editor.hud.sendBackward')}>
            <button
              type="button"
              className="creation-canvas-floating-hud__btn"
              onClick={() => onMoveLayer(-1)}
            >
              <ArrowDownToLine className="creation-canvas-floating-hud__icon" />
            </button>
            </ChromeTip>
                        <ChromeTip tip={t('editor.hud.duplicate')}>
            <button
              type="button"
              className="creation-canvas-floating-hud__btn"
              onClick={onDuplicate}
            >
              <Copy className="creation-canvas-floating-hud__icon" />
            </button>
            </ChromeTip>
            {!isMasterInstance && onCreateMaster ? (
                            <ChromeTip tip={t('editor.hud.createMaster')}>
              <button
                type="button"
                className="creation-canvas-floating-hud__btn"
                onClick={onCreateMaster}
              >
                <Diamond className="creation-canvas-floating-hud__icon" />
                <span>{t('editor.hud.master')}</span>
              </button>
              </ChromeTip>
            ) : null}
            {isMasterInstance && onDetachMaster ? (
                            <ChromeTip tip={t('editor.hud.detachInstance')}>
              <button
                type="button"
                className="creation-canvas-floating-hud__btn creation-canvas-floating-hud__btn--detach"
                onClick={onDetachMaster}
              >
                <Scissors className="creation-canvas-floating-hud__icon" />
                <span>{t('editor.hud.detach')}</span>
              </button>
              </ChromeTip>
            ) : null}
                        <ChromeTip tip={t('editor.hud.deleteLayer')}>
            <button
              type="button"
              className="creation-canvas-floating-hud__btn creation-canvas-floating-hud__btn--danger"
              onClick={onDelete}
            >
              <Trash2 className="creation-canvas-floating-hud__icon" />
            </button>
            </ChromeTip>
          </div>
        </>
      ) : null}

      {/* Smart / artboard slots */}
      {smartHudEnabled && selectedNode && (model.showSmart || model.showArtboard) ? (
        <>
          <div className="creation-canvas-floating-hud__divider" />
          <div
            className="creation-canvas-floating-hud__group creation-canvas-floating-hud__smart"
            data-testid="hud-smart-lane"
            data-family={model.familyId ?? undefined}
            data-multi={multiSmart ? 'true' : undefined}
          >
            <div className="creation-canvas-floating-hud__node-tag">
              <span className="creation-canvas-floating-hud__node-icon">
                {paletteTypeIcon(selectedNode.type)}
              </span>
              <span className="creation-canvas-floating-hud__node-name">
                {multiSmart
                  ? t('editor.hud.selectedCount', { count: nodes.length })
                  : selectedNode.name || selectedNode.type}
              </span>
              <span
                className="creation-canvas-floating-hud__family"
                data-testid="hud-family-label"
                title={
                  multiSmart
                    ? model.familyId
                      ? t('editor.hud.multiIntersectionFamily', { family: model.familyId })
                      : t('editor.hud.multiIntersection')
                    : t('editor.hud.smartFamily', { family: model.familyId ?? '' })
                }
              >
                {multiSmart ? model.familyId ?? t('editor.hud.multi') : model.familyId}
              </span>
              {isMasterInstance && !multiSmart ? (
                <span className="creation-canvas-floating-hud__instance-pill">{t('editor.hud.instance')}</span>
              ) : null}
              {model.pseudoState && model.pseudoState !== 'default' ? (
                <span
                  className="creation-canvas-floating-hud__instance-pill"
                  data-testid="hud-pseudo-state-pill"
                  title={t('editor.hud.editingPseudo', { state: model.pseudoState })}
                >
                  :{model.pseudoState}
                </span>
              ) : null}
            </div>
            {model.emptySmartFallback ? (
              <span className="creation-canvas-floating-hud__hint" data-testid="hud-empty-smart">
                {t('editor.hud.inspectForMore')}
              </span>
            ) : null}
            {stripSlots.map((slot) => (
              <SmartSlotControl
                key={slot.key}
                node={selectedNode}
                slot={slot}
                disabled={!model.mutateEnabled}
                onOps={emitHudOps}
                onHostAction={onHudHostAction}
                valueOverride={
                  multiSmart ? readHudMultiSlotValue(nodes, slot) : undefined
                }
              />
            ))}
          </div>
        </>
      ) : null}

      {smartHudEnabled && model.showStructureOverflow ? (
        <>
          <div className="creation-canvas-floating-hud__divider" />
          <StructureOverflow
            t={t}
            selectedNode={selectedNode}
            isMasterInstance={isMasterInstance}
            disabled={!model.mutateEnabled}
            showInsertOverflow={model.showInsertOverflow}
            onAddPrimitive={onAddPrimitive}
            onWrapStack={onWrapStack}
            onWrapGrid={onWrapGrid}
            onUnwrap={onUnwrap}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            onMoveLayer={onMoveLayer}
            onDetachMaster={onDetachMaster}
            onCreateMaster={onCreateMaster}
          />
        </>
      ) : null}

      {count > 1 ? (
        <>
          <div className="creation-canvas-floating-hud__divider" />
          <div className="creation-canvas-floating-hud__group">
                        <ChromeTip tip={t('editor.hud.groupSelection')}>
            <button
              type="button"
              className="creation-canvas-floating-hud__btn"
              onClick={onGroupSelection || onWrapStack}
            >
              <Group className="creation-canvas-floating-hud__icon" />
              <span>{t('editor.hud.group')}</span>
            </button>
            </ChromeTip>
          </div>
          {onAlignSelected && onDistributeSelected ? (
            <MultiAlignToolbar
              selectedCount={count}
              onAlign={onAlignSelected}
              onDistribute={onDistributeSelected}
            />
          ) : null}
        </>
      ) : null}
    </div>
  )
}
