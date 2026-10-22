/**
 * WYSIWYG Phase 2 — PrintTable canvas grain typography + Mag flatten adapter.
 */
import { describe, expect, it } from 'vitest'
import type { SceneNode } from '@zaoly/contracts'
import { flattenPrintNode } from '../lib/magazine-pdf/flatten-print-node'
import { resolveMagInstancePaint } from '../lib/magazine-pdf/resolve-mag-instance-paint'
import { INSPECT_TOKEN_CATALOG } from '../lib/inspect/token-catalog'
import { PRINT_GRAIN_VARS, printSurfaceGrainPaint } from '../lib/scene/print-surface-grain'

function printTable(props: Record<string, unknown>): SceneNode {
  return {
    id: 'pt',
    type: 'PrintTable',
    props: {
      headers: ['Metric', 'Now'],
      rows: [['GEO', '72']],
      ...props,
    },
  }
}

describe('WYSIWYG-P2 PrintTable grain + Mag flatten', () => {
  it('forwards shell typography via grain CSS vars', () => {
    const grain = printSurfaceGrainPaint({
      width: '240px',
      textAlign: 'right',
      alignSelf: 'flex-end',
      fontSize: '14px',
      fontWeight: 700,
      textDecoration: 'underline',
      textTransform: 'uppercase',
    })
    expect(grain.typography).toBe(true)
    expect(grain.wrapStyle[PRINT_GRAIN_VARS.fontSize as keyof typeof grain.wrapStyle]).toBe('14px')
    expect(grain.wrapStyle[PRINT_GRAIN_VARS.textDecoration as keyof typeof grain.wrapStyle]).toBe(
      'underline',
    )
    expect(grain.wrapStyle[PRINT_GRAIN_VARS.textAlign as keyof typeof grain.wrapStyle]).toBe('right')
    expect(grain.blockAlign).toBe(true)
  })

  it('Mag paint + flatten keep width, alignSelf, textAlign, type on PrintTable', () => {
    const node = printTable({
      width: '200px',
      alignSelf: 'flex-end',
      textAlign: 'right',
      fontSize: '16px',
      textDecoration: 'underline',
      fontFamily: 'NotoSans',
    })
    const paint = resolveMagInstancePaint(node, INSPECT_TOKEN_CATALOG)
    expect(paint.wrapStyle?.width).toBe(150) // 200 * 0.75
    expect(paint.wrapStyle?.alignSelf).toBe('flex-end')
    expect(paint.textStyle).toMatchObject({
      textAlign: 'right',
      fontSize: 12, // 16 * 0.75
      textDecoration: 'underline',
    })
    expect(String(paint.textStyle?.fontFamily ?? '')).toMatch(/NotoSans/i)

    const parts = flattenPrintNode(node, { catalog: INSPECT_TOKEN_CATALOG })
    expect(parts.length).toBeGreaterThan(0)
    // MagTable receives cellStyle via typed adapter (smoke: no throw + paint complete).
    expect(paint.textStyle?.textDecoration).toBe('underline')
  })
})
