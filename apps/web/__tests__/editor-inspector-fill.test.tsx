import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { AppProviders } from '../components/app-providers'
import { EditorWorkspace } from '../components/editor-workspace'
import { createLegacyFixtureScene } from '../lib/scene/demo-scene'

describe('editor inspector fill triplet (P87)', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('shows Fill / Color / Stroke triplet for Stack', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    fireEvent.click(document.querySelector('[data-node-id="root"]') as HTMLElement)
    const inspector = screen.getByTestId('creation-editor-inspector')
    const fillGroup = within(inspector).getByTestId('inspect-fill-group')
    expect(fillGroup).toBeInTheDocument()
    const triplet = within(fillGroup).getByTestId('inspect-fill-triplet')
    expect(within(triplet).getByText('Fill')).toBeInTheDocument()
    expect(within(triplet).getByText('Color')).toBeInTheDocument()
    expect(within(triplet).getByText('Stroke')).toBeInTheDocument()
    expect(within(fillGroup).queryByTestId('inspect-token-borderWidth')).not.toBeInTheDocument()
  })

  it('expands border width/style and gradient when toggle is clicked', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    fireEvent.click(document.querySelector('[data-node-id="root"]') as HTMLElement)
    const inspector = screen.getByTestId('creation-editor-inspector')
    fireEvent.click(within(inspector).getByTestId('inspect-fill-toggle'))
    const fillGroup = within(inspector).getByTestId('inspect-fill-group')
    expect(within(fillGroup).getByTestId('inspect-token-borderWidth')).toBeInTheDocument()
    expect(within(fillGroup).getByTestId('inspect-border-style')).toBeInTheDocument()
    expect(within(fillGroup).getByTestId('inspect-token-gradient')).toBeInTheDocument()
  })

  it('exposes immediate + Image header button and compact add-image trigger for containers', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    fireEvent.click(document.querySelector('[data-node-id="root"]') as HTMLElement)
    const inspector = screen.getByTestId('creation-editor-inspector')
    const fillGroup = within(inspector).getByTestId('inspect-fill-group')

    // Header image button is visible even when collapsed
    const headerImgBtn = within(fillGroup).getByTestId('inspect-header-bg-btn')
    expect(headerImgBtn).toBeInTheDocument()
    expect(headerImgBtn).toHaveTextContent('+ Image')

    // Compact row has immediate "+ Background Image" trigger
    const compactAddBtn = within(fillGroup).getByTestId('compact-add-bg-btn')
    expect(compactAddBtn).toBeInTheDocument()
    expect(compactAddBtn).toHaveTextContent('+ Background Image')

    // Clicking compact "+ Background Image" expands group and opens add-bg-image-card
    fireEvent.click(compactAddBtn)
    expect(within(fillGroup).getByTestId('add-bg-image-card')).toBeInTheDocument()
    expect(within(fillGroup).getByTestId('inspect-bg-media-section')).toBeInTheDocument()
  })
})

