import { describe, expect, it } from 'vitest'
import type { CompositionScene, SceneNode } from '@zaoly/contracts'
import { applySceneOp } from '../lib/scene/ops'
import { expandInstanceNode, INSTANCE_TYPE } from '../lib/scene/expand-instances'
import { buildHudTokenWriteOps } from '../lib/inspect/resolve-hud-model'
import { resolveNodePaintStyle } from '../lib/inspect/resolve-bindings'
import { INSPECT_TOKEN_CATALOG } from '../lib/inspect/token-catalog'
import { render, screen } from '@testing-library/react'
import { HudTokenField } from '../components/hud-token-field'
import { TokenCatalogProvider } from '../lib/inspect/token-catalog-context'

function sceneWithTextInstance(): CompositionScene {
  const masterRoot: SceneNode = {
    id: 'master-SiteText-root',
    type: 'SiteText',
    name: 'Text',
    props: { children: 'Hello', role: 'body' },
    // Deposit Masters bake resolved CSS on `style` alongside bindings — paint must
    // still let Instance override props win (HUD weight/size/family).
    style: {
      fontFamily: "'Noto Sans JP', 'Noto Sans', system-ui, sans-serif",
      fontSize: '0.78rem',
      fontWeight: '400',
    },
    tokenBindings: {
      fontFamily: 'typography.body.family',
      fontSize: 'typography.body.family',
      fontWeight: 'typography.body.family',
    },
  }
  return {
    id: 's1',
    version: 1,
    root: {
      id: 'page',
      type: 'Frame',
      name: 'Page',
      children: [
        {
          id: 'pattern-features-forms-body',
          type: INSTANCE_TYPE,
          name: 'Text',
          instanceOf: 'master-SiteText',
        },
      ],
    },
    masters: [{ id: 'master-SiteText', name: 'Text', sourceKey: 'SiteText', root: masterRoot }],
  }
}

describe('Instance HUD literal writes', () => {
  it('set_prop + clear_token_binding batch commits when Master owns the binding', () => {
    let scene = sceneWithTextInstance()
    const ops = buildHudTokenWriteOps(
      expandInstanceNode(scene.root.children![0]!, scene.masters),
      'fontFamily',
      { kind: 'literal', value: 'Lato' },
    )
    expect(ops).toEqual([
      { op: 'set_prop', nodeId: 'pattern-features-forms-body', key: 'fontFamily', value: 'Lato' },
    ])

    for (const op of ops) {
      const result = applySceneOp(scene, op)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      scene = result.scene
    }

    const inst = scene.root.children![0]!
    expect(inst.instanceOverrides?.props?.fontFamily).toBe('Lato')
    expect(inst.instanceOverrides?.tokenBindings?.fontFamily).toBeUndefined()

    const expanded = expandInstanceNode(inst, scene.masters)
    const paint = resolveNodePaintStyle(
      expanded.props,
      expanded.tokenBindings,
      expanded.style,
      INSPECT_TOKEN_CATALOG,
    )
    expect(paint.fontFamily).toMatch(/Lato/)
  })

  it('fontWeight literal batch commits on Instance without clear_token_binding', () => {
    let scene = sceneWithTextInstance()
    const ops = buildHudTokenWriteOps(
      expandInstanceNode(scene.root.children![0]!, scene.masters),
      'fontWeight',
      { kind: 'literal', value: '700' },
    )
    expect(ops).toEqual([
      { op: 'set_prop', nodeId: 'pattern-features-forms-body', key: 'fontWeight', value: '700' },
    ])

    for (const op of ops) {
      const result = applySceneOp(scene, op)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      scene = result.scene
    }

    const inst = scene.root.children![0]!
    expect(inst.instanceOverrides?.props?.fontWeight).toBe('700')

    const expanded = expandInstanceNode(inst, scene.masters)
    const paint = resolveNodePaintStyle(
      expanded.props,
      expanded.tokenBindings,
      expanded.style,
      INSPECT_TOKEN_CATALOG,
    )
    expect(String(paint.fontWeight)).toBe('700')
    // Master baked style.fontWeight "400" must not pin the Instance.
    expect(expanded.style?.fontWeight).toBe('400')
  })

  it('Instance fontSize / fontFamily props beat Master baked style', () => {
    let scene = sceneWithTextInstance()
    for (const op of [
      ...buildHudTokenWriteOps(
        expandInstanceNode(scene.root.children![0]!, scene.masters),
        'fontSize',
        { kind: 'literal', value: '24px' },
      ),
      ...buildHudTokenWriteOps(
        expandInstanceNode(scene.root.children![0]!, scene.masters),
        'fontFamily',
        { kind: 'literal', value: 'Lato' },
      ),
    ]) {
      const result = applySceneOp(scene, op)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      scene = result.scene
    }
    const expanded = expandInstanceNode(scene.root.children![0]!, scene.masters)
    const paint = resolveNodePaintStyle(
      expanded.props,
      expanded.tokenBindings,
      expanded.style,
      INSPECT_TOKEN_CATALOG,
    )
    expect(paint.fontSize).toBe('24px')
    expect(paint.fontFamily).toMatch(/Lato/)
  })

  it('HUD chip prefers Instance prop literal over inherited Master binding', () => {
    const expanded: SceneNode = {
      id: 'pattern-features-forms-body',
      type: 'SiteText',
      name: 'Text',
      instanceOf: 'master-SiteText',
      props: {
        role: 'body',
        children: 'Input, Select, Textarea…',
        fontFamily: 'Lato',
      },
      tokenBindings: {
        fontFamily: 'typography.body.family',
        fontSize: 'typography.body.family',
      },
    }

    render(
      <TokenCatalogProvider catalog={INSPECT_TOKEN_CATALOG}>
        <HudTokenField
          node={expanded}
          slotKey="fontFamily"
          label="Font"
          tokenGroup="fontFamily"
        />
      </TokenCatalogProvider>,
    )

    expect(screen.getByTestId('hud-token-fontFamily').getAttribute('aria-label')).toMatch(
      /Font:\s*Lato/i,
    )
    expect(screen.getByTestId('hud-token-fontFamily').getAttribute('aria-label')).not.toMatch(
      /Body/i,
    )
  })
})
