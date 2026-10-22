import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FlowBoardToolbar } from './FlowBoardToolbar'

describe('FlowBoardToolbar', () => {
  it('shows dirty chip and actions', () => {
    render(
      <FlowBoardToolbar dirty dirtyLabel="unsaved">
        <button type="button">Save</button>
      </FlowBoardToolbar>
    )
    expect(screen.getByText('unsaved')).toBeInTheDocument()
    expect(screen.getByText('Save')).toBeInTheDocument()
  })
})
