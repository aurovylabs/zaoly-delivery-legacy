import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { HubIndexLayoutSwitch } from './HubIndexLayoutSwitch'

describe('HubIndexLayoutSwitch', () => {
  it('marks the active layout and notifies onChange', () => {
    const onChange = vi.fn()
    render(
      <HubIndexLayoutSwitch
        value="cards"
        onChange={onChange}
        aria-label="Layout"
        cardsLabel="Cards"
        listLabel="List"
      />,
    )
    expect(screen.getByRole('button', { name: 'Cards' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'List' }))
    expect(onChange).toHaveBeenCalledWith('list')
  })
})
