import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CreationError from '../app/error'
import CreationGlobalError from '../app/global-error'

describe('creation error boundaries (W1/W4)', () => {
  it('renders segment error fallback with retry and reports error', () => {
    const reset = vi.fn()
    const err = Object.assign(new Error('boom'), { digest: 'd1' })
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<CreationError error={err} reset={reset} />)

    expect(screen.getByTestId('creation-error-boundary')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(reset).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalled()
    expect(String(spy.mock.calls[0]?.[0])).toContain('[zaoly:error]')
    spy.mockRestore()
  })

  it('renders global error fallback with html shell', () => {
    const reset = vi.fn()
    const err = new Error('root boom')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<CreationGlobalError error={err} reset={reset} />)

    expect(screen.getByTestId('creation-error-boundary')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(reset).toHaveBeenCalledTimes(1)
    spy.mockRestore()
  })
})
