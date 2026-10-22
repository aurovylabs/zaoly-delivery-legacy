import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { CompositionScene } from '@zaoly/contracts'
import { EditorPageFrameInspector } from '../components/editor-page-frame-inspector'
import { defaultArtboardPresetLeaves } from '../lib/tokens/artboard-presets'
import { sceneBoardFrameNodeId } from '../lib/scene/scene-board'
import { AppProviders } from '../components/app-providers'

function sceneWithPageFrame(): CompositionScene {
  return {
    id: 'scene-1',
    name: 'Test',
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    activeBreakpoint: 'desktop',
    activePageId: 'page-home',
    root: {
      id: 'root-home',
      type: 'SiteStack',
      name: 'Home',
      props: {},
      children: [],
    },
    pages: [
      {
        id: 'page-home',
        name: 'Home',
        root: {
          id: 'root-home',
          type: 'SiteStack',
          name: 'Home',
          props: {},
          children: [],
        },
        frame: { x: 0, y: 0, width: 1440, height: 900 },
        breakpoint: 'desktop',
      },
      {
        id: 'page-other',
        name: 'Other',
        root: {
          id: 'root-other',
          type: 'SiteStack',
          name: 'Other',
          props: {},
          children: [],
        },
        frame: { x: 1600, y: 0 },
      },
    ],
  } as CompositionScene
}

describe('EditorPageFrameInspector pack presets', () => {
  it('applies a mobile pack preset to the selected page frame', () => {
    const onOps = vi.fn()
    const onBreakpointSync = vi.fn()
    const scene = sceneWithPageFrame()
    const frameNodeId = sceneBoardFrameNodeId('page-home')
    render(
      <AppProviders>
        <EditorPageFrameInspector
          scene={scene}
          selectedFrameNodeId={frameNodeId}
          sceneDefaultArtboardWidth={1440}
          onOp={vi.fn()}
          onOps={onOps}
          packLeaves={defaultArtboardPresetLeaves()}
          onBreakpointSync={onBreakpointSync}
        />
      </AppProviders>,
    )
    expect(screen.getByTestId('editor-page-frame-presets')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('editor-page-frame-preset-mobile'))
    expect(onOps).toHaveBeenCalledWith([
      { op: 'set_page_frame', pageId: 'page-home', width: 390, height: 844 },
      { op: 'set_page_breakpoint', pageId: 'page-home', breakpoint: 'mobile' },
    ])
    expect(onBreakpointSync).toHaveBeenCalledWith('mobile')
  })
})
