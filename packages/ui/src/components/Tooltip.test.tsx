import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Tooltip } from './Tooltip'

describe('Tooltip', () => {
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
          width: 0,
          height: 0,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          x: 0,
          y: 0,
          toJSON() {},
        }
      },
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('places the bubble tightly above the anchor', () => {
    render(
      <Tooltip content="Sentence case tip about discoverability.">
        <button type="button">Trigger</button>
      </Tooltip>,
    )
    fireEvent.focus(screen.getByRole('button', { name: 'Trigger' }))
    const tip = screen.getByRole('tooltip')
    expect(tip).toHaveTextContent('Sentence case tip about discoverability.')
    expect(tip.style.position).toBe('fixed')
    // anchor.top(200) - height(40) - gap(4) = 156
    expect(Number.parseFloat(tip.style.top)).toBe(156)
  })

  it('clamps horizontally near the left viewport edge', () => {
    Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
      configurable: true,
      value(this: HTMLElement) {
        if (this.classList.contains('ds-tooltip-anchor')) {
          return {
            width: 20,
            height: 20,
            top: 200,
            left: 4,
            right: 24,
            bottom: 220,
            x: 4,
            y: 200,
            toJSON() {},
          }
        }
        if (this.getAttribute('role') === 'tooltip') {
          return {
            width: 320,
            height: 40,
            top: 0,
            left: 0,
            right: 320,
            bottom: 40,
            x: 0,
            y: 0,
            toJSON() {},
          }
        }
        return {
          width: 0,
          height: 0,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          x: 0,
          y: 0,
          toJSON() {},
        }
      },
    })
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get(this: HTMLElement) {
        return this.getAttribute('role') === 'tooltip' ? 320 : 20
      },
    })

    render(
      <Tooltip content="Edge tip that would otherwise overflow left.">
        <button type="button">Edge</button>
      </Tooltip>,
    )
    fireEvent.focus(screen.getByRole('button', { name: 'Edge' }))
    const tip = screen.getByRole('tooltip')
    expect(Number.parseFloat(tip.style.left)).toBeGreaterThanOrEqual(8)
  })

  it('flips below when there is no room above', () => {
    Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
      configurable: true,
      value(this: HTMLElement) {
        if (this.classList.contains('ds-tooltip-anchor')) {
          return {
            width: 20,
            height: 20,
            top: 10,
            left: 200,
            right: 220,
            bottom: 30,
            x: 200,
            y: 10,
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
          width: 0,
          height: 0,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          x: 0,
          y: 0,
          toJSON() {},
        }
      },
    })

    render(
      <Tooltip content="Near the top edge.">
        <button type="button">Top</button>
      </Tooltip>,
    )
    fireEvent.focus(screen.getByRole('button', { name: 'Top' }))
    const tip = screen.getByRole('tooltip')
    // anchor.bottom(30) + gap(4) = 34
    expect(Number.parseFloat(tip.style.top)).toBe(34)
  })

  it('coalesces scroll reposition with passive capture listener', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const queued: FrameRequestCallback[] = []
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      queued.push(cb)
      return queued.length
    })

    render(
      <Tooltip content="Scroll tip">
        <button type="button">Scroll</button>
      </Tooltip>,
    )
    fireEvent.focus(screen.getByRole('button', { name: 'Scroll' }))
    expect(screen.getByRole('tooltip')).toBeTruthy()

    const scrollCall = addSpy.mock.calls.find(
      (call) => call[0] === 'scroll' && typeof call[1] === 'function',
    )
    expect(scrollCall).toBeTruthy()
    expect(scrollCall?.[2]).toMatchObject({ capture: true, passive: true })

    // Flush open-path rAF so rafRef is clear before asserting coalesce.
    while (queued.length > 0) {
      const cb = queued.shift()!
      cb(0)
    }

    const onScroll = scrollCall![1] as EventListener
    onScroll(new Event('scroll'))
    onScroll(new Event('scroll'))
    onScroll(new Event('scroll'))
    expect(queued).toHaveLength(1)

    addSpy.mockRestore()
    rafSpy.mockRestore()
  })
})
