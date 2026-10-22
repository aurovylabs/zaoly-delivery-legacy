import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { CompositionScene, SceneNode } from '@zaoly/contracts'
import { cascadeNodeForBreakpoint } from '../lib/scene/cascade'
import { isBreakpointSecondary } from '../lib/scene/breakpoint-visibility'
import {
  rematerializeScenePrimary,
  resolvePrimaryBreakpoint,
} from '../lib/scene/primary-breakpoint'
import { applySceneOp } from '../lib/scene/ops'
import { invertSceneOps } from '../lib/scene/invert-scene-ops'

function leaf(id: string, extra: Partial<SceneNode> = {}): SceneNode {
  return { id, type: 'SiteText', props: { text: id, gap: 'md' }, children: [], ...extra }
}

function sceneOf(child: SceneNode, primary?: 'desktop' | 'tablet' | 'mobile'): CompositionScene {
  return {
    id: 's',
    name: 't',
    version: 1,
    root: { id: 'root', type: 'SiteStack', children: [child] },
    updatedAt: new Date().toISOString(),
    ...(primary ? { primaryBreakpoint: primary } : {}),
  }
}

describe('Wave H set-as-primary', () => {
  it('resolves omitted primary as desktop', () => {
    expect(resolvePrimaryBreakpoint({})).toBe('desktop')
    expect(resolvePrimaryBreakpoint({ primaryBreakpoint: 'tablet' })).toBe('tablet')
  })

  it('rematerializes so paint stays identical across digital BPs', () => {
    const node = leaf('a', {
      props: { text: 'desk', gap: 'md' },
      breakpoints: {
        tablet: { props: { text: 'tab' } },
        mobile: { props: { text: 'mob' } },
      },
    })
    const before = sceneOf(node)
    const after = rematerializeScenePrimary(before, 'tablet')
    expect(after.primaryBreakpoint).toBe('tablet')
    const next = after.root.children![0]!
    for (const bp of ['desktop', 'tablet', 'mobile'] as const) {
      const oldV = cascadeNodeForBreakpoint(node, bp, 'desktop').props.text
      const newV = cascadeNodeForBreakpoint(next, bp, 'tablet').props.text
      expect(newV).toBe(oldV)
    }
    expect(isBreakpointSecondary('desktop', 'tablet')).toBe(true)
    expect(isBreakpointSecondary('tablet', 'tablet')).toBe(false)
  })

  it('applies set_primary_breakpoint op and undoes via invert', () => {
    const before = sceneOf(
      leaf('a', {
        props: { text: 'd' },
        breakpoints: { tablet: { props: { text: 't' } } },
      }),
    )
    const op = { op: 'set_primary_breakpoint' as const, breakpoint: 'tablet' as const }
    const applied = applySceneOp(before, op)
    expect(applied.ok).toBe(true)
    if (!applied.ok) return
    expect(applied.scene.primaryBreakpoint).toBe('tablet')
    const inverse = invertSceneOps(before, [op], applied.scene)
    expect(inverse).not.toBeNull()
    let restored = applied.scene
    for (const inv of inverse!) {
      const r = applySceneOp(restored, inv)
      expect(r.ok).toBe(true)
      if (r.ok) restored = r.scene
    }
    expect(resolvePrimaryBreakpoint(restored)).toBe('desktop')
    expect(cascadeNodeForBreakpoint(restored.root.children![0]!, 'tablet', 'desktop').props.text).toBe(
      't',
    )
  })

  it('resize/align write to base when active BP is the configured primary', async () => {
    const { planResizeOps } = await import('../lib/scene/resize')
    const { planSpatialAlignOps } = await import('../lib/scene/spatial-align')
    const node = leaf('r', { props: { text: 'x' }, style: { width: 100, height: 40 } })
    const resizeOnPrimary = planResizeOps(
      node,
      { width: 200, height: 40 },
      { width: 100, height: 40 },
      'tablet',
      'tablet',
    )
    expect(resizeOnPrimary.some((o) => o.op === 'set_style')).toBe(true)
    expect(resizeOnPrimary.every((o) => o.op !== 'set_breakpoint_override')).toBe(true)

    const resizeOnSecondary = planResizeOps(
      node,
      { width: 200, height: 40 },
      { width: 100, height: 40 },
      'desktop',
      'tablet',
    )
    expect(resizeOnSecondary.some((o) => o.op === 'set_breakpoint_override')).toBe(true)

    const align = planSpatialAlignOps(
      [
        { node, box: { left: 0, top: 0, width: 40, height: 20 } },
        {
          node: leaf('r2'),
          box: { left: 80, top: 0, width: 40, height: 20 },
        },
      ],
      'left',
      'tablet',
      1,
      'tablet',
    )
    expect(align.some((o) => o.op === 'set_prop')).toBe(true)
  })

  it('magazine / site-kit serialize respect scene primary', async () => {
    const { materializeSceneForMagazine } = await import(
      '../lib/scene/materialize-for-magazine'
    )
    const { serializeSiteKitComposition } = await import('../lib/site-kit/sync-tree')
    const node = leaf('a', {
      props: { text: 'desk', textAlign: 'left' },
      breakpoints: {
        tablet: { props: { text: 'tab', textAlign: 'center' } },
        print: { props: { text: 'print-lane' } },
      },
    })
    const remapped = rematerializeScenePrimary(sceneOf(node), 'tablet')
    const mag = materializeSceneForMagazine(remapped)
    expect(mag.root.children![0]!.props?.text).toBe('print-lane')

    const kitDesktop = serializeSiteKitComposition(remapped.root.children![0]!, {
      breakpoint: 'desktop',
      primaryBreakpoint: 'tablet',
    })
    expect(kitDesktop.style?.textAlign).toBe('left')
    const kitTablet = serializeSiteKitComposition(remapped.root.children![0]!, {
      breakpoint: 'tablet',
      primaryBreakpoint: 'tablet',
    })
    expect(kitTablet.style?.textAlign).toBe('center')
  })

  it('documents Wave H spec and supersedes closeout non-goal', () => {
    const root = path.resolve(__dirname, '../../..')
    const spec = readFileSync(
      path.join(root, 'specs/domain/responsive-breakpoint-set-primary.md'),
      'utf8',
    )
    const closeout = readFileSync(
      path.join(root, 'specs/domain/responsive-breakpoint-closeout.md'),
      'utf8',
    )
    expect(spec).toContain('set_primary_breakpoint')
    expect(spec).toContain('Wave H')
    expect(closeout).toContain('responsive-breakpoint-set-primary.md')
    const inspector = readFileSync(
      path.join(root, 'apps/web/components/editor-inspector/index.tsx'),
      'utf8',
    )
    expect(inspector).toContain('inspect-bp-set-primary')
    expect(inspector).toContain('setPrimaryBreakpointDone')
    const sceneState = readFileSync(
      path.join(root, 'apps/web/components/editor/use-editor-scene-state.ts'),
      'utf8',
    )
    expect(sceneState).toContain('breakpointPrimary')
    expect(sceneState).toContain('scenePrimaryBreakpoint ===')
  })
})
