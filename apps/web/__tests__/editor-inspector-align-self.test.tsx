import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppProviders } from '../components/app-providers'
import { EditorWorkspace } from '../components/editor-workspace'
import { createLegacyFixtureScene } from '../lib/scene/demo-scene'

describe('editor inspector align-self grid (P88)', () => {
  it('shows 9-point pin with Stretch and Auto for Stack', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    fireEvent.click(document.querySelector('[data-node-id="root"]') as HTMLElement)
    const inspector = screen.getByTestId('creation-editor-inspector')
    const grid = within(inspector).getByTestId('inspect-align-self-grid')
    expect(grid).toBeInTheDocument()
    expect(within(grid).getByTestId('inspect-align-self-pin-tl')).toBeInTheDocument()
    expect(within(grid).getByTestId('inspect-align-self-pin-mc')).toBeInTheDocument()
    expect(within(grid).getByTestId('inspect-align-self-pin-br')).toBeInTheDocument()
    expect(within(grid).getByTestId('inspect-align-self-stretch')).toBeInTheDocument()
    expect(within(grid).getByTestId('inspect-align-self-auto')).toBeInTheDocument()
    expect(grid).toHaveAttribute('data-align-self', 'unset')
  })

  it('writes flex-start from top-row pin and toggles back to auto', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    fireEvent.click(document.querySelector('[data-node-id="root"]') as HTMLElement)
    const inspector = screen.getByTestId('creation-editor-inspector')
    const pin = within(inspector).getByTestId('inspect-align-self-pin-tc')
    fireEvent.click(pin)
    expect(within(inspector).getByTestId('inspect-align-self-grid')).toHaveAttribute(
      'data-align-self',
      'flex-start',
    )
    fireEvent.click(pin)
    expect(within(inspector).getByTestId('inspect-align-self-grid')).toHaveAttribute(
      'data-align-self',
      'auto',
    )
  })

  it('sets stretch from mode button', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    fireEvent.click(document.querySelector('[data-node-id="root"]') as HTMLElement)
    const inspector = screen.getByTestId('creation-editor-inspector')
    fireEvent.click(within(inspector).getByTestId('inspect-align-self-stretch'))
    expect(within(inspector).getByTestId('inspect-align-self-grid')).toHaveAttribute(
      'data-align-self',
      'stretch',
    )
  })
})
