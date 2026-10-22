// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { TokenComposeField } from '../components/token-compose-field'

const t = (key: string) => key.replace(/^tokens\./, '')

describe('TokenComposeField', () => {
  it('links the literal value to a smart derived calc from the top-ranked base', () => {
    const onChange = vi.fn()
    render(
      <TokenComposeField
        type="spacing"
        value="1rem"
        onChange={onChange}
        candidates={['spacing.static.medium', 'spacing.inset.md']}
        resolveCss={(path) => (path === 'spacing.static.medium' ? '1rem' : '0.5rem')}
        literal={<div data-testid="literal-slot">1rem</div>}
        t={t}
      />,
    )
    expect(screen.getByTestId('literal-slot')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('token-compose-link'))
    expect(onChange).toHaveBeenCalledWith('calc({spacing.static.medium} * 2)')
  })

  it('applies a color shade preset on the same value field', () => {
    const onChange = vi.fn()
    render(
      <TokenComposeField
        type="color"
        value="color-mix(in oklch, {color.action.primary} 22%, white)"
        onChange={onChange}
        candidates={['color.action.primary', 'color.brand.primary']}
        resolveCss={(path) => (path === 'color.action.primary' ? '#1f44ff' : '#111111')}
        literal={<div />}
        t={t}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /composeShadeDark/i }))
    expect(onChange).toHaveBeenCalledWith(
      'color-mix(in oklch, {color.action.primary} 55%, black)',
    )
  })

  it('maps expressions onto the digital value field with chrome + resolve', () => {
    render(
      <TokenComposeField
        type="spacing"
        value="calc({spacing.static.medium} * 2)"
        onChange={vi.fn()}
        candidates={['spacing.static.medium']}
        resolveCss={(path) => (path === 'spacing.static.medium' ? '1rem' : null)}
        literal={<div data-testid="literal-slot" />}
        t={t}
      />,
    )
    expect(screen.queryByTestId('literal-slot')).not.toBeInTheDocument()
    expect(screen.getByTestId('token-compose-expr')).toBeInTheDocument()
    expect(screen.getByTestId('token-compose-expr-input')).toHaveValue(
      'calc({spacing.static.medium} * 2)',
    )
    expect(screen.getByLabelText(/^value$/i)).toBeInTheDocument()
    expect(screen.getByTestId('token-compose-resolve')).toHaveTextContent('→ calc(1rem * 2)')
    expect(screen.getByTestId('token-compose-unlink')).toBeInTheDocument()
  })

  it('shows unresolved state when refs cannot resolve', () => {
    render(
      <TokenComposeField
        type="color"
        value="color-mix(in oklch, {color.missing} 22%, white)"
        onChange={vi.fn()}
        candidates={['color.action.primary']}
        resolveCss={() => null}
        literal={<div />}
        t={t}
      />,
    )
    expect(screen.getByTestId('token-compose-resolve')).toHaveTextContent('composeUnresolved')
  })
})
