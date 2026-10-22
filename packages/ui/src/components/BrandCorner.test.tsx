import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { BrandCorner } from './BrandCorner'

const frameCss = readFileSync(path.resolve(__dirname, '../css/frame.css'), 'utf8')
const ultraCss = readFileSync(path.resolve(__dirname, '../css/ultra-wide.css'), 'utf8')

afterEach(() => {
  cleanup()
})

describe('BrandCorner', () => {
  it('renders plaque with label', () => {
    render(<BrandCorner label="AUDION" />)
    expect(screen.getByTestId('brand-corner')).toBeTruthy()
    expect(screen.getByText('AUDION')).toBeTruthy()
  })

  it('defaults to hover label reveal with collapse class', () => {
    render(<BrandCorner label="AUDION" />)
    const root = screen.getByTestId('brand-corner')
    expect(root).toHaveClass('brand-corner--collapse-label')
    expect(root).toHaveAttribute('data-label-reveal', 'hover')
    expect(within(root).getByLabelText('AUDION')).toBeInTheDocument()
  })

  it('keeps label always visible when labelReveal=always', () => {
    render(<BrandCorner label="CHECKION" labelReveal="always" />)
    const root = screen.getByTestId('brand-corner')
    expect(root).not.toHaveClass('brand-corner--collapse-label')
    expect(root).toHaveAttribute('data-label-reveal', 'always')
  })

  it('CSS keeps plaque flush (no 1px border gap at viewport edge)', () => {
    expect(frameCss).toMatch(/\.brand-corner\s*\{[^}]*top:\s*0/)
    expect(frameCss).toMatch(/\.brand-corner\s*\{[^}]*right:\s*0/)
    expect(frameCss).toMatch(/\.brand-corner-box\s*\{[^}]*border:\s*0/)
    expect(frameCss).not.toMatch(/\.brand-corner-box\s*\{[^}]*border:\s*1px/)
    expect(ultraCss).toMatch(/\.brand-corner-box\s*\{[^}]*border:\s*0/)
  })

  it('CSS collapses label and expands on hover toward the left', () => {
    expect(frameCss).toMatch(/\.brand-corner--collapse-label\s+\.brand-corner-reveal/)
    expect(frameCss).toMatch(/grid-template-columns:\s*0fr/)
    expect(frameCss).toMatch(/\.brand-corner-box:hover\s+\.brand-corner-reveal/)
    expect(frameCss).toMatch(/pointer-events:\s*auto/)
    expect(frameCss).toMatch(/prefers-reduced-motion:\s*reduce/)
  })
})
