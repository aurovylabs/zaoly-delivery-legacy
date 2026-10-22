/** Throttle helper for presence cursor heartbeats (P114). */

export type ThrottleHandle = {
  (fn: () => void): void
  setIntervalMs: (ms: number) => void
  getIntervalMs: () => number
}

export function createThrottle(ms: number): ThrottleHandle {
  let interval = ms
  let last = 0
  let timer: ReturnType<typeof setTimeout> | null = null
  let pending: (() => void) | null = null

  const throttle = ((fn: () => void) => {
    const now = Date.now()
    const remaining = interval - (now - last)
    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      pending = null
      last = now
      fn()
      return
    }
    pending = fn
    if (timer) return
    timer = setTimeout(() => {
      timer = null
      last = Date.now()
      const run = pending
      pending = null
      run?.()
    }, remaining)
  }) as ThrottleHandle

  throttle.setIntervalMs = (next: number) => {
    interval = Math.max(0, next)
  }
  throttle.getIntervalMs = () => interval

  return throttle
}

/** Adaptive cursor heartbeat interval from remote peer count on the scene. */
export function cursorThrottleMsForPeerCount(remotePeerCount: number): number {
  if (remotePeerCount >= 10) return 250
  if (remotePeerCount >= 5) return 200
  return 120
}

export const LIVENESS_VISIBLE_MS = 5_000
export const LIVENESS_HIDDEN_MS = 30_000

/** Cursor heartbeats only while the document/app is visible/active. */
export function shouldSendCursorHeartbeat(visible: boolean): boolean {
  return visible
}
