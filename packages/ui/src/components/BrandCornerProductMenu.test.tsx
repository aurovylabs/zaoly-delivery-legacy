import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { BrandCorner } from './BrandCorner'
import { BrandCornerProductMenu } from './BrandCornerProductMenu'
import { ProductSwitcherPanel } from './ProductSwitcherPanel'

const frameCss = readFileSync(path.resolve(__dirname, '../css/frame.css'), 'utf8')

const ITEMS = [
  { id: 'plexon', label: 'PLEXON', href: 'https://plexon.example/' },
  { id: 'creation', label: 'CREATION', href: 'https://creation.example/' },
  { id: 'checkion', label: 'CHECKION', href: 'https://checkion.example/' },
]

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('ProductSwitcherPanel', () => {
  it('marks current product and disables its button', () => {
    render(<ProductSwitcherPanel items={ITEMS} currentProductId="creation" />)
    const current = screen.getByRole('menuitem', { name: 'CREATION' })
    expect(current).toBeDisabled()
    expect(current).toHaveClass('product-switcher-panel__item--current')
  })

  it('calls onSelectItem for launchable products', () => {
    const onSelectItem = vi.fn()
    render(
      <ProductSwitcherPanel
        items={ITEMS}
        currentProductId="creation"
        onSelectItem={onSelectItem}
      />,
    )
    fireEvent.click(screen.getByRole('menuitem', { name: 'PLEXON' }))
    expect(onSelectItem).toHaveBeenCalledWith(expect.objectContaining({ id: 'plexon' }))
  })
})

describe('BrandCorner product menu', () => {
  it('opens menu inside the plaque on header click', () => {
    render(
      <BrandCorner label="CREATION" currentProductId="creation" menuItems={ITEMS} />,
    )
    expect(screen.queryByTestId('product-switcher-panel')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'CREATION' }))
    expect(screen.getByTestId('product-switcher-panel')).toBeInTheDocument()
    expect(screen.getByTestId('product-switcher-panel')).toHaveClass('brand-corner-menu')
  })

  it('closes on Escape', () => {
    render(
      <BrandCorner label="CREATION" currentProductId="creation" menuItems={ITEMS} />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'CREATION' }))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByTestId('product-switcher-panel')).toBeNull()
  })

  it('delegates selection to onMenuSelectItem', () => {
    const onMenuSelectItem = vi.fn()
    render(
      <BrandCorner
        label="CREATION"
        currentProductId="creation"
        menuItems={ITEMS}
        onMenuSelectItem={onMenuSelectItem}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'CREATION' }))
    fireEvent.click(within(screen.getByTestId('product-switcher-panel')).getByRole('menuitem', { name: 'PLEXON' }))
    expect(onMenuSelectItem).toHaveBeenCalledWith(expect.objectContaining({ id: 'plexon' }))
  })

  it('BrandCornerProductMenu alias forwards to BrandCorner', () => {
    render(<BrandCornerProductMenu label="CREATION" currentProductId="creation" items={ITEMS} />)
    expect(screen.getByTestId('brand-corner')).toHaveClass('brand-corner--has-menu')
  })

  it('CSS keeps product list inside brand-corner-box', () => {
    expect(frameCss).toMatch(/\.brand-corner-menu\s*\{/)
    expect(frameCss).toMatch(/\.product-switcher-panel--embedded/)
    expect(frameCss).not.toMatch(/\.brand-corner-product-menu__panel/)
  })
})
