import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Lede, LedeStrip } from './Lede'
import { WizardSteps } from './WizardSteps'
import { StatLede, StatLedeGroup } from './StatLede'

describe('Lede / LedeStrip', () => {
  it('renders metrics band', () => {
    render(
      <LedeStrip aria-label="Summary" columns={3}>
        <Lede value={33} unit="%" label="Task completion" tone="low" />
      </LedeStrip>,
    )
    expect(screen.getByLabelText('Summary')).toHaveAttribute('data-variant', 'metrics')
    expect(screen.getByText('33')).toBeTruthy()
    expect(screen.getByText('Task completion')).toBeTruthy()
  })

  it('renders steps band with active state', () => {
    render(
      <LedeStrip
        variant="steps"
        activeIndex={1}
        steps={[
          { id: 'a', label: 'Basics' },
          { id: 'b', label: 'Hyps' },
          { id: 'c', label: 'Target' },
        ]}
      />,
    )
    expect(screen.getByText('Hyps').closest('li')).toHaveAttribute('data-state', 'active')
    expect(screen.getByText('Basics').closest('li')).toHaveAttribute('data-state', 'done')
  })

  it('keeps StatLede and WizardSteps aliases', () => {
    render(
      <StatLedeGroup aria-label="Alias">
        <StatLede value={1} label="One" />
      </StatLedeGroup>,
    )
    expect(screen.getByLabelText('Alias')).toBeTruthy()
    render(
      <WizardSteps
        activeIndex={0}
        steps={[{ id: 'x', label: 'Only' }]}
      />,
    )
    expect(screen.getByText('Only').closest('li')).toHaveAttribute('data-state', 'active')
  })
})
