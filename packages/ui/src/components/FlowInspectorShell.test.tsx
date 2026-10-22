import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FlowInspectorShell } from './FlowInspectorShell'

describe('FlowInspectorShell', () => {
  it('renders title and collapses sections', () => {
    render(
      <FlowInspectorShell
        kind="gate"
        kindLabel="Gate"
        title="Manual gate"
        nodeId="g1"
        sections={[
          { id: 'design', title: 'Design', children: <p>Design body</p> },
          { id: 'run', title: 'Run', children: <p>Run body</p> },
        ]}
      />
    )
    expect(screen.getByText('Manual gate')).toBeInTheDocument()
    expect(screen.getByText('Design body')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Design/i }))
    expect(screen.queryByText('Design body')).not.toBeInTheDocument()
  })
})
