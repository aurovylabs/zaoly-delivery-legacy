// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EditorKitDriftBanner } from '../components/editor-kit-drift-banner'

afterEach(() => {
  cleanup()
})

describe('EditorKitDriftBanner', () => {
  it('renders actionable Masters and fires Pull / Reset / Dismiss', () => {
    const onPull = vi.fn()
    const onReset = vi.fn()
    const onDismiss = vi.fn()
    render(
      <EditorKitDriftBanner
        rows={[
          {
            masterId: 'm1',
            masterName: 'Hero',
            componentId: 'Composition~x~Hero',
            localRevision: 'override:old',
            remoteRevision: 'override:new',
            kind: 'kit-newer',
          },
        ]}
        onPull={onPull}
        onReset={onReset}
        onDismiss={onDismiss}
      />,
    )
    expect(screen.getByTestId('editor-kit-drift-banner')).toBeInTheDocument()
    expect(screen.getByTestId('editor-kit-drift-row')).toHaveAttribute('data-kind', 'kit-newer')
    fireEvent.click(screen.getByTestId('editor-kit-drift-pull'))
    fireEvent.click(screen.getByTestId('editor-kit-drift-reset'))
    fireEvent.click(screen.getByTestId('editor-kit-drift-dismiss'))
    expect(onPull).toHaveBeenCalled()
    expect(onReset).toHaveBeenCalled()
    expect(onDismiss).toHaveBeenCalled()
  })
})
