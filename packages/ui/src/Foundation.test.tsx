import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  Alert,
  EmptyState,
  FilterRow,
  Hint,
  LoadingText,
  MetricChip,
  PageTitle,
  Panel,
  StatusDot,
  Textarea,
  ToggleGroup,
  Chip,
} from './index'

afterEach(() => {
  cleanup()
})

describe('Foundation primitives', () => {
  it('Panel dual-classes module-panel', () => {
    const { container } = render(<Panel>Body</Panel>)
    const el = container.firstElementChild as HTMLElement
    expect(el.tagName).toBe('SECTION')
    expect(el.className).toContain('ds-panel')
    expect(el.className).toContain('module-panel')
  })

  it('MetricChip renders label + value', () => {
    render(
      <MetricChip label="Queue" icon={<span data-testid="ic">i</span>}>
        3
      </MetricChip>,
    )
    expect(screen.getByText('Queue')).toBeTruthy()
    expect(screen.getByText('3')).toBeTruthy()
    expect(screen.getByTestId('ic')).toBeTruthy()
  })

  it('PageTitle is h1 with page-title class', () => {
    render(<PageTitle>Signals</PageTitle>)
    const h = screen.getByRole('heading', { level: 1, name: 'Signals' })
    expect(h.className).toContain('ds-page-title')
    expect(h.className).toContain('page-title')
  })

  it('Textarea shares Input face classes', () => {
    render(<Textarea aria-label="Ask" block size="md" />)
    const el = screen.getByLabelText('Ask')
    expect(el.className).toContain('ds-textarea')
    expect(el.className).toContain('ds-input')
    expect(el.className).toContain('ds-textarea--md')
    expect(el.className).toContain('ds-input--md')
    expect(el.className).toContain('ds-textarea--block')
    expect(el.className).toContain('ds-input--block')
  })

  it('ToggleGroup selects via Chip', () => {
    const onChange = vi.fn()
    render(
      <ToggleGroup
        aria-label="Locale"
        value="de"
        onChange={onChange}
        options={[
          { value: 'de', label: 'DE' },
          { value: 'en', label: 'EN' },
        ]}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'EN' }))
    expect(onChange).toHaveBeenCalledWith('en')
  })

  it('ToggleGroup icon variant uses option label as accessible name', () => {
    const onChange = vi.fn()
    render(
      <ToggleGroup
        aria-label="Align"
        variant="icon"
        value="start"
        onChange={onChange}
        options={[
          { value: 'start', label: 'start', icon: <span data-testid="align-start">S</span> },
          { value: 'center', label: 'center', icon: <span>C</span> },
        ]}
      />,
    )
    const group = screen.getByRole('group', { name: 'Align' })
    expect(group.className).toContain('ds-toggle-group--icon')
    expect(screen.getByTestId('align-start')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'center' }))
    expect(onChange).toHaveBeenCalledWith('center')
  })

  it('Hint / FilterRow / StatusDot / Alert / Loading / Empty', () => {
    const { container } = render(
      <>
        <Hint panel>path</Hint>
        <FilterRow>
          <Chip>A</Chip>
        </FilterRow>
        <StatusDot level="warn" />
        <Alert tone="error">Boom</Alert>
        <LoadingText>Loading</LoadingText>
        <EmptyState>Empty</EmptyState>
      </>,
    )
    expect(screen.getByText('path').className).toContain('panel-hint')
    expect(container.querySelector('.ds-filter-row')).toBeTruthy()
    expect(container.querySelector('.status-dot.level-warn')).toBeTruthy()
    expect(screen.getByRole('alert').textContent).toBe('Boom')
    expect(screen.getByRole('status').textContent).toBe('Loading')
    expect(screen.getByText('Empty').className).toContain('ds-empty')
  })
})
