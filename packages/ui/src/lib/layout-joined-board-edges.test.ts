import { describe, expect, it } from 'vitest'
import { layoutJoinedBoardEdges } from '../lib/layout-joined-board-edges'

describe('layoutJoinedBoardEdges', () => {
  it('marks first/last in row and last row for 12-col wraps', () => {
    const edges = layoutJoinedBoardEdges([
      { colSpan: 12 },
      { colSpan: 6 },
      { colSpan: 6 },
      { colSpan: 4 },
      { colSpan: 4 },
      { colSpan: 4 },
    ])
    expect(edges[0]).toEqual({ rowStart: true, rowEnd: true, lastRow: false })
    expect(edges[1]).toEqual({ rowStart: true, rowEnd: false, lastRow: false })
    expect(edges[2]).toEqual({ rowStart: false, rowEnd: true, lastRow: false })
    expect(edges[3]).toEqual({ rowStart: true, rowEnd: false, lastRow: true })
    expect(edges[4]).toEqual({ rowStart: false, rowEnd: false, lastRow: true })
    expect(edges[5]).toEqual({ rowStart: false, rowEnd: true, lastRow: true })
  })
})
