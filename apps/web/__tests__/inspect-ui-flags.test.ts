import { describe, expect, it } from 'vitest'
import { INSPECT_INTERACTIVE_STATE_BAR_ENABLED } from '../lib/inspect/inspect-ui-flags'

describe('inspect UI flags', () => {
  it('keeps interactive state bar gated off until product revisit', () => {
    expect(INSPECT_INTERACTIVE_STATE_BAR_ENABLED).toBe(false)
  })
})
