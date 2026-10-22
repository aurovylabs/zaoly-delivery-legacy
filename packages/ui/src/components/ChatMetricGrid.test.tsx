import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ChatMetricGrid } from './ChatMetricGrid'

describe('ChatMetricGrid', () => {
  it('renders labels, values, and units', () => {
    render(
      <ChatMetricGrid
        items={[
          { label: 'PageSpeed', value: 92, unit: '/100', tone: 'success' },
          { label: 'Scans', value: 12, hint: 'CHECKION' },
        ]}
      />,
    )
    expect(screen.getByText('PageSpeed')).toBeInTheDocument()
    expect(screen.getByText('92')).toBeInTheDocument()
    expect(screen.getByText('/100')).toBeInTheDocument()
    expect(screen.getByText('Scans')).toBeInTheDocument()
    expect(screen.getByText('CHECKION')).toBeInTheDocument()
  })
})
