import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FlowRunStrip } from './FlowRunStrip'

describe('FlowRunStrip', () => {
  it('renders status links and verdict slots', () => {
    render(
      <FlowRunStrip
        status={<span>running</span>}
        links={<a href="#softq">Soft-Q</a>}
        verdict={<span>ready</span>}
      />
    )
    expect(screen.getByText('running')).toBeInTheDocument()
    expect(screen.getByText('Soft-Q')).toBeInTheDocument()
    expect(screen.getByText('ready')).toBeInTheDocument()
  })
})
