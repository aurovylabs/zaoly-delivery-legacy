import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { InfoTip } from './InfoTip'

describe('InfoTip', () => {
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

  it('renders a labelled ghost trigger', () => {
    render(<InfoTip label="About performance" content="Core Web Vitals and load timing." />)
    const trigger = screen.getByRole('button', { name: 'About performance' })
    expect(trigger).toBeInTheDocument()
    expect(trigger.className).toContain('ds-btn--ghost')
    expect(trigger.className).toContain('ds-btn--square')
  })

  it('shows tip content on focus', () => {
    render(<InfoTip label="About SEO" content="Search visibility and crawl signals." />)
    fireEvent.focus(screen.getByRole('button', { name: 'About SEO' }))
    expect(screen.getByRole('tooltip')).toHaveTextContent('Search visibility and crawl signals.')
  })

  it('shows tip content on hover', () => {
    const { container } = render(
      <InfoTip label="About UX" content="Task ease and interaction quality." />,
    )
    const tipRoot = container.querySelector('.ds-tooltip')
    expect(tipRoot).toBeTruthy()
    fireEvent.mouseEnter(tipRoot!)
    expect(screen.getByRole('tooltip')).toHaveTextContent('Task ease and interaction quality.')
  })
})
