import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppProviders } from '../components/app-providers'
import { EditorWorkspace } from '../components/editor-workspace'
import { createLegacyFixtureScene } from '../lib/scene/demo-scene'

describe('editor inspector box model (P83)', () => {
  it('shows compact padding group and expands to per-side fields', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    fireEvent.click(document.querySelector('[data-node-id="root"]') as HTMLElement)
    const inspector = screen.getByTestId('creation-editor-inspector')
    expect(within(inspector).getByTestId('inspect-box-model-padding')).toBeInTheDocument()
    expect(within(inspector).queryByText('Padding top')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('inspect-box-model-padding-toggle'))
    expect(within(inspector).getByText('Padding top')).toBeInTheDocument()
    expect(within(inspector).getByText('Padding bottom')).toBeInTheDocument()
  })

  it('shows compact radius group with corner expand', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    const inspector = screen.getByTestId('creation-editor-inspector')
    expect(within(inspector).getByTestId('inspect-box-model-radius')).toBeInTheDocument()
    expect(within(inspector).queryByText('Radius TL')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('inspect-box-model-radius-toggle'))
    expect(within(inspector).getByText('Radius TL')).toBeInTheDocument()
  })
})
