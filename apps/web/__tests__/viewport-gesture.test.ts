import { describe, expect, it, vi } from 'vitest'
import { createRafViewportCommit } from '../lib/editor/viewport-gesture'

describe('viewport-gesture (Wave 7 / P83)', () => {
  it('createRafViewportCommit batches multiple updates into one apply per frame', async () => {
    vi.useFakeTimers()
    let current = { zoom: 1, panX: 0, panY: 0 }
    const applied: Array<{ zoom: number; panX: number; panY: number }> = []
    const commit = createRafViewportCommit(
      () => current,
      (next) => {
        current = next
        applied.push(next)
      },
    )

    commit({ panX: 10 })
    commit({ panY: 20 })
    commit({ panX: 15 })
    expect(applied).toHaveLength(0)

    await vi.runAllTimersAsync()
    expect(applied).toHaveLength(1)
    expect(applied[0]).toEqual({ zoom: 1, panX: 15, panY: 20 })

    vi.useRealTimers()
  })
})
