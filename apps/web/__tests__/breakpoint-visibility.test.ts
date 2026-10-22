import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { CompositionScene, SceneNode } from '@zaoly/contracts'
import {
  cascadeNodeHidden,
  isBreakpointSecondary,
  nodeHasBreakpointOverrides,
  planBreakpointAwareInsertVisibility,
  planBreakpointAwareRemove,
  planBreakpointAwareToggleHidden,
  planResetBreakpointOverrides,
  secondaryRemoveIsHideOnly,
  secondaryStructureLockedReason,
} from '../lib/scene/breakpoint-visibility'
import { applySceneOp } from '../lib/scene/ops'

function leaf(id: string, extra: Partial<SceneNode> = {}): SceneNode {
  return { id, type: 'SiteText', props: { text: id }, children: [], ...extra }
}

function sceneWith(child: SceneNode): CompositionScene {
  return {
    id: 's',
    name: 't',
    root: { id: 'root', type: 'SiteStack', children: [child] },
    revision: 1,
  }
}

describe('breakpoint visibility (Wave D)', () => {
  it('treats tablet/mobile as secondary', () => {
    expect(isBreakpointSecondary('tablet')).toBe(true)
    expect(isBreakpointSecondary('mobile')).toBe(true)
    expect(isBreakpointSecondary('desktop')).toBe(false)
    expect(isBreakpointSecondary('print')).toBe(false)
  })

  it('cascades BP hidden over base', () => {
    const node = leaf('n', {
      breakpoints: { tablet: { hidden: true } },
    })
    expect(cascadeNodeHidden(node, 'desktop')).toBe(false)
    expect(cascadeNodeHidden(node, 'tablet')).toBe(true)
    expect(cascadeNodeHidden(node, 'mobile')).toBe(false)

    const baseHidden = leaf('n2', {
      hidden: true,
      breakpoints: { mobile: { hidden: false } },
    })
    expect(cascadeNodeHidden(baseHidden, 'desktop')).toBe(true)
    expect(cascadeNodeHidden(baseHidden, 'mobile')).toBe(false)
    expect(cascadeNodeHidden(baseHidden, 'tablet')).toBe(true)
  })

  it('secondary delete hides; primary removes; orphan removes', () => {
    const shared = leaf('a')
    expect(planBreakpointAwareRemove(shared, 'desktop')[0]?.op).toBe('remove_node')
    const hide = planBreakpointAwareRemove(shared, 'tablet')
    expect(hide).toEqual([
      { op: 'set_breakpoint_override', nodeId: 'a', breakpoint: 'tablet', hidden: true },
    ])
    expect(secondaryRemoveIsHideOnly(hide)).toBe(true)
    expect(
      secondaryRemoveIsHideOnly([{ op: 'remove_node', nodeId: 'a' }]),
    ).toBe(false)

    const mobileOnly = leaf('b', {
      hidden: true,
      breakpoints: { mobile: { hidden: false } },
    })
    expect(planBreakpointAwareRemove(mobileOnly, 'mobile')[0]?.op).toBe('remove_node')
    expect(
      secondaryRemoveIsHideOnly(planBreakpointAwareRemove(mobileOnly, 'mobile')),
    ).toBe(false)
  })

  it('documents secondary hide toast key in structure + locales', () => {
    const root = path.resolve(__dirname, '../../..')
    const structure = readFileSync(
      path.join(root, 'apps/web/components/editor/use-editor-structure.ts'),
      'utf8',
    )
    const en = JSON.parse(
      readFileSync(path.join(root, 'apps/web/locales/en.json'), 'utf8'),
    ) as { editor: Record<string, string> }
    const de = JSON.parse(
      readFileSync(path.join(root, 'apps/web/locales/de.json'), 'utf8'),
    ) as { editor: Record<string, string> }
    expect(structure).toContain('secondaryRemoveIsHideOnly')
    expect(structure).toContain("t('editor.secondaryDeleteHidden'")
    expect(structure).toContain('pushToast')
    expect(en.editor.secondaryDeleteHidden).toMatch(/Hidden on \{bp\}/)
    expect(de.editor.secondaryDeleteHidden).toMatch(/Auf \{bp\} ausgeblendet/)
  })

  it('secondary insert visibility ops + apply', () => {
    const ops = planBreakpointAwareInsertVisibility('x', 'mobile')
    expect(ops).toEqual([
      { op: 'set_flags', nodeId: 'x', hidden: true },
      {
        op: 'set_breakpoint_override',
        nodeId: 'x',
        breakpoint: 'mobile',
        hidden: false,
      },
    ])
    expect(planBreakpointAwareInsertVisibility('x', 'desktop')).toEqual([])

    let scene = sceneWith(leaf('x'))
    for (const op of ops) {
      const r = applySceneOp(scene, op)
      expect(r.ok).toBe(true)
      if (r.ok) scene = r.scene
    }
    const node = scene.root.children![0]!
    expect(node.hidden).toBe(true)
    expect(node.breakpoints?.mobile?.hidden).toBe(false)
    expect(cascadeNodeHidden(node, 'desktop')).toBe(true)
    expect(cascadeNodeHidden(node, 'mobile')).toBe(false)
  })

  it('toggle hidden on secondary writes BP lane', () => {
    const node = leaf('t')
    expect(planBreakpointAwareToggleHidden(node, 'tablet')).toEqual({
      op: 'set_breakpoint_override',
      nodeId: 't',
      breakpoint: 'tablet',
      hidden: true,
    })
    expect(planBreakpointAwareToggleHidden(node, 'desktop')).toEqual({
      op: 'set_flags',
      nodeId: 't',
      hidden: true,
    })
  })

  it('set_breakpoint_override accepts hidden-only', () => {
    let scene = sceneWith(leaf('h'))
    const r = applySceneOp(scene, {
      op: 'set_breakpoint_override',
      nodeId: 'h',
      breakpoint: 'tablet',
      hidden: true,
    })
    expect(r.ok).toBe(true)
    if (r.ok) scene = r.scene
    expect(scene.root.children![0]!.breakpoints?.tablet?.hidden).toBe(true)
  })

  it('preserves hidden when merging props on same lane', () => {
    let scene = sceneWith(
      leaf('p', { breakpoints: { tablet: { hidden: true } } }),
    )
    const r = applySceneOp(scene, {
      op: 'set_breakpoint_override',
      nodeId: 'p',
      breakpoint: 'tablet',
      props: { gap: 'sm' },
    })
    expect(r.ok).toBe(true)
    if (r.ok) scene = r.scene
    const lane = scene.root.children![0]!.breakpoints?.tablet
    expect(lane?.hidden).toBe(true)
    expect(lane?.props?.gap).toBe('sm')
  })

  it('documents the Wave D spec', () => {
    const spec = readFileSync(
      path.join(
        __dirname,
        '../../../specs/domain/responsive-breakpoint-primary-secondary.md',
      ),
      'utf8',
    )
    expect(spec).toContain('Wave D')
    expect(spec).toContain('cascadeHidden')
    expect(spec).toContain('set_breakpoint_override')
  })

  it('Wave E reset clears secondary lane and is no-op on desktop', () => {
    const node = leaf('r', {
      breakpoints: {
        tablet: { props: { gap: 'sm' }, hidden: true },
      },
    })
    expect(nodeHasBreakpointOverrides(node, 'tablet')).toBe(true)
    expect(nodeHasBreakpointOverrides(node, 'desktop')).toBe(false)
    expect(planResetBreakpointOverrides([node], 'desktop')).toEqual([])
    const ops = planResetBreakpointOverrides([node], 'tablet')
    expect(ops).toEqual([
      { op: 'clear_breakpoint_override', nodeId: 'r', breakpoint: 'tablet' },
    ])
    let scene = sceneWith(node)
    const r = applySceneOp(scene, ops[0]!)
    expect(r.ok).toBe(true)
    if (r.ok) scene = r.scene
    expect(scene.root.children![0]!.breakpoints?.tablet).toBeUndefined()
  })

  it('documents the Wave E reset spec', () => {
    const spec = readFileSync(
      path.join(__dirname, '../../../specs/domain/responsive-breakpoint-reset.md'),
      'utf8',
    )
    expect(spec).toContain('Wave E')
    expect(spec).toContain('clear_breakpoint_override')
    expect(spec).toContain('inspect-bp-reset')
  })

  it('Wave F locks structure on secondary only', () => {
    expect(secondaryStructureLockedReason('tablet')).toBe('secondary-structure-locked')
    expect(secondaryStructureLockedReason('mobile')).toBe('secondary-structure-locked')
    expect(secondaryStructureLockedReason('desktop')).toBeNull()
    expect(secondaryStructureLockedReason('print')).toBeNull()
  })

  it('documents the Wave F structure-lock spec', () => {
    const spec = readFileSync(
      path.join(
        __dirname,
        '../../../specs/domain/responsive-breakpoint-structure-lock.md',
      ),
      'utf8',
    )
    expect(spec).toContain('Wave F')
    expect(spec).toContain('secondaryStructureLocked')
    expect(spec).toContain('reorder')
  })
})
