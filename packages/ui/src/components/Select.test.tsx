import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Select } from './Select'

describe('Select', () => {
  it('portals the listbox to document.body so overflow ancestors cannot clip it', () => {
    const onChange = vi.fn()
    const { container } = render(
      <div style={{ overflow: 'hidden', height: 40 }}>
        <Select
          aria-label="Color"
          value="a"
          onChange={onChange}
          options={[
            { value: 'a', label: 'Alpha' },
            { value: 'b', label: 'Beta' },
          ]}
        />
      </div>,
    )

    fireEvent.click(screen.getByRole('combobox', { name: 'Color' }))
    const listbox = screen.getByRole('listbox')
    expect(listbox).toHaveClass('ds-select-menu--portal')
    expect(listbox.parentElement).toBe(document.body)
    expect(container.querySelector('[role="listbox"]')).toBeNull()

    fireEvent.click(screen.getByRole('option', { name: 'Beta' }))
    expect(onChange).toHaveBeenCalledWith('b')
  })
})
