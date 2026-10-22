import { describe, expect, it } from 'vitest'
import { paths } from '../lib/paths'
import {
  isPickerDummyDisabled,
  mapCollectionsToPickerOptions,
} from '../lib/collection-picker-options'

const DEPOSIT = paths.zaolyDepositPlatformProjectId

describe('collection picker options', () => {
  it('maps federation collections and pins Zaoly using the Plexon label', () => {
    const options = mapCollectionsToPickerOptions(
      [
        { id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', name: 'Other Co' },
        { id: DEPOSIT, name: 'Zaoly Studio' },
        { id: 'bbbbbbbb-cccc-4ddd-8eee-ffffffffffff', name: 'Beta' },
      ],
      DEPOSIT,
      'pinned',
    )
    expect(options[0]).toEqual({
      value: DEPOSIT,
      label: 'Zaoly Studio · pinned',
      pinned: true,
    })
    expect(options.map((o) => o.value)).toEqual([
      DEPOSIT,
      'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
      'bbbbbbbb-cccc-4ddd-8eee-ffffffffffff',
    ])
    expect(options.some((o) => o.label === 'Zaoly')).toBe(false)
  })

  it('skips blank ids and does not invent a name-only Zaoly row', () => {
    const options = mapCollectionsToPickerOptions(
      [{ id: ' ', name: 'Ghost' }, { id: 'cccccccc-dddd-4eee-8fff-000000000000', name: 'Gamma' }],
      DEPOSIT,
      'pinned',
    )
    expect(options).toHaveLength(1)
    expect(options[0]?.pinned).toBe(false)
    expect(options[0]?.label).toBe('Gamma')
  })

  it('treats federation_mode_dummy as picker-disabled', () => {
    expect(isPickerDummyDisabled('federation_mode_dummy')).toBe(true)
    expect(isPickerDummyDisabled('plexon_not_configured')).toBe(false)
    expect(isPickerDummyDisabled(null)).toBe(false)
  })
})
