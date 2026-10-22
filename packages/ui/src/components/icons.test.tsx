import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  IconAlignLeft,
  IconBot,
  IconChat,
  IconCheck,
  IconHamburger,
  IconMenu,
  IconMessage,
  IconMessageCircle,
  IconOverview,
  IconPlay,
  IconPlus,
  IconStorybook,
  IconXCircle,
} from './icons'

describe('icons', () => {
  it('renders Wave 6 chrome aliases and chat variants', () => {
    expect(render(<IconHamburger />).container.querySelector('svg')?.classList.contains('ds-ui-icon')).toBe(
      true,
    )
    expect(render(<IconMenu />).container.querySelector('svg')?.classList.contains('ds-ui-icon')).toBe(true)
    expect(render(<IconChat />).container.querySelector('svg')?.classList.contains('ds-ui-icon')).toBe(true)
    expect(render(<IconMessage />).container.querySelector('svg')?.classList.contains('ds-ui-icon')).toBe(
      true,
    )
    expect(render(<IconBot />).container.querySelector('.ds-ui-icon__stroke')).toBeTruthy()
    expect(render(<IconMessageCircle />).container.querySelector('.ds-ui-icon__stroke')).toBeTruthy()
    expect(render(<IconXCircle size={32} />).container.querySelector('svg')?.getAttribute('width')).toBe(
      '32',
    )
  })

  it('renders earlier waves as custom', () => {
    expect(render(<IconPlus />).container.querySelector('svg')?.classList.contains('ds-ui-icon')).toBe(true)
    expect(render(<IconPlay />).container.querySelector('svg')?.classList.contains('ds-ui-icon')).toBe(true)
    expect(render(<IconAlignLeft />).container.querySelector('svg')?.classList.contains('ds-ui-icon')).toBe(
      true,
    )
    expect(render(<IconOverview />).container.querySelector('svg')?.classList.contains('ds-ui-icon')).toBe(
      true,
    )
    expect(render(<IconCheck />).container.innerHTML).not.toMatch(/#fff|#ffffff|#000/i)
  })

  it('renders Storybook brand mark as ui-icon', () => {
    expect(render(<IconStorybook />).container.querySelector('svg')?.classList.contains('ui-icon')).toBe(
      true,
    )
  })
})
