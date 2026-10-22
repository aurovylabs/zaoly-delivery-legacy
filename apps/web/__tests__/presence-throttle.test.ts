import { describe, expect, it, vi } from 'vitest'
import {
  createThrottle,
  cursorThrottleMsForPeerCount,
  shouldSendCursorHeartbeat,
  LIVENESS_HIDDEN_MS,
  LIVENESS_VISIBLE_MS,
} from '../lib/editor/presence-throttle'

describe('presence throttle Wave A', () => {
  it('maps peer count to adaptive cursor budgets', () => {
    expect(cursorThrottleMsForPeerCount(0)).toBe(120)
    expect(cursorThrottleMsForPeerCount(4)).toBe(120)
    expect(cursorThrottleMsForPeerCount(5)).toBe(200)
    expect(cursorThrottleMsForPeerCount(9)).toBe(200)
    expect(cursorThrottleMsForPeerCount(10)).toBe(250)
    expect(cursorThrottleMsForPeerCount(99)).toBe(250)
  })

  it('gates cursor heartbeats on visibility', () => {
    expect(shouldSendCursorHeartbeat(true)).toBe(true)
    expect(shouldSendCursorHeartbeat(false)).toBe(false)
  })

  it('exposes visible vs hidden liveness budgets', () => {
    expect(LIVENESS_VISIBLE_MS).toBe(5_000)
    expect(LIVENESS_HIDDEN_MS).toBe(30_000)
  })

  it('allows mutating throttle interval', () => {
    vi.useFakeTimers()
    const calls: number[] = []
    const throttle = createThrottle(120)
    expect(throttle.getIntervalMs()).toBe(120)
    throttle(() => calls.push(1))
    throttle.setIntervalMs(200)
    expect(throttle.getIntervalMs()).toBe(200)
    vi.advanceTimersByTime(50)
    throttle(() => calls.push(2))
    vi.advanceTimersByTime(200)
    expect(calls.length).toBeGreaterThanOrEqual(1)
    vi.useRealTimers()
  })
})
