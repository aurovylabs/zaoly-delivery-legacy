import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppProviders } from '../components/app-providers'
import { EditorWorkspace } from '../components/editor-workspace'
import { createLegacyFixtureScene } from '../lib/scene/demo-scene'

describe('editor inspector layout flow (P84)', () => {
  it('shows compact flow and align bars for Stack', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    fireEvent.click(document.querySelector('[data-node-id="root"]') as HTMLElement)
    const inspector = screen.getByTestId('creation-editor-inspector')
    expect(within(inspector).getByTestId('inspect-layout-flow')).toBeInTheDocument()
    expect(within(inspector).getByTestId('inspect-align-bar')).toBeInTheDocument()
    expect(within(inspector).getByTestId('inspect-align-matrix')).toBeInTheDocument()
    expect(within(inspector).getByTestId('inspect-align-distribute')).toBeInTheDocument()
    // Compact glyph-chip labels (not tall Field rows)
    expect(within(inspector).getByTestId('inspect-flow-direction')).toBeInTheDocument()
    expect(within(inspector).getByTestId('inspect-flow-wrap')).toBeInTheDocument()
    expect(within(inspector).queryByText('Align content')).not.toBeInTheDocument()
  })

  it('reveals Align content when wrap is enabled', async () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    fireEvent.click(document.querySelector('[data-node-id="root"]') as HTMLElement)
    const inspector = screen.getByTestId('creation-editor-inspector')
    const wrapGroup = within(inspector).getByRole('group', { name: 'Wrap' })
    const wrapBtn = within(wrapGroup).getByRole('button', { name: 'wrap' })
    fireEvent.click(wrapBtn)
    expect(await within(inspector).findByText('Align content')).toBeInTheDocument()
  })
})
