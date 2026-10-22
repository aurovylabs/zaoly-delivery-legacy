import { describe, expect, it } from 'vitest'
import { printTableFromProps } from '../lib/scene/print-table'

describe('printTableFromProps', () => {
  it('uses the magazine fixture when columns are missing', () => {
    expect(printTableFromProps({})).toEqual({
      columns: ['Metric', 'Now'],
      rows: [
        ['GEO', 72],
        ['Pages', 8],
      ],
    })
  })

  it('coerces undefined cells to null so PrintTable rows type-check', () => {
    const table = printTableFromProps({
      columns: ['Metric', 'Now'],
      rows: [['GEO', undefined], ['Pages', 8]],
    })
    expect(table.rows).toEqual([
      ['GEO', null],
      ['Pages', 8],
    ])
  })
})
