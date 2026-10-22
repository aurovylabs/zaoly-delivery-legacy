import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EasingCurveEditor } from './EasingCurveEditor'

describe('EasingCurveEditor', () => {
  it('offers enable control for keyword easings', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <EasingCurveEditor
        value="ease-in-out"
        onChange={onChange}
        enableCustomLabel="Custom"
        data-testid="easing"
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Custom' }))
    expect(onChange).toHaveBeenCalledWith('cubic-bezier(0.4, 0, 0.2, 1)')
  })

  it('renders numeric fields for cubic-bezier values', () => {
    render(
      <EasingCurveEditor
        value="cubic-bezier(0.4, 0, 0.2, 1)"
        onChange={() => {}}
        data-testid="easing"
      />,
    )
    expect(screen.getByTestId('easing-x1')).toHaveValue(0.4)
    expect(screen.getByTestId('easing-y2')).toHaveValue(1)
  })
})
