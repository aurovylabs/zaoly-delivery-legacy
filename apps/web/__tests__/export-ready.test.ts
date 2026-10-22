import { describe, expect, it } from 'vitest'
import type { SceneNode } from '@zaoly/contracts'
import { assessExportReady } from '../lib/codegen/export-ready'

describe('assessExportReady', () => {
  it('is ready when the tree has no blockers', () => {
    const root: SceneNode = {
      id: 'r',
      type: 'Stack',
      name: 'Ok',
      children: [
        {
          id: 't',
          type: 'Text',
          props: { text: 'Hello' },
          style: { color: '#ffffff' },
          tokenBindings: { color: 'brand.text.primary' },
        },
      ],
      style: { backgroundColor: '#000000' },
      tokenBindings: { backgroundColor: 'color.background' },
    }
    const report = assessExportReady(root)
    expect(report.ready).toBe(true)
    expect(report.blockers).toHaveLength(0)
  })

  it('blocks on empty button, missing alt, and unbound tokens', () => {
    const root: SceneNode = {
      id: 'r',
      type: 'Stack',
      style: { backgroundColor: '#000000' },
      children: [
        { id: 'b', type: 'Button', name: 'Empty', props: {} },
        {
          id: 'img',
          type: 'Image',
          name: 'Pic',
          props: { src: 'https://example.com/x.jpg' },
        },
        {
          id: 't',
          type: 'Text',
          name: 'Literal',
          props: { text: 'Hi' },
          style: { color: '#ffffff' },
        },
      ],
    }
    const report = assessExportReady(root)
    expect(report.ready).toBe(false)
    const codes = report.blockers.map((b) => b.code)
    expect(codes).toContain('A11Y-EMPTY-BUTTON')
    expect(codes).toContain('A11Y-ALT-MISSING')
    expect(codes).toContain('DS-TOKEN-UNBOUND')
  })
})
