import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Stack } from './Stack'
import { Card } from './Card'
import { Badge } from './Badge'
import { Heading } from './Heading'
import { Image } from './Image'
import { Link } from './Link'
import { Spacer } from './Spacer'
import { Grid } from './Grid'
import { CanvasViewport } from './CanvasViewport'
import { SelectionHandles } from './SelectionHandles'
import { PropertyInspector } from './PropertyInspector'
import { ComponentPalette } from './ComponentPalette'
import { LayersPanel } from './LayersPanel'
import { TokenPicker } from './TokenPicker'
import { BreakpointSwitcher } from './BreakpointSwitcher'
import { InspectTabs } from './InspectTabs'

afterEach(() => {
  cleanup()
})

describe('creation editor primitives', () => {
  it('Stack renders children with direction class', () => {
    render(<Stack direction="row">Hello</Stack>)
    expect(screen.getByText('Hello').className).toContain('ds-stack--row')
  })

  it('Card renders children', () => {
    render(<Card>Card body</Card>)
    expect(screen.getByText('Card body')).toBeInTheDocument()
  })

  it('Badge applies tone', () => {
    render(<Badge tone="accent">New</Badge>)
    expect(screen.getByText('New').className).toContain('ds-badge--accent')
  })

  it('Heading uses level tag', () => {
    render(<Heading level={3}>Title</Heading>)
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Title')
  })

  it('Image requires alt', () => {
    render(<Image src="/x.png" alt="Demo" />)
    expect(screen.getByAltText('Demo')).toBeInTheDocument()
  })

  it('Link renders href', () => {
    render(<Link href="/docs">Docs</Link>)
    expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/docs')
  })

  it('Spacer is aria-hidden', () => {
    const { container } = render(<Spacer size="lg" />)
    expect(container.querySelector('.ds-spacer--lg')).toHaveAttribute('aria-hidden')
  })

  it('Grid sets template columns', () => {
    const { container } = render(
      <Grid columns={3}>
        <span>a</span>
      </Grid>,
    )
    expect((container.firstChild as HTMLElement).style.gridTemplateColumns).toContain('repeat(3')
  })

  it('CanvasViewport exposes artboard', () => {
    render(
      <CanvasViewport zoom={0.5}>
        <span>Scene</span>
      </CanvasViewport>,
    )
    expect(screen.getByTestId('canvas-artboard')).toBeInTheDocument()
    expect(screen.getByText('Scene')).toBeInTheDocument()
  })

  it('SelectionHandles can hide', () => {
    const { rerender } = render(<SelectionHandles visible />)
    expect(screen.getByTestId('selection-handles')).toBeInTheDocument()
    rerender(<SelectionHandles visible={false} />)
    expect(screen.queryByTestId('selection-handles')).toBeNull()
  })

  it('PropertyInspector shows empty state', () => {
    render(<PropertyInspector />)
    expect(screen.getByText('Select a node')).toBeInTheDocument()
  })

  it('ComponentPalette calls onAdd', () => {
    const onAdd = vi.fn()
    render(
      <ComponentPalette
        items={[{ id: 'Button', label: 'Button' }]}
        onAdd={onAdd}
      />,
    )
    screen.getByRole('button', { name: /Button/i }).click()
    expect(onAdd).toHaveBeenCalledWith('Button')
  })

  it('TokenPicker selects path and clears via onClear', () => {
    const onChange = vi.fn()
    const onClear = vi.fn()
    render(
      <TokenPicker
        options={[{ path: 'color.accent', preview: '#245' }]}
        value="color.accent"
        onChange={onChange}
        onClear={onClear}
        clearLabel="Clear"
        variant="list"
      />,
    )
    screen.getByRole('option', { name: /color.accent/ }).click()
    expect(onChange).toHaveBeenCalledWith('color.accent')
    screen.getByRole('button', { name: 'Clear' }).click()
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('LayersPanel selects an item', () => {
    const onSelect = vi.fn()
    render(
      <LayersPanel
        items={[{ id: 'n1', label: 'Title', type: 'Text' }]}
        onSelect={onSelect}
      />,
    )
    screen.getByTestId('layers-panel-item-n1').click()
    expect(onSelect).toHaveBeenCalledWith('n1', {
      shiftKey: false,
      metaKey: false,
      ctrlKey: false,
    })
  })

  it('BreakpointSwitcher changes breakpoint', () => {
    const onChange = vi.fn()
    render(<BreakpointSwitcher value="desktop" onChange={onChange} />)
    screen.getByTestId('breakpoint-switcher-tablet').click()
    expect(onChange).toHaveBeenCalledWith('tablet')
  })

  it('InspectTabs switches Design/CSS', () => {
    const onChange = vi.fn()
    render(<InspectTabs value="design" onChange={onChange} />)
    screen.getByTestId('inspect-tab-css').click()
    expect(onChange).toHaveBeenCalledWith('css')
  })
})
