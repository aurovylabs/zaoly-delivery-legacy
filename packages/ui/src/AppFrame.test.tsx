import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppFrame } from './components/AppFrame'
import { BrandCorner } from './components/BrandCorner'
import { NavRail } from './components/NavRail'
import {
  BOTTOM_LEFT_SHELL_CORNERS,
  BOTTOM_RIGHT_SHELL_CORNERS,
  TOP_LEFT_SHELL_CORNERS,
  TOP_RIGHT_BRAND_CORNERS,
} from './brand/zaolyCutdown'

describe('shared app shell primitives', () => {
  it('renders app frame, nav rail, brand corner, and shell cutouts', () => {
    render(
      <AppFrame
        rail={
          <NavRail
            dockable={false}
            logo={<span>AU</span>}
            logoLabel="AUDION home"
            items={[{ id: 'personas', label: 'Personas', href: '/personas', icon: 'PR', active: true }]}
          />
        }
        brandCorner={<BrandCorner label="AUDION" />}
        topbar={<div>Topbar</div>}
      >
        <div>Content</div>
      </AppFrame>,
    )

    const rail = document.querySelector('.nav-rail')
    expect(screen.getByTestId('brand-corner')).toBeInTheDocument()
    expect(screen.getByTestId('shell-corners')).toBeInTheDocument()
    expect(document.querySelectorAll('.shell-corner')).toHaveLength(3)
    for (const box of document.querySelectorAll('.shell-corner-box')) {
      expect((box as HTMLElement).style.width).toBe('0px')
      expect((box as HTMLElement).style.height).toBe('24px')
    }
    expect(rail).toBeInTheDocument()
    expect(rail).toHaveClass('nav-rail--static-dock')
    expect(rail).toHaveAttribute('data-orientation', 'vertical')
    expect(screen.getByRole('link', { name: 'Personas' })).toHaveClass('active')
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('can opt out of shell cutouts', () => {
    const { container } = render(
      <AppFrame shellCorners={false}>
        <div>Content</div>
      </AppFrame>,
    )
    expect(container.querySelector('[data-testid="shell-corners"]')).toBeNull()
  })

  it('keeps top-right for brand plaque; shell scoops face along the outer edge', () => {
    expect(TOP_RIGHT_BRAND_CORNERS.topRight).toBe('square')
    expect(TOP_LEFT_SHELL_CORNERS.topLeft).toBe('square')
    expect(TOP_LEFT_SHELL_CORNERS.topRight).toBe('cutdown-a')
    expect(BOTTOM_LEFT_SHELL_CORNERS.bottomLeft).toBe('square')
    expect(BOTTOM_LEFT_SHELL_CORNERS.bottomRight).toBe('cutdown-a')
    expect(BOTTOM_RIGHT_SHELL_CORNERS.bottomRight).toBe('square')
    expect(BOTTOM_RIGHT_SHELL_CORNERS.bottomLeft).toBe('cutdown-a')
  })
})
