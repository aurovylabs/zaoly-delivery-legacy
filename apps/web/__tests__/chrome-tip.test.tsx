import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ChromeTip } from '../components/chrome-tip'

describe('ChromeTip (P104)', () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get(this: HTMLElement) {
        return this.getAttribute('role') === 'tooltip' ? 240 : 24
      },
    })
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get(this: HTMLElement) {
        return this.getAttribute('role') === 'tooltip' ? 40 : 24
      },
    })
    Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
      configurable: true,
      value(this: HTMLElement) {
        if (this.classList.contains('ds-tooltip-anchor')) {
          return {
            width: 20,
            height: 20,
            top: 200,
            left: 200,
            right: 220,
            bottom: 220,
            x: 200,
            y: 200,
            toJSON() {},
          }
        }
        if (this.getAttribute('role') === 'tooltip') {
          return {
            width: 240,
            height: 40,
            top: 0,
            left: 0,
            right: 240,
            bottom: 40,
            x: 0,
            y: 0,
            toJSON() {},
          }
        }
        return {
          width: 20,
          height: 20,
          top: 200,
          left: 200,
          right: 220,
          bottom: 220,
          x: 200,
          y: 200,
          toJSON() {},
        }
      },
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('wraps a control with Tooltip and sets aria-label from tip', () => {
    render(
      <ChromeTip tip="Add Text (T)">
        <button type="button">T</button>
      </ChromeTip>,
    )
    const btn = screen.getByRole('button', { name: 'Add Text (T)' })
    expect(btn).not.toHaveAttribute('title')
    fireEvent.focus(btn)
    expect(screen.getByRole('tooltip')).toHaveTextContent('Add Text (T)')
  })

  it('keeps an explicit aria-label on the child', () => {
    render(
      <ChromeTip tip="Fallback tip">
        <button type="button" aria-label="Explicit name">
          X
        </button>
      </ChromeTip>,
    )
    const btn = screen.getByRole('button', { name: 'Explicit name' })
    fireEvent.focus(btn)
    expect(screen.getByRole('tooltip')).toHaveTextContent('Fallback tip')
  })
})
