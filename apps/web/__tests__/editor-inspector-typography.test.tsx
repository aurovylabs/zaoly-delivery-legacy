import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppProviders } from '../components/app-providers'
import { EditorWorkspace } from '../components/editor-workspace'
import { createLegacyFixtureScene } from '../lib/scene/demo-scene'

describe('editor inspector typography (P89)', () => {
  it('shows type stack and chrome bar for Text', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    fireEvent.click(document.querySelector('[data-node-id="title"]') as HTMLElement)
    const inspector = screen.getByTestId('creation-editor-inspector')
    const group = within(inspector).getByTestId('inspect-typography-group')
    expect(group).toBeInTheDocument()
    const stack = within(group).getByTestId('inspect-type-stack')
    expect(within(stack).getByText('Font')).toBeInTheDocument()
    expect(within(stack).getByText('Size')).toBeInTheDocument()
    expect(within(stack).getByText('Wt')).toBeInTheDocument()
    expect(within(stack).getByText('LH')).toBeInTheDocument()
    expect(within(stack).getByText('Track')).toBeInTheDocument()
    const chrome = within(group).getByTestId('inspect-type-chrome')
    expect(within(chrome).getByText('Align')).toBeInTheDocument()
    expect(within(chrome).getByText('Decoration')).toBeInTheDocument()
    expect(within(chrome).getByText('Transform')).toBeInTheDocument()
  })
})
