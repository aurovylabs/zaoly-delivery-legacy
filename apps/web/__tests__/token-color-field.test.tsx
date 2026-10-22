// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { TokenColorField } from '../components/token-color-field'

const t = (key: string) => key.replace(/^tokens\./, '')

describe('TokenColorField', () => {
  it('switches the digital value into RGB notation', () => {
    const onChange = vi.fn()
    render(<TokenColorField value="#1f44ff" onChange={onChange} t={t} />)
    fireEvent.click(screen.getByTestId('token-color-format-rgb'))
    expect(onChange).toHaveBeenCalled()
    expect(String(onChange.mock.calls[0]?.[0])).toMatch(/^rgb\(/i)
  })

  it('accepts pasted rgba into the value input', () => {
    const onChange = vi.fn()
    render(<TokenColorField value="#1f44ff" onChange={onChange} t={t} />)
    fireEvent.change(screen.getByTestId('token-color-input'), {
      target: { value: 'rgba(0, 0, 0, 0.4)' },
    })
    expect(onChange).toHaveBeenCalledWith('rgba(0, 0, 0, 0.4)')
    expect(screen.getByTestId('token-color-format-rgb')).toHaveAttribute('aria-pressed', 'true')
  })
})
