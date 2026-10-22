import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppProviders } from '../components/app-providers'
import { EditorWorkspace } from '../components/editor-workspace'
import { createLegacyFixtureScene } from '../lib/scene/demo-scene'

describe('editor inspector P90 rotate + effects', () => {
  it('shows rotate in Constraints and effects group in Appearance for Stack', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    fireEvent.click(document.querySelector('[data-node-id="root"]') as HTMLElement)
    const inspector = screen.getByTestId('creation-editor-inspector')
    expect(within(inspector).getByTestId('inspect-rotate-field')).toBeInTheDocument()
    expect(within(inspector).getByText('°')).toBeInTheDocument()
    const effects = within(inspector).getByTestId('inspect-appearance-effects')
    expect(within(effects).getByText('Shadow')).toBeInTheDocument()
    expect(within(effects).getByText('Blur')).toBeInTheDocument()
    expect(within(effects).getByText('Overflow')).toBeInTheDocument()
  })
})
