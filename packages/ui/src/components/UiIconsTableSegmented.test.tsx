import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import {
  IconBordersAll,
  IconBordersNone,
  IconBordersRow,
  IconDensityComfortable,
  IconDensityCompact,
  IconDensityDefault,
} from './UiIconsWave3'

describe('table segmented UI icons (Wave C)', () => {
  it('density trio uses distinct row rhythms', () => {
    const fingerprint = (root: HTMLElement) =>
      Array.from(root.querySelectorAll('path, rect'))
        .map((p) => p.getAttribute('d') ?? `${p.tagName}:${p.getAttribute('y')}`)
        .join('|')

    const { container: compact } = render(<IconDensityCompact />)
    const { container: def } = render(<IconDensityDefault />)
    const { container: comfort } = render(<IconDensityComfortable />)

    expect(fingerprint(compact)).not.toBe(fingerprint(def))
    expect(fingerprint(def)).not.toBe(fingerprint(comfort))
    expect(compact.querySelectorAll('path').length).toBe(4)
    expect(def.querySelectorAll('path').length).toBe(3)
    expect(comfort.querySelectorAll('rect').length).toBe(3)
  })

  it('borders trio: soft none · row rule · full grid', () => {
    const { container: none } = render(<IconBordersNone />)
    const { container: row } = render(<IconBordersRow />)
    const { container: all } = render(<IconBordersAll />)

    expect(none.querySelectorAll('.ds-ui-icon__stroke--soft').length).toBe(1)
    expect(row.querySelectorAll('path').length).toBe(1)
    expect(all.querySelectorAll('path').length).toBe(1)
    expect(all.querySelector('path')?.getAttribute('d') ?? '').toContain('M8')
  })
})
