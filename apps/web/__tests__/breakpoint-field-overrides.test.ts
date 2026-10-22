import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { SceneNode } from '@zaoly/contracts'
import {
  breakpointsWithFieldOverride,
  elsewhereBreakpointsForField,
} from '../lib/scene/breakpoint-field-overrides'

function nodeWithOverrides(): SceneNode {
  return {
    id: 'n1',
    type: 'Stack',
    name: 'Stack',
    props: { gap: 'md', direction: 'row' },
    breakpoints: {
      mobile: {
        props: { direction: 'column', gap: 'sm' },
        tokenBindings: { padding: 'space.2' },
      },
      tablet: {
        props: { gap: 'lg' },
      },
      print: {
        props: { direction: 'column' },
      },
    },
  }
}

describe('breakpoint field overrides (Inspect Wave B)', () => {
  it('lists lanes that override a prop or token binding key', () => {
    const n = nodeWithOverrides()
    expect(breakpointsWithFieldOverride(n, 'gap')).toEqual(['mobile', 'tablet'])
    expect(breakpointsWithFieldOverride(n, 'direction')).toEqual(['mobile', 'print'])
    expect(breakpointsWithFieldOverride(n, 'padding')).toEqual(['mobile'])
    expect(breakpointsWithFieldOverride(n, 'width')).toEqual([])
  })

  it('excludes the active breakpoint from elsewhere chips (Desktop shows all)', () => {
    const n = nodeWithOverrides()
    expect(elsewhereBreakpointsForField([n], 'gap', 'desktop')).toEqual(['mobile', 'tablet'])
    expect(elsewhereBreakpointsForField([n], 'gap', 'mobile')).toEqual(['tablet'])
    expect(elsewhereBreakpointsForField([n], 'gap', 'tablet')).toEqual(['mobile'])
  })

  it('unions elsewhere BPs across multi-select', () => {
    const a = nodeWithOverrides()
    const b: SceneNode = {
      id: 'n2',
      type: 'Stack',
      name: 'B',
      props: {},
      breakpoints: {
        print: { props: { gap: 'xs' } },
      },
    }
    expect(elsewhereBreakpointsForField([a, b], 'gap', 'desktop')).toEqual([
      'mobile',
      'tablet',
      'print',
    ])
  })

  it('wires Inspect field badges and documents the spec', () => {
    const root = path.resolve(__dirname, '../../..')
    const renderer = readFileSync(
      path.join(root, 'apps/web/components/editor-inspector/use-inspector-field-renderer.tsx'),
      'utf8',
    )
    const badges = readFileSync(
      path.join(root, 'apps/web/components/editor-inspector/inspect-bp-elsewhere-badges.tsx'),
      'utf8',
    )
    const workspace = readFileSync(
      path.join(root, 'apps/web/components/editor-workspace.tsx'),
      'utf8',
    )
    const spec = readFileSync(
      path.join(root, 'specs/domain/editor-inspect.md'),
      'utf8',
    )
    const en = JSON.parse(
      readFileSync(path.join(root, 'apps/web/locales/en.json'), 'utf8'),
    ) as { editor: Record<string, string> }
    expect(renderer).toContain('elsewhereBreakpointsForField')
    expect(renderer).toContain('InspectBpElsewhereBadges')
    expect(renderer).toContain('onBreakpointChange')
    expect(badges).toContain('inspect-bp-elsewhere-chip')
    expect(workspace).toContain('onBreakpointChange={onBreakpointChange}')
    expect(spec).toContain('inspect-bp-elsewhere-chip')
    expect(en.editor.bpElsewhereTip).toContain('{bps}')
    expect(en.editor.bpElsewhereJumpTip.toLowerCase()).toContain('click')
  })
})
