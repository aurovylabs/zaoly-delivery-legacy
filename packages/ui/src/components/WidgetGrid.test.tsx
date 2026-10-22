import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { WidgetGrid } from './WidgetGrid'

afterEach(() => {
  cleanup()
})

describe('WidgetGrid', () => {
  it('places items with col/row span data attrs', () => {
    render(
      <WidgetGrid columns={12}>
        <WidgetGrid.Item colSpan={8} rowSpan={2}>
          Wide
        </WidgetGrid.Item>
        <WidgetGrid.Item colSpan={4}>Narrow</WidgetGrid.Item>
      </WidgetGrid>,
    )
    expect(document.querySelector('.ds-widget-grid')?.getAttribute('data-columns')).toBe('12')
    expect(document.querySelector('[data-col-span="8"]')).toBeTruthy()
    expect(document.querySelector('[data-row-span="2"]')).toBeTruthy()
  })

  it('applies joined board class and forces gap none', () => {
    const { container } = render(
      <WidgetGrid columns={12} joined gap="lg">
        <WidgetGrid.Item colSpan={6}>A</WidgetGrid.Item>
      </WidgetGrid>,
    )
    const grid = container.querySelector('.ds-widget-grid')
    expect(grid?.classList.contains('ds-widget-grid--joined')).toBe(true)
    expect(grid?.classList.contains('ds-widget-grid--gap-none')).toBe(true)
    expect(grid?.getAttribute('data-joined')).toBe('true')
  })
})
