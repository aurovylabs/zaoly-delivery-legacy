import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SelectionHandles } from './SelectionHandles'

afterEach(() => {
  cleanup()
})

describe('SelectionHandles', () => {
  it('renders handles', () => {
    render(<SelectionHandles />)
    expect(screen.getByTestId('selection-handles')).toBeInTheDocument()
  })

  it('hides when not visible', () => {
    const { rerender } = render(<SelectionHandles visible />)
    expect(screen.getByTestId('selection-handles')).toBeInTheDocument()
    rerender(<SelectionHandles visible={false} />)
    expect(screen.queryByTestId('selection-handles')).toBeNull()
  })

  it('interactive corners call onHandlePointerDown', () => {
    const onHandlePointerDown = vi.fn()
    render(
      <SelectionHandles interactive onHandlePointerDown={onHandlePointerDown} />,
    )
    const se = screen.getByTestId('selection-handles').querySelector('[data-handle="se"]')
    expect(se).toBeTruthy()
    fireEvent.pointerDown(se!)
    expect(onHandlePointerDown).toHaveBeenCalledWith('se', expect.anything())
  })
})
