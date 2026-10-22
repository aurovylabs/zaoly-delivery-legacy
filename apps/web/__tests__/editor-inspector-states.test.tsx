import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { SceneNode } from '@zaoly/contracts'
import { AppProviders } from '../components/app-providers'
import { EditorInspector } from '../components/editor-inspector'
import { InteractiveStateProvider } from '../lib/inspect/interactive-state-context'
import { cascadeNodeForState, generateSceneStatesCss, writesToStateOverride } from '../lib/scene/state-cascade'

describe('Interactive Pseudo-States (Phase 2)', () => {
  it('cascades node for default and interactive states', () => {
    const node: SceneNode = {
      id: 'btn-1',
      type: 'Button',
      props: {
        children: 'Click Me',
        bg: '#0066cc',
      },
      states: {
        hover: {
          props: {
            bg: '#0052a3',
          },
        },
        active: {
          style: {
            transform: 'scale(0.98)',
          },
        },
      },
    }

    // Default state
    const defaultView = cascadeNodeForState(node, 'default')
    expect(defaultView.props.bg).toBe('#0066cc')
    expect(defaultView.props.children).toBe('Click Me')
    expect(defaultView.overrideKeys.size).toBe(0)

    // Hover state
    const hoverView = cascadeNodeForState(node, 'hover')
    expect(hoverView.props.bg).toBe('#0052a3')
    expect(hoverView.props.children).toBe('Click Me')
    expect(hoverView.overrideKeys.has('bg')).toBe(true)

    // Active state with style
    const activeView = cascadeNodeForState(node, 'active')
    expect(activeView.style.transform).toBe('scale(0.98)')
    expect(activeView.overrideKeys.has('transform')).toBe(true)
  })

  it('correctly determines whether writes target a state override', () => {
    expect(writesToStateOverride('default')).toBe(false)
    expect(writesToStateOverride('hover')).toBe(true)
    expect(writesToStateOverride('focus')).toBe(true)
    expect(writesToStateOverride('active')).toBe(true)
    expect(writesToStateOverride('disabled')).toBe(true)
  })

  it('generates scoped CSS for states', () => {
    const root: SceneNode = {
      id: 'root',
      type: 'Box',
      children: [
        {
          id: 'card-1',
          type: 'Card',
          states: {
            hover: {
              props: {
                bg: '#ffffff',
                opacity: 0.9,
              },
            },
            focus: {
              props: {
                borderColor: '#0088ff',
              },
            },
            disabled: {
              props: {
                opacity: 0.5,
              },
            },
          },
        },
      ],
    }

    const css = generateSceneStatesCss(root)
    expect(css).toContain('[data-node-id="card-1"]:hover')
    expect(css).toContain('[data-node-id="card-1"][data-force-state="hover"]')
    expect(css).toContain('[data-node-id="card-1"]:focus')
    expect(css).toContain('[data-node-id="card-1"][data-force-state="focus"]')
    expect(css).toContain('[data-node-id="card-1"]:disabled')
    expect(css).toContain('[data-node-id="card-1"][data-force-state="disabled"]')
    expect(css).toContain('[aria-disabled="true"]')
    expect(css).toContain('[data-has-states="true"]')
    expect(css).toContain('opacity: 0.9 !important;')
  })

  it('keeps hook order when selection clears (no early-return hook skip)', () => {
    const onOps = vi.fn()
    const node: SceneNode = {
      id: 'btn-1',
      type: 'Button',
      props: { children: 'Submit' },
    }
    const root: SceneNode = { id: 'root', type: 'SiteStack', children: [node] }
    const { rerender } = render(
      <AppProviders>
        <InteractiveStateProvider>
          <EditorInspector
            selected={node}
            selectedNodes={[node]}
            selectedCount={1}
            sceneRoot={root}
            isRoot={false}
            locked={false}
            activeBreakpoint="desktop"
            onOp={(op) => onOps([op])}
            onOps={onOps}
            onRemove={() => {}}
          />
        </InteractiveStateProvider>
      </AppProviders>,
    )
    expect(screen.getByTestId('creation-editor-inspector')).toBeInTheDocument()
    expect(() => {
      rerender(
        <AppProviders>
          <InteractiveStateProvider>
            <EditorInspector
              selected={null}
              selectedNodes={[]}
              selectedCount={0}
              sceneRoot={root}
              isRoot={false}
              locked={false}
              activeBreakpoint="desktop"
              onOp={(op) => onOps([op])}
              onOps={onOps}
              onRemove={() => {}}
            />
          </InteractiveStateProvider>
        </AppProviders>,
      )
    }).not.toThrow()
    expect(screen.getByText(/select/i)).toBeInTheDocument()
  })

  it('hides Inspect interactive state bar while UI gate is off', () => {
    const onOps = vi.fn()
    const node: SceneNode = {
      id: 'btn-1',
      type: 'Button',
      props: {
        children: 'Submit',
        bg: '#0088ff',
      },
      states: {
        hover: {
          props: {
            bg: '#0055cc',
          },
        },
      },
    }

    render(
      <AppProviders>
        <InteractiveStateProvider>
          <EditorInspector
            selected={node}
            selectedNodes={[node]}
            selectedCount={1}
            sceneRoot={node}
            isRoot={false}
            locked={false}
            activeBreakpoint="desktop"
            onOp={(op) => onOps([op])}
            onOps={onOps}
            onRemove={() => {}}
          />
        </InteractiveStateProvider>
      </AppProviders>,
    )

    expect(screen.queryByTestId('editor-inspect-state-bar')).toBeNull()
    expect(screen.queryByTestId('editor-state-variants-hint')).toBeNull()
  })
})
