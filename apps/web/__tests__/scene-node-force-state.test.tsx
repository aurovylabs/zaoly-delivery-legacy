// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { SceneNode } from '@zaoly/contracts'
import { SceneNodeView } from '../components/scene-node-view'
import { InteractiveStateProvider, useInteractiveState } from '../lib/inspect/interactive-state-context'
import { EditorSelectionSync } from '../components/editor/editor-selection-sync'
import { defaultSiteKitInteractiveStates } from '../lib/inspect/token-catalog'
import { InspectorStateBar } from '../components/editor-inspector/inspector-state-bar'

afterEach(() => {
  cleanup()
})

function StateSwitcher() {
  const { activeState, setActiveState } = useInteractiveState()
  return (
    <button type="button" data-testid="force-hover" onClick={() => setActiveState('hover')}>
      {activeState}
    </button>
  )
}

describe('SceneNodeView force interactive state preview', () => {
  it('sets data-force-state and updates SiteButton paint when Hover is forced', () => {
    const states = defaultSiteKitInteractiveStates('SiteButton')
    const node: SceneNode = {
      id: 'btn-force',
      type: 'SiteButton',
      props: { children: 'Go' },
      tokenBindings: {
        background: 'color.action.primary',
        color: 'color.action.primaryForeground',
      },
      states,
    }

    render(
      <InteractiveStateProvider>
        <EditorSelectionSync selectedIds={['btn-force']} />
        <StateSwitcher />
        <SceneNodeView node={node} onSelect={() => undefined} activeBreakpoint="desktop" />
      </InteractiveStateProvider>,
    )

    const host = document.querySelector('[data-node-id="btn-force"]') as HTMLElement
    expect(host).toBeTruthy()
    const shell = () => (host.querySelector('.site-btn') as HTMLElement | null) ?? host
    const before = shell().style.background || shell().style.backgroundColor

    fireEvent.click(screen.getByTestId('force-hover'))
    expect(host.getAttribute('data-force-state')).toBe('hover')

    const after = shell().style.background || shell().style.backgroundColor
    expect(after).toBeTruthy()
    expect(after).not.toBe(before)
  })

  it('does not render Inspect state bar while UI gate is off', () => {
    const node: SceneNode = {
      id: 'txt-1',
      type: 'SiteText',
      props: { children: 'Zaoly' },
    }
    render(
      <InteractiveStateProvider>
        <InspectorStateBar node={node} onOps={() => undefined} />
      </InteractiveStateProvider>,
    )
    expect(screen.queryByTestId('editor-inspect-state-bar')).toBeNull()
    expect(screen.queryByTestId('editor-state-variants-hint')).toBeNull()
  })
})
