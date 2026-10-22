import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FlowNodeEditorShell } from './FlowNodeEditorShell'

describe('FlowNodeEditorShell', () => {
  it('renders three columns when open', () => {
    render(
      <FlowNodeEditorShell
        open
        onClose={() => {}}
        kind="prompt"
        kindLabel="Aufgabe"
        title="Click buy"
        nodeId="n1"
        input={<p>Input body</p>}
        params={<p>Params body</p>}
        output={<p>Output body</p>}
      />
    )
    expect(screen.getByText('INPUT')).toBeInTheDocument()
    expect(screen.getByText('Parameters')).toBeInTheDocument()
    expect(screen.getByText('OUTPUT')).toBeInTheDocument()
    expect(screen.getByText('Params body')).toBeInTheDocument()
  })

  it('calls onClose from Escape', () => {
    const onClose = vi.fn()
    render(
      <FlowNodeEditorShell open onClose={onClose} title="Node" params={<span />} />
    )
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('renders nothing when closed', () => {
    const { container } = render(
      <FlowNodeEditorShell open={false} onClose={() => {}} title="Node" />
    )
    expect(container.firstChild).toBeNull()
  })
})
