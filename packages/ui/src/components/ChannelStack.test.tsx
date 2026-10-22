import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ChannelLane, ChannelStack } from './ChannelStack'

describe('ChannelStack', () => {
  it('renders labeled lanes', () => {
    render(
      <ChannelStack>
        <ChannelLane label="Think" open>
          Reasoning here
        </ChannelLane>
      </ChannelStack>,
    )
    expect(screen.getByText('Think')).toBeInTheDocument()
    expect(screen.getByText('Reasoning here')).toBeInTheDocument()
    expect(screen.getByText('Think').closest('details')).toHaveAttribute('open')
  })
})
