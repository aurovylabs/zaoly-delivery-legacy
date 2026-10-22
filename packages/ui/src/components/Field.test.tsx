import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  cleanup()
})
import { Field } from './Field'
import { Input } from './Input'
import { Select } from './Select'
import { TagInput } from './TagInput'
import { ConfirmDialog } from './ConfirmDialog'

const opts = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma', disabled: true },
]

describe('Field', () => {
  it('associates label with custom select combobox', () => {
    render(
      <Field label="Status" htmlFor="status-field">
        <Select options={opts} defaultValue="a" />
      </Field>,
    )
    const trigger = screen.getByLabelText('Status')
    expect(trigger).toHaveAttribute('id', 'status-field')
    expect(trigger).toHaveAttribute('role', 'combobox')
    expect(trigger.className).toContain('ds-select-trigger')
    expect(trigger.closest('.ds-select')?.className).toContain('ds-select--sm')
  })

  it('forwards size and supports inline layout', () => {
    const { container } = render(
      <Field label="Sort" size="md" layout="inline">
        <Select options={opts} defaultValue="a" />
      </Field>,
    )
    expect(container.querySelector('.ds-field--inline')).toBeTruthy()
    expect(container.querySelector('.ds-field--md')).toBeTruthy()
    expect(container.querySelector('.ds-select--md')).toBeTruthy()
  })

  it('renders an optional leading icon in the label', () => {
    render(
      <Field label="Width" icon={<span data-testid="field-icon">W</span>}>
        <Input />
      </Field>,
    )
    expect(screen.getByTestId('field-icon')).toBeTruthy()
    expect(screen.getByText('Width')).toBeTruthy()
    expect(screen.getByRole('textbox')).toHaveAttribute('id')
  })

  it('renders hint text', () => {
    render(
      <Field label="Q" hint="Helper">
        <Input />
      </Field>,
    )
    expect(screen.getByText('Helper')).toBeTruthy()
  })

  it('surfaces error with aria-invalid and alert', () => {
    render(
      <Field label="Name" error="Required" htmlFor="name-field">
        <Input />
      </Field>,
    )
    const input = screen.getByLabelText('Name')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input.getAttribute('aria-describedby')).toContain('name-field-error')
    expect(screen.getByRole('alert')).toHaveTextContent('Required')
    expect(input.className).toContain('ds-control--invalid')
  })
})

describe('TagInput', () => {
  it('adds tag on Enter and removes via dismiss', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <TagInput value={[]} onChange={onChange} aria-label="Goals" />,
    )
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Grow ARR' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith(['Grow ARR'])

    rerender(<TagInput value={['Grow ARR']} onChange={onChange} aria-label="Goals" />)
    fireEvent.click(screen.getByRole('button', { name: 'Remove Grow ARR' }))
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('removes last tag on Backspace when draft empty', () => {
    const onChange = vi.fn()
    render(<TagInput value={['A', 'B']} onChange={onChange} />)
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Backspace' })
    expect(onChange).toHaveBeenCalledWith(['A'])
  })
})

describe('ConfirmDialog', () => {
  it('calls onConfirm then closes', () => {
    const onConfirm = vi.fn()
    const onClose = vi.fn()
    render(
      <ConfirmDialog open onClose={onClose} onConfirm={onConfirm} title="Archive?">
        Remove this item?
      </ConfirmDialog>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('Input', () => {
  it('applies ds classes; block is full width without legacy search-input', () => {
    const { rerender } = render(<Input size="md" aria-label="Search" placeholder="Find…" />)
    let input = screen.getByLabelText('Search')
    expect(input.className).toContain('ds-input')
    expect(input.className).toContain('ds-input--md')
    expect(input.className).not.toContain('search-input')
    rerender(<Input block size="md" aria-label="Search" placeholder="Find…" />)
    input = screen.getByLabelText('Search')
    expect(input.className).toContain('ds-input--block')
    expect(input.className).not.toContain('search-input')
    rerender(
      <Input block size="md" className="search-input" aria-label="Search" placeholder="Find…" />,
    )
    input = screen.getByLabelText('Search')
    expect(input.className).toContain('search-input')
  })

  it('fires onChange', () => {
    const onChange = vi.fn()
    render(<Input aria-label="Q" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('Q'), { target: { value: 'x' } })
    expect(onChange).toHaveBeenCalledTimes(1)
  })
})

describe('Select (custom)', () => {
  it('opens listbox, chooses option, closes', () => {
    const onChange = vi.fn()
    render(
      <Select
        aria-label="Status"
        value="a"
        onChange={onChange}
        options={opts}
      />,
    )
    const trigger = screen.getByRole('combobox', { name: 'Status' })
    expect(screen.queryByRole('listbox')).toBeNull()
    fireEvent.click(trigger)
    expect(screen.getByRole('listbox')).toBeTruthy()
    fireEvent.click(screen.getByRole('option', { name: 'Beta' }))
    expect(onChange).toHaveBeenCalledWith('b')
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('supports keyboard open / move / commit / escape', () => {
    const onChange = vi.fn()
    render(
      <Select
        aria-label="Status"
        value="a"
        onChange={onChange}
        options={opts}
      />,
    )
    const trigger = screen.getByRole('combobox', { name: 'Status' })
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    expect(screen.getByRole('listbox')).toBeTruthy()
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    fireEvent.keyDown(trigger, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith('b')
    expect(screen.queryByRole('listbox')).toBeNull()

    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    fireEvent.keyDown(trigger, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('does not render a native select element', () => {
    const { container } = render(
      <Select aria-label="Status" options={opts} defaultValue="a" />,
    )
    expect(container.querySelector('select')).toBeNull()
  })

  it('tolerates missing options (docs/HMR)', () => {
    const { container } = render(
      // @ts-expect-error intentional undefined options
      <Select aria-label="Empty" options={undefined} />,
    )
    expect(container.querySelector('.ds-select')).toBeTruthy()
    expect(screen.getByRole('combobox', { name: 'Empty' })).toBeTruthy()
  })
})
