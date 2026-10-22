'use client'

/**
 * Inspect interactive pseudo-state switcher + override banner.
 * Spec: `specs/domain/editor-inspect.md` · `canvas-smart-hud.md` W4
 */
import type { SceneNode, SceneOp, SceneStateId } from '@zaoly/contracts'
import { INSPECT_INTERACTIVE_STATE_BAR_ENABLED } from '../../lib/inspect/inspect-ui-flags'
import { writesToStateOverride } from '../../lib/scene/state-cascade'
import { useInteractiveState } from '../../lib/inspect/interactive-state-context'

const STATE_CHIPS: { id: SceneStateId; label: string }[] = [
  { id: 'default', label: 'Default' },
  { id: 'hover', label: 'Hover' },
  { id: 'focus', label: 'Focus' },
  { id: 'active', label: 'Active' },
  { id: 'disabled', label: 'Disabled' },
]

export function InspectorStateBar({
  node,
  onOps,
}: {
  node: SceneNode | null
  onOps: (ops: SceneOp[]) => void
}) {
  const { activeState, setActiveState } = useInteractiveState()
  if (!INSPECT_INTERACTIVE_STATE_BAR_ENABLED) return null
  if (!node) return null

  const editingOverride = writesToStateOverride(activeState)
  const hasActiveOverride =
    editingOverride && Boolean(node.states?.[activeState as Exclude<SceneStateId, 'default'>])
  const hasAnyInteractive =
    Boolean(node.states?.hover) ||
    Boolean(node.states?.focus) ||
    Boolean(node.states?.active) ||
    Boolean(node.states?.disabled)

  return (
    <div className="creation-inspect-state">
      <div
        className="creation-inspect-state__bar"
        data-testid="editor-inspect-state-bar"
        role="toolbar"
        aria-label="Interactive state"
      >
        {STATE_CHIPS.map((chip) => {
          const has =
            chip.id !== 'default' && Boolean(node.states?.[chip.id as Exclude<SceneStateId, 'default'>])
          const selected = activeState === chip.id
          const label = has ? `${chip.label} •` : chip.label
          return (
            <button
              key={chip.id}
              type="button"
              className={`creation-inspect-state__chip${selected ? ' creation-inspect-state__chip--on' : ''}`}
              aria-pressed={selected}
              onClick={() => setActiveState(chip.id)}
            >
              {label}
            </button>
          )
        })}
      </div>
      {editingOverride ? (
        <div
          className="creation-inspect-state__banner"
          data-testid="editor-state-override-banner"
          role="status"
        >
          <span>
            Editing <code>:{activeState}</code>
            {hasAnyInteractive ? ' · canvas previews this state' : ''}
          </span>
          {hasActiveOverride ? (
            <button
              type="button"
              data-testid="editor-reset-state-btn"
              className="creation-inspect-state__reset"
              onClick={() =>
                onOps([
                  {
                    op: 'clear_state_override',
                    nodeId: node.id,
                    state: activeState as Exclude<SceneStateId, 'default'>,
                  },
                ])
              }
            >
              Reset State
            </button>
          ) : null}
        </div>
      ) : null}
      {!hasAnyInteractive ? (
        <p className="creation-inspect-state__hint" data-testid="editor-state-variants-hint">
          Pseudo-states (:hover …) apply to interactive atoms (Button, Link, Input…). Named looks
          (Primary / Ghost) are Master variants — not this bar.
        </p>
      ) : null}
    </div>
  )
}
