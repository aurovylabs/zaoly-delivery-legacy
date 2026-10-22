import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ExpressionField, parseExpressionSegments } from './ExpressionField'

describe('parseExpressionSegments', () => {
  it('splits complete expressions from literal text', () => {
    expect(parseExpressionSegments('{{ scan.scores.seo }}')).toEqual([
      { type: 'expression', value: 'scan.scores.seo', raw: '{{ scan.scores.seo }}' },
    ])
    expect(parseExpressionSegments('x {{ a }} y')).toEqual([
      { type: 'text', value: 'x ' },
      { type: 'expression', value: 'a', raw: '{{ a }}' },
      { type: 'text', value: ' y' },
    ])
  })

  it('treats bare node json paths as expressions', () => {
    expect(parseExpressionSegments("$('n-start').json.label")).toEqual([
      { type: 'expression', value: "$('n-start').json.label", raw: "$('n-start').json.label" },
    ])
  })
})

describe('ExpressionField', () => {
  it('renders label and updates value', () => {
    const onChange = vi.fn()
    render(<ExpressionField label="Path" value="a" onChange={onChange} />)
    expect(screen.getByLabelText('Path')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Path'), { target: { value: 'ab' } })
    expect(onChange).toHaveBeenCalledWith('ab')
  })

  it('shows expression chips in mirror layer', () => {
    const { container } = render(
      <ExpressionField label="Note" value="{{ scan.scores.seo }}" onChange={() => {}} />
    )
    expect(container.querySelector('.ds-expression-chip')?.textContent).toBe('scan.scores.seo')
    expect(screen.getByLabelText('Note')).toHaveClass('ds-expression-field-input--chip-overlay')
  })

  it('shows chips for bare node json paths', () => {
    const { container } = render(
      <ExpressionField
        label="Text"
        value="$('n-start').json.label"
        onChange={() => {}}
      />
    )
    expect(container.querySelector('.ds-expression-chip')?.textContent).toBe(
      "$('n-start').json.label"
    )
    expect(screen.getByLabelText('Text')).toHaveClass('ds-expression-field-input--chip-overlay')
  })

  it('shows hint', () => {
    render(
      <ExpressionField label="Path" value="" onChange={() => {}} hint="use {{ }}" />
    )
    expect(screen.getByText('use {{ }}')).toBeInTheDocument()
  })

  it('accepts dropped schema paths', () => {
    const onChange = vi.fn()
    const { container } = render(
      <ExpressionField label="Path" value="" onChange={onChange} />
    )
    const wrap = container.querySelector('.ds-expression-field-input-wrap')!
    fireEvent.dragOver(wrap, {
      dataTransfer: { types: ['application/x-zaoly-expression-path'], dropEffect: '' },
    })
    fireEvent.drop(wrap, {
      dataTransfer: {
        types: ['application/x-zaoly-expression-path'],
        getData: (type: string) =>
          type === 'application/x-zaoly-expression-path' ? 'scan.scores.accessibility' : '',
      },
    })
    expect(onChange).toHaveBeenCalledWith('{{ scan.scores.accessibility }}')
  })

  it('inserts dropped schema paths at the cursor position', () => {
    const onChange = vi.fn()
    const { container } = render(<ExpressionField label="Text" value="Hello " onChange={onChange} />)
    const input = screen.getByLabelText('Text') as HTMLInputElement
    input.focus()
    input.setSelectionRange(6, 6)
    fireEvent.mouseUp(input)
    const wrap = container.querySelector('.ds-expression-field-input-wrap')!
    fireEvent.dragOver(wrap, {
      dataTransfer: { types: ['application/x-zaoly-expression-path'], dropEffect: '' },
    })
    fireEvent.drop(wrap, {
      dataTransfer: {
        types: ['application/x-zaoly-expression-path'],
        getData: (type: string) =>
          type === 'application/x-zaoly-expression-path' ? "$('n-start').json.label" : '',
      },
    })
    expect(onChange).toHaveBeenCalledWith("Hello {{ $('n-start').json.label }}")
  })

  it('appends dropped schema paths when the field lost focus during drag', () => {
    const onChange = vi.fn()
    const { container } = render(<ExpressionField label="Text" value="A B" onChange={onChange} />)
    const input = screen.getByLabelText('Text') as HTMLInputElement
    input.focus()
    input.setSelectionRange(2, 2)
    fireEvent.mouseUp(input)
    fireEvent.blur(input)
    const wrap = container.querySelector('.ds-expression-field-input-wrap')!
    fireEvent.dragOver(wrap, {
      dataTransfer: { types: ['application/x-zaoly-expression-path'], dropEffect: '' },
    })
    fireEvent.drop(wrap, {
      dataTransfer: {
        types: ['application/x-zaoly-expression-path'],
        getData: (type: string) =>
          type === 'application/x-zaoly-expression-path' ? 'scan.scores.accessibility' : '',
      },
    })
    expect(onChange).toHaveBeenCalledWith('A B{{ scan.scores.accessibility }}')
  })

  it('does not mirror plain text (avoids double-paint over the input)', () => {
    const { container, unmount } = render(
      <ExpressionField label="Category" value="Application Status" onChange={() => {}} />
    )
    expect(container.querySelector('.ds-expression-field-mirror')).toBeNull()
    expect(screen.getByLabelText('Category')).not.toHaveClass(
      'ds-expression-field-input--chip-overlay'
    )
    unmount()
  })

  it('shows the matched suggestion label without duplicating input ink', () => {
    const { container, unmount } = render(
      <ExpressionField
        label="Value"
        value="kpi:kpi-hired"
        onChange={() => {}}
        suggestions={[
          { value: 'kpi:kpi-hired', label: 'Hired' },
          { value: 'kpi:kpi-apps', label: 'Applications' },
        ]}
      />
    )
    expect(container.querySelector('.ds-expression-field-mirror')?.textContent).toBe('Hired')
    expect(screen.getByLabelText('Value')).toHaveClass('ds-expression-field-input--chip-overlay')
    unmount()
  })

  it('picks a suggestion via the chevron listbox', () => {
    const onChange = vi.fn()
    const { unmount, getByTestId } = render(
      <ExpressionField
        label="Value"
        value=""
        onChange={onChange}
        suggestions={[
          { value: 'kpi:kpi-hired', label: 'Hired' },
          { value: 'kpi:kpi-apps', label: 'Applications' },
        ]}
      />
    )
    fireEvent.click(getByTestId('expression-field-pick'))
    expect(screen.getByTestId('expression-field-suggestions')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('option', { name: 'Hired' }))
    expect(onChange).toHaveBeenCalledWith('kpi:kpi-hired')
    unmount()
  })

  it('hides the pick control when suggestions are omitted', () => {
    const { container, unmount } = render(
      <ExpressionField label="Path" value="" onChange={() => {}} />
    )
    expect(container.querySelector('[data-testid="expression-field-pick"]')).toBeNull()
    unmount()
  })
})
