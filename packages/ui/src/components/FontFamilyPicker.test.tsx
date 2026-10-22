import { describe, expect, it, vi, afterEach } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { FontFamilyPicker } from './FontFamilyPicker'

afterEach(() => cleanup())

describe('FontFamilyPicker', () => {
  it('selects catalog font', () => {
    const onChange = vi.fn()
    render(
      <FontFamilyPicker value="Roboto" onChange={onChange} data-testid="font" />,
    )
    fireEvent.click(screen.getByTestId('font-option-Inter'))
    expect(onChange).toHaveBeenCalledWith('Inter')
  })

  it('filters list via search', () => {
    render(<FontFamilyPicker value="" onChange={() => {}} data-testid="font" />)
    fireEvent.change(screen.getByTestId('font-search-input'), { target: { value: 'JetBrains' } })
    expect(screen.getByTestId('font-option-JetBrains-Mono')).toBeInTheDocument()
    expect(screen.queryByTestId('font-option-Inter')).toBeNull()
  })

  it('caps visible rows when maxListResults is set', () => {
    const bigCatalog = Array.from({ length: 100 }, (_, i) => ({
      family: `Font ${i}`,
      category: 'sans-serif' as const,
    }))
    render(
      <FontFamilyPicker
        value=""
        onChange={() => {}}
        catalog={bigCatalog}
        maxListResults={5}
        labels={{ search: 'Search', family: 'Family', custom: 'Custom', moreResults: 'More' }}
        data-testid="font"
      />,
    )
    expect(screen.getByTestId('font-option-Font-0')).toBeInTheDocument()
    expect(screen.queryByTestId('font-option-Font-5')).toBeNull()
    expect(screen.getByTestId('font-more-results')).toHaveTextContent('More')
  })
})
