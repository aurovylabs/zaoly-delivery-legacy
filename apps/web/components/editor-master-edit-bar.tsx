'use client'

/**
 * Always-visible Master-Edit chrome: exit + board dimension SSOT.
 * Spec: specs/domain/master-edit-board-dimension.md
 * knowledge/master-edit-exit-chrome.md · knowledge/master-edit-board-dimension.md
 */
import { Button, IconArrowLeft, Text, ToggleGroup } from '../lib/zaoly-ui'

export type MasterEditBarVariant = { id: string; name: string }

export type MasterEditBoardDimension = 'variants' | 'breakpoints' | 'matrix'

export function EditorMasterEditBar({
  masterName,
  variantName,
  variants,
  activeVariantId,
  onSelectVariant,
  boardDimension = 'variants',
  onBoardDimensionChange,
  dimensionVariantsLabel,
  dimensionBreakpointsLabel,
  dimensionMatrixLabel,
  breakpointsStructureTip,
  editingLabel,
  exitLabel,
  onExit,
  placement = 'canvas',
}: {
  masterName: string
  /** Active board cell — clarifies which variant is the edit scope. */
  variantName?: string | null
  /** Named variants — chip strip when dimension = breakpoints (canvas only). */
  variants?: MasterEditBarVariant[]
  activeVariantId?: string | null
  onSelectVariant?: (variantId: string) => void
  /** Unified board axis — Variants | Breakpoints | Matrix. */
  boardDimension?: MasterEditBoardDimension
  onBoardDimensionChange?: (next: MasterEditBoardDimension) => void
  dimensionVariantsLabel?: string
  dimensionBreakpointsLabel?: string
  dimensionMatrixLabel?: string
  /** Shown under the bar when dimension = breakpoints or matrix. */
  breakpointsStructureTip?: string
  editingLabel: string
  exitLabel: string
  onExit: () => void
  /** Canvas column top vs left Layers rail (enterMasterEdit lands on Layers). */
  placement?: 'canvas' | 'rail'
}) {
  const compareMode =
    boardDimension === 'breakpoints' || boardDimension === 'matrix'
  const aria = variantName?.trim()
    ? `${editingLabel}: ${masterName} · ${variantName.trim()}`
    : `${editingLabel}: ${masterName}`
  const rootClass = [
    'creation-editor-master-edit-bar',
    placement === 'rail' ? 'creation-editor-master-edit-bar--rail' : '',
    compareMode ? 'creation-editor-master-edit-bar--compare' : '',
  ]
    .filter(Boolean)
    .join(' ')
  const showDimension = Boolean(onBoardDimensionChange)
  const showStrip =
    boardDimension === 'breakpoints' &&
    Boolean(onSelectVariant) &&
    (variants?.length ?? 0) >= 2 &&
    placement === 'canvas'
  return (
    <div
      className={rootClass}
      data-testid={
        placement === 'rail' ? 'editor-master-edit-bar-rail' : 'editor-master-edit-bar'
      }
      data-placement={placement}
      data-board-dimension={boardDimension}
      data-compare={compareMode ? 'true' : undefined}
      role="status"
      aria-label={aria}
    >
      <div className="creation-editor-master-edit-bar__row">
        <div className="creation-editor-master-edit-bar__copy">
          <Text role="meta" as="p" className="creation-editor-master-edit-bar__title">
            {editingLabel}
          </Text>
          <span className="creation-editor-master-edit-bar__name" title={masterName}>
            {masterName}
          </span>
          {!showStrip && variantName?.trim() ? (
            <span
              className="creation-editor-master-edit-bar__variant"
              data-testid="editor-master-edit-active-variant"
            >
              {variantName.trim()}
            </span>
          ) : null}
        </div>
        {showDimension ? (
          <div
            className="creation-editor-master-edit-bar__dimension"
            data-testid="editor-master-edit-board-dimension"
          >
            <ToggleGroup
              aria-label={
                dimensionBreakpointsLabel
                  ? `${dimensionVariantsLabel} / ${dimensionBreakpointsLabel} / ${dimensionMatrixLabel ?? 'Matrix'}`
                  : editingLabel
              }
              value={boardDimension}
              onChange={(next) => {
                if (
                  next === 'variants' ||
                  next === 'breakpoints' ||
                  next === 'matrix'
                ) {
                  onBoardDimensionChange?.(next)
                }
              }}
              options={[
                {
                  value: 'variants',
                  label: dimensionVariantsLabel ?? 'Variants',
                },
                {
                  value: 'breakpoints',
                  label: dimensionBreakpointsLabel ?? 'Breakpoints',
                },
                {
                  value: 'matrix',
                  label: dimensionMatrixLabel ?? 'Matrix',
                },
              ]}
            />
          </div>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="primary"
          icon={<IconArrowLeft size={14} strokeWidth={1.75} aria-hidden />}
          data-testid={
            placement === 'rail' ? 'editor-master-edit-back-rail' : 'editor-master-edit-back'
          }
          onClick={onExit}
        >
          {exitLabel}
        </Button>
      </div>
      {showStrip ? (
        <div
          className="creation-editor-master-edit-bar__variants"
          data-testid="editor-master-edit-variant-strip"
          role="tablist"
          aria-label={dimensionVariantsLabel ?? 'Variants'}
        >
          {variants!.map((v) => {
            const active = v.id === activeVariantId
            return (
              <button
                key={v.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={
                  active
                    ? 'creation-editor-master-edit-bar__variant-chip creation-editor-master-edit-bar__variant-chip--active'
                    : 'creation-editor-master-edit-bar__variant-chip'
                }
                data-testid="editor-master-edit-variant-chip"
                data-variant-id={v.id}
                onClick={() => onSelectVariant?.(v.id)}
              >
                {v.name}
              </button>
            )
          })}
        </div>
      ) : null}
      {compareMode && breakpointsStructureTip ? (
        <Text
          role="meta"
          as="p"
          className="creation-editor-master-edit-bar__tip"
          data-testid="editor-master-edit-breakpoints-tip"
        >
          {breakpointsStructureTip}
        </Text>
      ) : null}
    </div>
  )
}
