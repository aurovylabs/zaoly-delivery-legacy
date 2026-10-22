import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppProviders } from '../components/app-providers'
import { EditorWorkspace } from '../components/editor-workspace'
import { createLegacyFixtureScene } from '../lib/scene/demo-scene'

describe('editor inspector clip / slant (W16-6)', () => {
  it('shows compact bottom slant and expands to corner pairs', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    fireEvent.click(document.querySelector('[data-node-id="root"]') as HTMLElement)
    const inspector = screen.getByTestId('creation-editor-inspector')
    expect(within(inspector).getByTestId('inspect-clip-slant')).toBeInTheDocument()
    expect(within(inspector).getByTestId('inspect-clip-slant-preset')).toBeInTheDocument()
    expect(within(inspector).getByTestId('inspect-clip-slant-amount')).toBeInTheDocument()
    expect(within(inspector).queryByText('Clip TL X')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('inspect-clip-slant-toggle'))
    expect(within(inspector).getByText('Clip TL X')).toBeInTheDocument()
    expect(within(inspector).getByText('Clip BL Y')).toBeInTheDocument()
  })
})
