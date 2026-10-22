import { afterEach, describe, expect, it, vi } from 'vitest'
import { paths } from '../lib/paths'

describe('hud telemetry', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('no-ops when telemetry env is off (default)', async () => {
    vi.stubEnv(paths.envHudTelemetry, '')
    const { trackHudEvent } = await import('../lib/inspect/hud-telemetry')
    const spy = vi.fn()
    window.addEventListener(paths.hudTelemetryEvent, spy)
    trackHudEvent({
      name: 'hud_lane_shown',
      lane: 'smart',
      familyId: 'text',
      slotCount: 4,
    })
    expect(spy).not.toHaveBeenCalled()
    window.removeEventListener(paths.hudTelemetryEvent, spy)
  })

  it('dispatches CustomEvent when telemetry env is on', async () => {
    vi.stubEnv(paths.envHudTelemetry, '1')
    const { trackHudEvent } = await import('../lib/inspect/hud-telemetry')
    const spy = vi.fn()
    window.addEventListener(paths.hudTelemetryEvent, spy)
    trackHudEvent({
      name: 'hud_slot_commit',
      familyId: 'text',
      key: 'color',
      source: 'set_token_binding',
    })
    expect(spy).toHaveBeenCalledTimes(1)
    const detail = (spy.mock.calls[0]![0] as CustomEvent).detail as Record<string, unknown>
    expect(detail.name).toBe('hud_slot_commit')
    expect(detail.key).toBe('color')
    expect(detail.familyId).toBe('text')
    expect(typeof detail.t).toBe('number')
    window.removeEventListener(paths.hudTelemetryEvent, spy)
  })
})
