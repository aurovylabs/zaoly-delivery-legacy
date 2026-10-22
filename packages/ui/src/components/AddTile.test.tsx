import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AddTile } from './AddTile'

afterEach(() => {
  cleanup()
})

describe('AddTile', () => {
  it('fires onClick', () => {
    const onClick = vi.fn()
    render(<AddTile label="Add token" onClick={onClick} />)
    fireEvent.click(screen.getByRole('button', { name: /Add token/i }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('respects disabled', () => {
    const onClick = vi.fn()
    render(<AddTile label="Add disabled" disabled onClick={onClick} />)
    const btn = screen.getByRole('button', { name: /Add disabled/i })
    expect(btn).toBeDisabled()
    fireEvent.click(btn)
    expect(onClick).not.toHaveBeenCalled()
  })
})
