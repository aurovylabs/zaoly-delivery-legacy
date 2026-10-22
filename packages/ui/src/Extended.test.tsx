import { StrictMode } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  Checkbox,
  Dialog,
  Divider,
  Skeleton,
  Spinner,
  Switch,
  Tabs,
  Tooltip,
  Button,
} from './index'

afterEach(() => {
  cleanup()
})

describe('Extended primitives', () => {
  it('Checkbox toggles', () => {
    const onChange = vi.fn()
    render(<Checkbox id="x" label="Opt" onChange={onChange} />)
    fireEvent.click(screen.getByLabelText('Opt'))
    expect(onChange).toHaveBeenCalled()
  })

  it('Switch flips aria-checked', () => {
    const onCheckedChange = vi.fn()
    render(<Switch aria-label="Live" checked={false} onCheckedChange={onCheckedChange} />)
    const sw = screen.getByRole('switch', { name: 'Live' })
    expect(sw).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(sw)
    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })

  it('Tabs switches panels', () => {
    const onChange = vi.fn()
    render(
      <Tabs
        value="a"
        onChange={onChange}
        items={[
          { id: 'a', label: 'A', panel: 'Panel A' },
          { id: 'b', label: 'B', panel: 'Panel B' },
        ]}
      />,
    )
    expect(screen.getByText('Panel A')).toBeTruthy()
    fireEvent.click(screen.getByRole('tab', { name: 'B' }))
    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('Divider / Skeleton / Spinner render', () => {
    const { container } = render(
      <>
        <Divider />
        <Skeleton width={40} />
        <Spinner label="Busy" />
      </>,
    )
    expect(container.querySelector('.ds-divider--horizontal')).toBeTruthy()
    expect(container.querySelector('.ds-skeleton')).toBeTruthy()
    expect(screen.getByRole('status', { name: 'Busy' })).toBeTruthy()
  })

  it('Tooltip opens on focus', () => {
    render(
      <Tooltip content="Tip text">
        <button type="button">Target</button>
      </Tooltip>,
    )
    fireEvent.focus(screen.getByText('Target').parentElement!)
    expect(screen.getByRole('tooltip').textContent).toBe('Tip text')
  })

  it('Dialog showModal when open', () => {
    const onClose = vi.fn()
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute('open', '')
    })
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
      this.removeAttribute('open')
    })
    const { rerender } = render(
      <Dialog open={false} onClose={onClose} title="T">
        Body
      </Dialog>,
    )
    expect(screen.queryByRole('dialog')).toBeNull()
    rerender(
      <Dialog open onClose={onClose} title="T">
        Body
      </Dialog>,
    )
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByText('Body')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalled()
    rerender(
      <Dialog open={false} onClose={onClose} title="T">
        Body
      </Dialog>,
    )
  })

  it('Dialog close() on unmount while still open (no stuck modal layer)', () => {
    const onClose = vi.fn()
    const closeFn = vi.fn(function (this: HTMLDialogElement) {
      this.removeAttribute('open')
      this.dispatchEvent(new Event('close'))
    })
    HTMLDialogElement.prototype.close = closeFn
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute('open', '')
    })
    const { unmount } = render(
      <Dialog open onClose={onClose} title="T">
        Body
      </Dialog>,
    )
    expect(screen.getByRole('dialog')).toBeTruthy()
    unmount()
    expect(closeFn).toHaveBeenCalled()
    // Programmatic cleanup close must not notify the host (Strict Mode / conditional mount).
    expect(onClose).not.toHaveBeenCalled()
  })

  it('Dialog conditional mount open stays open after Strict Mode remount', () => {
    const onClose = vi.fn()
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute('open', '')
    })
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
      this.removeAttribute('open')
      this.dispatchEvent(new Event('close'))
    })

    function Host({ open }: { open: boolean }) {
      if (!open) return null
      return (
        <Dialog open onClose={onClose} title="T">
          Body
        </Dialog>
      )
    }

    const { rerender } = render(
      <StrictMode>
        <Host open={false} />
      </StrictMode>,
    )
    rerender(
      <StrictMode>
        <Host open />
      </StrictMode>,
    )
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(onClose).not.toHaveBeenCalled()
  })
})
