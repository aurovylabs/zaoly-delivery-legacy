import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { GridEditor } from './GridEditor'

describe('GridEditor', () => {
  it('applies column preset', () => {
    const onChange = vi.fn()
    render(
      <GridEditor
        value={{ columns: 12, gutter: '1rem' }}
        onChange={onChange}
        data-testid="grid"
      />,
    )
    fireEvent.click(screen.getByTestId('grid-preset-8'))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ columns: 8, gutter: '1rem' }),
    )
  })

  it('renders synced metric fields', () => {
    render(
      <GridEditor
        value={{ columns: 12, gutter: '1.5rem', margin: '1rem', maxWidth: '1200px' }}
        onChange={() => {}}
        data-testid="grid"
      />,
    )
    expect(screen.getByTestId('grid-columns-input')).toHaveValue(12)
    expect(screen.getByTestId('grid-gutter')).toHaveValue('1.5rem')
    expect(screen.getByTestId('grid-max-width')).toHaveValue('1200px')
  })
})
