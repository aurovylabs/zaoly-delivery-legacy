import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ChatStepList } from './ChatStepList'

describe('ChatStepList', () => {
  it('renders step labels and status attributes', () => {
    const { container } = render(
      <ChatStepList
        steps={[
          { id: 's1', label: 'Research', status: 'done' },
          { id: 's2', label: 'Personas', status: 'running', progress: 60, detail: 'AUDION' },
          { id: 's3', label: 'Journey', status: 'pending' },
        ]}
      />,
    )
    expect(screen.getByText('Research')).toBeInTheDocument()
    expect(screen.getByText('Personas')).toBeInTheDocument()
    expect(screen.getByText(/AUDION · 60%/)).toBeInTheDocument()
    expect(container.querySelector('[data-status="running"]')).toBeTruthy()
    expect(container.querySelector('[data-status="done"]')).toBeTruthy()
  })
})
