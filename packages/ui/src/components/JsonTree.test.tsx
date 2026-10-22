import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { JsonTree } from './JsonTree'

describe('JsonTree', () => {
  it('renders paths and calls onSelectPath', () => {
    const onSelectPath = vi.fn()
    render(
      <JsonTree
        items={[{ path: 'scan.overallScore', value: '70' }]}
        onSelectPath={onSelectPath}
      />
    )
    expect(screen.getByText('scan.overallScore')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /scan\.overallScore/i }))
    expect(onSelectPath).toHaveBeenCalledWith('scan.overallScore')
  })

  it('shows empty label', () => {
    render(<JsonTree items={[]} emptyLabel="leer" />)
    expect(screen.getByText('leer')).toBeInTheDocument()
  })
})
