/**
 * Opt-in Smart HUD telemetry (no PII).
 * Spec: `specs/domain/canvas-smart-hud.md` · Knowledge: `knowledge/canvas-smart-hud.md`
 */
import { paths } from '../paths'
import { isHudTelemetryEnabled } from '../runtime-config'

export type HudTelemetryEvent =
  | {
      name: 'hud_lane_shown'
      lane: string
      familyId: string | null
      slotCount: number
    }
  | {
      name: 'hud_slot_commit'
      familyId: string | null
      key: string
      source: string
    }
  | {
      name: 'hud_slot_reject'
      reason: string
    }
  | {
      name: 'hud_insert_collapsed'
      collapsed: boolean
    }

/** Fire-and-forget; no-ops unless `NEXT_PUBLIC_ZAOLY_HUD_TELEMETRY` is on. */
export function trackHudEvent(event: HudTelemetryEvent): void {
  if (typeof window === 'undefined') return
  if (!isHudTelemetryEnabled()) return
  try {
    window.dispatchEvent(
      new CustomEvent(paths.hudTelemetryEvent, {
        detail: { ...event, t: Date.now() },
      }),
    )
  } catch {
    // ignore
  }
}
