import { describe, expect, it } from 'vitest'
import type { CompositionScene, SceneNode } from '@zaoly/contracts'
import { lintCompositionScene, autoFixLintIssue } from '../lib/linter/scene-linter'
import { simulateNodeTreeI18n, pseudoLocalizeText } from '../lib/scene/i18n-simulator'

describe('P119: Extended A11y & WCAG 2.2 Linter', () => {
  it('detects interactive icon buttons without aria-label and auto-fixes them', () => {
    const iconBtnNode: SceneNode = {
      id: 'icon-btn-1',
      type: 'Button',
      name: 'IconButton',
      props: {
        icon: 'search',
      },
      children: [],
    }

    const scene: CompositionScene = {
      id: 'scene-test-a11y',
      name: 'A11y Test Scene',
      updatedAt: '2026-09-08T12:00:00.000Z',
      root: {
        id: 'root',
        type: 'Stack',
        name: 'Root',
        props: {},
        children: [iconBtnNode],
      },
    }

    const issues = lintCompositionScene(scene)
    const iconIssue = issues.find((i) => i.code === 'A11Y-ICON-NO-ARIA')
    expect(iconIssue).toBeDefined()
    expect(iconIssue?.severity).toBe('error')
    expect(iconIssue?.nodeId).toBe('icon-btn-1')

    if (iconIssue) {
      const ops = autoFixLintIssue(iconIssue, scene)
      expect(ops.length).toBeGreaterThan(0)
      expect(ops[0]).toEqual({
        op: 'set_prop',
        nodeId: 'icon-btn-1',
        key: 'aria-label',
        value: 'IconButton',
      })
    }
  })

  it('detects sub-44px touch target sizes and auto-fixes them', () => {
    const smallBtnNode: SceneNode = {
      id: 'small-btn',
      type: 'Button',
      name: 'CloseButton',
      props: {
        label: 'Close',
        height: '24px',
        width: '24px',
      },
      children: [],
    }

    const scene: CompositionScene = {
      id: 'scene-test-target',
      name: 'Target Scene',
      updatedAt: '2026-09-08T12:00:00.000Z',
      root: {
        id: 'root',
        type: 'Stack',
        name: 'Root',
        props: {},
        children: [smallBtnNode],
      },
    }

    const issues = lintCompositionScene(scene)
    const targetIssue = issues.find((i) => i.code === 'A11Y-TOUCH-TARGET-SMALL')
    expect(targetIssue).toBeDefined()
    expect(targetIssue?.severity).toBe('warning')

    if (targetIssue) {
      const ops = autoFixLintIssue(targetIssue, scene)
      expect(ops).toContainEqual({
        op: 'set_prop',
        nodeId: 'small-btn',
        key: 'minHeight',
        value: '44px',
      })
      expect(ops).toContainEqual({
        op: 'set_prop',
        nodeId: 'small-btn',
        key: 'minWidth',
        value: '44px',
      })
    }
  })

  it('detects positive discontinuous tabIndex and auto-fixes to tabIndex 0', () => {
    const badTabNode: SceneNode = {
      id: 'tab-jump-node',
      type: 'Card',
      name: 'CustomTab',
      props: {
        tabIndex: 5,
      },
      children: [],
    }

    const scene: CompositionScene = {
      id: 'scene-test-tab',
      name: 'Tab Scene',
      updatedAt: '2026-09-08T12:00:00.000Z',
      root: {
        id: 'root',
        type: 'Stack',
        name: 'Root',
        props: {},
        children: [badTabNode],
      },
    }

    const issues = lintCompositionScene(scene)
    const tabIssue = issues.find((i) => i.code === 'A11Y-TAB-ORDER-DISCONTINUOUS')
    expect(tabIssue).toBeDefined()
    expect(tabIssue?.severity).toBe('warning')

    if (tabIssue) {
      const ops = autoFixLintIssue(tabIssue, scene)
      expect(ops).toContainEqual({
        op: 'set_prop',
        nodeId: 'tab-jump-node',
        key: 'tabIndex',
        value: 0,
      })
    }
  })
})

describe('P120: i18n & RTL Stress-Testing Simulator', () => {
  it('pseudo-localizes strings with expansion ratio', () => {
    const text = 'Submit Order'
    const localized = pseudoLocalizeText(text, 1.35)
    expect(localized.length).toBeGreaterThan(text.length)
    expect(localized.startsWith('[')).toBe(true)
    expect(localized.endsWith(' !!!]')).toBe(true)
  })

  it('simulates node tree with pseudo-localization and RTL without mutating input', () => {
    const originalTree: SceneNode = {
      id: 'root',
      name: 'Root',
      component: 'Stack',
      props: {
        direction: 'row',
      },
      children: [
        {
          id: 'btn-1',
          name: 'Button',
          component: 'Button',
          props: {
            label: 'Save Changes',
          },
          children: [],
        },
      ],
    }

    const simulated = simulateNodeTreeI18n(originalTree, {
      pseudoLocalization: true,
      expansionRatio: 0.35,
      direction: 'rtl',
    })

    // Original must remain untouched
    expect(originalTree.props.label).toBeUndefined()
    expect(originalTree.children[0].props.label).toBe('Save Changes')
    expect(originalTree.props.dir).toBeUndefined()

    // Simulated must have expanded label and RTL props
    expect(simulated.props.dir).toBe('rtl')
    expect(simulated.props.direction).toBe('row-reverse')
    expect(simulated.children[0].props.label).not.toBe('Save Changes')
    expect(typeof simulated.children[0].props.label).toBe('string')
    expect((simulated.children[0].props.label as string).length).toBeGreaterThan('Save Changes'.length)
  })
})
