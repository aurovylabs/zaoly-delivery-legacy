import { describe, expect, it } from 'vitest'
import {
  canInlineEditCanvasNode,
  isInlineLabelShellType,
  isTextLeafNodeType,
  preferTighterTextBounds,
  unionClientRectsToBounds,
} from '../lib/scene/text-ink-bounds'

describe('text-ink-bounds (text leaf hug)', () => {
  it('recognizes text leaf types', () => {
    expect(isTextLeafNodeType('Text')).toBe(true)
    expect(isTextLeafNodeType('Heading')).toBe(true)
    expect(isTextLeafNodeType('SiteText')).toBe(true)
    expect(isTextLeafNodeType('SiteLink')).toBe(true)
    expect(isTextLeafNodeType('Stack')).toBe(false)
  })

  it('allows inline edit on string-label shells (SiteButton) but not slotted shells', () => {
    expect(isInlineLabelShellType('SiteButton')).toBe(true)
    expect(
      canInlineEditCanvasNode({
        type: 'SiteButton',
        props: { children: 'Get started' },
      }),
    ).toBe(true)
    expect(
      canInlineEditCanvasNode({
        type: 'SiteButton',
        locked: true,
        props: { children: 'Get started' },
      }),
    ).toBe(false)
    expect(
      canInlineEditCanvasNode({
        type: 'Button',
        props: { children: 'Button' },
        children: [{ type: 'Text', props: { slot: 'label', children: 'Button' } }],
      }),
    ).toBe(false)
    expect(canInlineEditCanvasNode({ type: 'SiteStack', props: {} })).toBe(false)
  })

  it('unions client rects relative to viewport', () => {
    const bounds = unionClientRectsToBounds(
      [
        { left: 110, top: 220, right: 160, bottom: 250, width: 50, height: 30 },
        { left: 160, top: 225, right: 190, bottom: 248, width: 30, height: 23 },
      ],
      { left: 100, top: 200 },
    )
    expect(bounds).toEqual({ left: 10, top: 20, width: 80, height: 30 })
  })

  it('prefers meaningfully tighter ink over layout line-box', () => {
    const layout = { left: 0, top: 0, width: 120, height: 100 }
    const ink = { left: 0, top: 0, width: 80, height: 42 }
    expect(preferTighterTextBounds(layout, ink)).toEqual(ink)
    expect(preferTighterTextBounds(layout, null)).toEqual(layout)
    expect(
      preferTighterTextBounds(layout, { left: 0, top: 0, width: 118, height: 98 }),
    ).toEqual(layout)
  })
})
