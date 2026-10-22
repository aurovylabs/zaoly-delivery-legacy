import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { familyDef } from '../lib/inspect/hud-quick-slots'
import { resolveHudModel } from '../lib/inspect/resolve-hud-model'
import type { SceneNode } from '@zaoly/contracts'

const repoRoot = path.resolve(__dirname, '../../..')

function node(partial: Partial<SceneNode> & Pick<SceneNode, 'id' | 'type'>): SceneNode {
  return {
    children: [],
    ...partial,
  } as SceneNode
}

describe('inspector vs HUD layout ownership', () => {
  it('layoutStack HUD omits flex axis slots (Inspect owns them)', () => {
    const fam = familyDef('layoutStack')
    const keys = fam.slots.map((s) => s.key)
    expect(keys).toContain('gap')
    expect(keys).toContain('width')
    expect(keys).not.toContain('direction')
    expect(keys).not.toContain('justify')
    expect(keys).not.toContain('align')
    expect(keys).not.toContain('wrap')
  })

  it('resolved layoutStack model never surfaces direction/justify/align', () => {
    const root = node({ id: 'root', type: 'SiteStack' })
    const stack = node({
      id: 'stack',
      type: 'SiteStack',
      props: { direction: 'column', gap: 'md' },
    })
    const m = resolveHudModel({
      smartHudEnabled: true,
      selectedIds: [stack.id],
      selectedNodes: [stack],
      workingRootId: root.id,
      primary: stack,
    })
    const keys = m.slots.map((s) => s.key)
    expect(keys).toEqual(expect.arrayContaining(['gap', 'width']))
    expect(keys).not.toContain('direction')
    expect(keys).not.toContain('justify')
    expect(keys).not.toContain('align')
  })

  it('Inspector Design panel does not mount MultiAlignToolbar', () => {
    const panel = readFileSync(
      path.join(repoRoot, 'apps/web/components/editor-inspector/inspector-design-panel.tsx'),
      'utf8',
    )
    expect(panel).not.toContain('MultiAlignToolbar')
    expect(panel).not.toContain('onAlignSelected')
    const hud = readFileSync(
      path.join(repoRoot, 'apps/web/components/canvas-floating-hud.tsx'),
      'utf8',
    )
    expect(hud).toContain('MultiAlignToolbar')
  })

  it('ownership knowledge + inspect P92 are pinned', () => {
    const ownership = readFileSync(
      path.join(repoRoot, 'knowledge/inspector-hud-layout-ownership.md'),
      'utf8',
    )
    expect(ownership).toContain('Canvas Floating HUD only')
    expect(ownership).toContain('Flex layout')
    const inspect = readFileSync(
      path.join(repoRoot, 'specs/domain/editor-inspect.md'),
      'utf8',
    )
    expect(inspect).toContain('Canvas Floating HUD only')
    expect(inspect).toContain('inspector-hud-layout-ownership.md')
  })
})
