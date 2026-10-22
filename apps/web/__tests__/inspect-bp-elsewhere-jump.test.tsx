// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { InspectBpElsewhereBadges } from '../components/editor-inspector/inspect-bp-elsewhere-badges'

afterEach(() => {
  cleanup()
})

describe('InspectBpElsewhereBadges jump', () => {
  it('calls onSelectBreakpoint when a chip is clicked', () => {
    const onSelect = vi.fn()
    render(
      <InspectBpElsewhereBadges
        bps={['mobile', 'tablet']}
        tip="Also on Mobile, Tablet"
        onSelectBreakpoint={onSelect}
      />,
    )
    fireEvent.click(screen.getAllByTestId('inspect-bp-elsewhere-chip')[0]!)
    expect(onSelect).toHaveBeenCalledWith('mobile')
  })
})
