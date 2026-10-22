import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppProviders } from '../components/app-providers'
import { EditorWorkspace } from '../components/editor-workspace'
import { createLegacyFixtureScene } from '../lib/scene/demo-scene'

describe('editor inspector size box (P86)', () => {
  it('shows compact W|H size box with Hug summary for Stack', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    fireEvent.click(document.querySelector('[data-node-id="root"]') as HTMLElement)
    const inspector = screen.getByTestId('creation-editor-inspector')
    const sizeBox = within(inspector).getByTestId('inspect-size-box-group')
    expect(sizeBox).toBeInTheDocument()
    expect(within(inspector).getByTestId('inspect-constraints-summary')).toHaveTextContent(
      'W Hug · H Hug',
    )
    expect(within(sizeBox).getByTestId('inspect-token-width')).toBeInTheDocument()
    expect(within(sizeBox).getByTestId('inspect-token-height')).toBeInTheDocument()
    expect(within(sizeBox).getAllByText('W').length).toBeGreaterThan(0)
    expect(within(sizeBox).getAllByText('H').length).toBeGreaterThan(0)
  })

  it('expands min/max pairs when toggle is clicked', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    fireEvent.click(document.querySelector('[data-node-id="root"]') as HTMLElement)
    const inspector = screen.getByTestId('creation-editor-inspector')
    fireEvent.click(within(inspector).getByTestId('inspect-size-box-toggle'))
    const sizeBox = within(inspector).getByTestId('inspect-size-box-group')
    expect(within(sizeBox).getByText('minW')).toBeInTheDocument()
    expect(within(sizeBox).getByText('maxW')).toBeInTheDocument()
    expect(within(sizeBox).getByText('minH')).toBeInTheDocument()
    expect(within(sizeBox).getByText('maxH')).toBeInTheDocument()
  })
})
