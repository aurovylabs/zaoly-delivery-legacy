import { describe, expect, it } from 'vitest'
import type { SceneNode } from '@zaoly/contracts'
import {
  literalFieldValue,
  tokenBindingForPicker,
} from '../lib/inspect/inspector-field-values'
import type { InspectFieldDef } from '../lib/inspect/field-catalog'
import { cascadeNodeForBreakpoint } from '../lib/scene/cascade'

const weightField: InspectFieldDef = {
  name: 'fontWeight',
  label: 'Weight',
  kind: 'token',
  tokenGroup: 'fontWeight',
  section: 'typography',
  appliesTo: '*',
}

describe('inspector field values', () => {
  it('tokenBindingForPicker masks inherited bindings when a literal is set', () => {
    expect(tokenBindingForPicker('typography.body.family', '700')).toBeNull()
    expect(tokenBindingForPicker('typography.body.family', '')).toBe('typography.body.family')
    expect(tokenBindingForPicker('', 'Lato')).toBeNull()
  })

  it('literalFieldValue reads unbound box-model leftovers from style', () => {
    const padField: InspectFieldDef = {
      name: 'padding',
      label: 'Padding',
      kind: 'token',
      tokenGroup: 'space',
      section: 'layout',
      appliesTo: '*',
    }
    const minField: InspectFieldDef = {
      name: 'minHeight',
      label: 'Min height',
      kind: 'token',
      tokenGroup: 'size',
      section: 'layout',
      appliesTo: '*',
    }
    const node: SceneNode = {
      id: 'stack',
      type: 'SiteStack',
      style: { padding: '1.5rem', minHeight: '16rem' },
    }
    const cascaded = cascadeNodeForBreakpoint(node, 'desktop')
    expect(literalFieldValue(node, padField, cascaded)).toBe('1.5rem')
    expect(literalFieldValue(node, minField, cascaded)).toBe('16rem')
  })

  it('literalFieldValue prefers Instance override props over empty', () => {
    const node: SceneNode = {
      id: 'inst',
      type: 'SiteText',
      instanceOf: 'master-SiteText',
      props: { fontWeight: '700' },
      tokenBindings: { fontWeight: 'typography.body.family' },
    }
    const cascaded = cascadeNodeForBreakpoint(node, 'desktop')
    expect(literalFieldValue(node, weightField, cascaded)).toBe('700')
  })
})
