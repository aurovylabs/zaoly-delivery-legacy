import { readFileSync } from 'node:fs'
import path from 'node:path'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Panel } from './Panel'

const primitivesCss = readFileSync(
  path.resolve(__dirname, '../css/primitives.css'),
  'utf8',
)
const componentsCss = readFileSync(
  path.resolve(__dirname, '../css/components.css'),
  'utf8',
)

describe('Panel', () => {
  it('defaults to editorial magazine shell', () => {
    render(<Panel>Body</Panel>)
    const el = screen.getByText('Body')
    expect(el.className).toContain('ds-panel--editorial')
    expect(el).toHaveAttribute('data-variant', 'editorial')
  })

  it('supports flush, card, and legacy default wash', () => {
    const { rerender } = render(<Panel variant="flush">Flush</Panel>)
    expect(screen.getByText('Flush').className).toContain('ds-panel--flush')
    rerender(<Panel variant="card">Card</Panel>)
    expect(screen.getByText('Card').className).toContain('ds-panel--card')
    rerender(<Panel variant="default">Wash</Panel>)
    expect(screen.getByText('Wash').className).toContain('ds-panel--default')
  })

  it('CSS keeps magazine variants fill-free and ops wash specificity-safe', () => {
    expect(primitivesCss).toMatch(/\.ds-panel\.ds-panel--editorial/)
    expect(primitivesCss).toMatch(/\.ds-panel\.ds-panel--card/)
    expect(primitivesCss).toMatch(/\.ds-panel\.ds-panel--default/)
    expect(primitivesCss).toMatch(
      /\.ds-panel\.ds-panel--editorial[\s\S]*?background:\s*transparent/,
    )
    expect(primitivesCss).toMatch(
      /\.ds-panel\.ds-panel--editorial[\s\S]*?border-radius:\s*0/,
    )
    expect(primitivesCss).toMatch(
      /\.ds-panel\.ds-panel--card[\s\S]*?border-radius:\s*0/,
    )
    expect(primitivesCss).toMatch(
      /\.ds-panel\.ds-panel--card[\s\S]*?background:\s*transparent/,
    )
    expect(primitivesCss).toMatch(
      /\.ds-panel\.ds-panel--default[\s\S]*?background:\s*var\(--surface-2\)/,
    )
    // Legacy alias must not reintroduce soft wash boxes
    expect(componentsCss).toMatch(/\.module-panel\s*\{[^}]*background:\s*transparent/)
    expect(componentsCss).not.toMatch(
      /\.module-panel\s*\{[^}]*background:\s*var\(--surface-2\)/,
    )
  })
})
