import { describe, expect, it } from 'vitest'
import { hudPrettyOptionLabel } from '../components/hud-slot-value-chip'

describe('hudPrettyOptionLabel', () => {
  it('prefers option labels and shortens token paths', () => {
    expect(
      hudPrettyOptionLabel(
        [
          { value: '16px', label: '16' },
          { value: '24px', label: '24' },
        ],
        '24px',
      ),
    ).toBe('24')
    expect(hudPrettyOptionLabel(undefined, 'typography.body.family')).toBe('family')
    expect(hudPrettyOptionLabel(undefined, '')).toBe('—')
  })
})
