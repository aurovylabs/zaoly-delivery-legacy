import { describe, expect, it } from 'vitest'
import { contractPropsForType } from '@zaoly/contracts'
import type { SceneNode } from '@zaoly/contracts'
import { catalogForMagPaint, resolveMagInstancePaint } from '../lib/magazine-pdf/resolve-mag-instance-paint'
import { flattenPrintNode } from '../lib/magazine-pdf/flatten-print-node'
import { printSurfaceGrainPaint, PRINT_GRAIN_VARS } from '../lib/scene/print-surface-grain'

function findMagTable(node: unknown): Record<string, unknown> | undefined {
  if (!node || typeof node !== 'object') return undefined
  const el = node as { type?: { name?: string }; props?: Record<string, unknown> }
  const name = typeof el.type === 'function' ? el.type.name : (el.type as { name?: string })?.name
  if (name === 'MagTable' && el.props) return el.props
  const kids = (el as { props?: { children?: unknown } }).props?.children
  const list = Array.isArray(kids) ? kids : kids != null ? [kids] : []
  for (const k of list) {
    const hit = findMagTable(k)
    if (hit) return hit
  }
  return undefined
}

function geoTable(props: Record<string, unknown>): SceneNode {
  return {
    id: 'tbl',
    type: 'PrintTable',
    props,
    children: [
      { id: 'c0', type: 'Text', props: { slot: 'label', children: 'Metric' } },
      { id: 'c1', type: 'Text', props: { slot: 'label', children: 'Now' } },
      {
        id: 'r1',
        type: 'RankedRow',
        children: [
          { id: 'l', type: 'Text', props: { slot: 'label', children: 'GEO' } },
          { id: 'v', type: 'Text', props: { slot: 'value', children: '72' } },
        ],
      },
    ],
  }
}

describe('P91 PrintTable block align (alignSelf) vs cell textAlign', () => {
  it('exposes alignItems, textAlign, and gap on PrintTable', () => {
    const names = contractPropsForType('PrintTable').map((p) => p.name)
    expect(names).toContain('alignItems')
    expect(names).toContain('textAlign')
    expect(names).toContain('gap')
  })

  it('alignSelf parks the block — does not invent cell textAlign', () => {
    const catalog = catalogForMagPaint(null)
    const paint = resolveMagInstancePaint(geoTable({ alignSelf: 'flex-end' }), catalog)
    expect(paint.wrapStyle?.alignSelf).toBe('flex-end')
    expect(paint.textStyle?.textAlign).toBeUndefined()
    const parts = flattenPrintNode(geoTable({ alignSelf: 'flex-end' }), { catalog })
    expect(findMagTable(parts[0])?.fit).toBe('hug')
    expect(findMagTable(parts[0])?.cellStyle).toBeUndefined()
  })

  it('explicit textAlign still paints cells while stretch-fitting', () => {
    const catalog = catalogForMagPaint(null)
    const paint = resolveMagInstancePaint(geoTable({ textAlign: 'right' }), catalog)
    expect(paint.textStyle?.textAlign).toBe('right')
    expect(paint.wrapStyle?.alignSelf).toBeUndefined()
    const parts = flattenPrintNode(geoTable({ textAlign: 'right' }), { catalog })
    expect(findMagTable(parts[0])?.fit).toBe('stretch')
    expect(findMagTable(parts[0])?.cellStyle).toMatchObject({ textAlign: 'right' })
  })

  it('canvas grain parks block via margin auto; does not mirror alignSelf to text-align', () => {
    const painted = printSurfaceGrainPaint({ alignSelf: 'flex-end' })
    expect(painted.blockAlign).toBe(true)
    expect(painted.textAlign).toBe(false)
    expect((painted.wrapStyle as Record<string, string>).marginLeft).toBe('auto')
    expect((painted.wrapStyle as Record<string, string>).width).toBe('max-content')
    expect((painted.wrapStyle as Record<string, string>)[PRINT_GRAIN_VARS.textAlign]).toBeUndefined()
  })

  it('alignItems still mirrors to cell text-align grain', () => {
    const painted = printSurfaceGrainPaint({ alignItems: 'center' })
    expect(painted.textAlign).toBe(true)
    expect((painted.wrapStyle as Record<string, string>)[PRINT_GRAIN_VARS.textAlign]).toBe('center')
  })
})
