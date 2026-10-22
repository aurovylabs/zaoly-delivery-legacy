import { describe, expect, it } from 'vitest'
import {
  buildTokenBindOps,
  encodeBrandTokenDragPayload,
  parseBrandTokenDragPayload,
  planTokenDrop,
} from '../lib/inspect/token-drop'

describe('token-drop (CT-19)', () => {
  it('encodes and parses MIME payload', () => {
    const raw = encodeBrandTokenDragPayload({ path: 'color.action.primary', type: 'color' })
    expect(parseBrandTokenDragPayload(raw)).toEqual({
      path: 'color.action.primary',
      type: 'color',
    })
    expect(parseBrandTokenDragPayload('not-json')).toBeNull()
  })

  it('plans color → background on SiteStack, color on SiteText', () => {
    const stack = planTokenDrop('color', 'SiteStack')
    expect(stack.ok).toBe(true)
    if (stack.ok) {
      expect(stack.keys).toEqual(['background'])
      expect(stack.label).toMatch(/fill|background/i)
    }
    const text = planTokenDrop('color', 'SiteText')
    expect(text.ok).toBe(true)
    if (text.ok) expect(text.keys).toEqual(['color'])
  })

  it('plans spacing → gap when present', () => {
    const plan = planTokenDrop('spacing', 'SiteStack')
    expect(plan.ok).toBe(true)
    if (plan.ok) expect(plan.keys).toEqual(['gap'])
  })

  it('plans typography → all facet keys on SiteText', () => {
    const plan = planTokenDrop('typography', 'SiteText')
    expect(plan.ok).toBe(true)
    if (plan.ok) {
      expect(plan.keys).toContain('fontFamily')
      expect(plan.label).toBe('Bind type')
    }
  })

  it('rejects unsupported types', () => {
    expect(planTokenDrop('shadow', 'SiteStack').ok).toBe(false)
    expect(planTokenDrop('asset', 'SiteStack').ok).toBe(false)
  })

  it('builds set_prop + set_token_binding ops', () => {
    const ops = buildTokenBindOps('n1', ['background'], 'color.neutral.100')
    expect(ops).toEqual([
      { op: 'set_prop', nodeId: 'n1', key: 'background', value: '' },
      {
        op: 'set_token_binding',
        nodeId: 'n1',
        key: 'background',
        tokenPath: 'color.neutral.100',
      },
    ])
  })
})
