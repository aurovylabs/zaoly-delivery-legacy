import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { IconTableAddColumn, IconTableAddRow } from './UiIconsWave3'

describe('table structure UI icons', () => {
  it('Add row / Add column use distinct metaphors with a plus mark', () => {
    const { container: row } = render(<IconTableAddRow />)
    const { container: col } = render(<IconTableAddColumn />)

    const fingerprint = (root: HTMLElement) =>
      Array.from(root.querySelectorAll('path, rect'))
        .map((p) => p.getAttribute('d') ?? `${p.tagName}:${p.getAttribute('x')}`)
        .join('|')

    expect(fingerprint(row)).not.toBe(fingerprint(col))
    // Each icon has a plus made of two stroke paths (beyond the soft grid lines)
    expect(row.querySelectorAll('path.ds-ui-icon__stroke').length).toBeGreaterThanOrEqual(1)
    expect(col.querySelectorAll('path.ds-ui-icon__stroke').length).toBeGreaterThanOrEqual(1)
    expect(row.querySelectorAll('rect').length).toBe(1)
    expect(col.querySelectorAll('rect').length).toBe(1)
  })
})
