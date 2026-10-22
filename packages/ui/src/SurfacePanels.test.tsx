import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { KpiStrip } from './components/KpiStrip'
import { PipelinePanel } from './components/PipelinePanel'
import { StatusMeterPanel } from './components/StatusMeterPanel'
import { TopStatus } from './components/TopStatus'

describe('shared overview surfaces', () => {
  it('renders KPI, status, and pipeline surfaces', () => {
    render(
      <div>
        <TopStatus primary="ready" secondary={<strong>12 complete</strong>} />
        <KpiStrip items={[{ id: 'total', label: 'Total', value: '18' }]} />
        <PipelinePanel
          title="Persona pipeline"
          lanes={[
            { id: 'draft', label: 'Draft', value: '4', fillPct: 40, tone: 'enrich' },
            { id: 'ready', label: 'Ready', value: '12', fillPct: 80, tone: 'embed' },
          ]}
              focusSlot={{ label: 'Review slot', value: 'idle', state: 'idle', fillPct: 12, meta: 'No blocker' }}
          operations={[{ id: 'coverage', label: 'Coverage', state: 'active', detail: '14 / 18 complete', fillPct: 78 }]}
        />
        <StatusMeterPanel
          title="Workspace health"
          banner="Stable"
          meters={[{ id: 'quality', label: 'Quality', value: '78%', fillPct: 78, meta: '14 / 18 ready' }]}
        />
      </div>,
    )

    expect(screen.getByText('Persona pipeline')).toBeInTheDocument()
    expect(screen.getByText('Workspace health')).toBeInTheDocument()
    expect(screen.getByText('Stable')).toBeInTheDocument()
    expect(screen.getByText('Total')).toBeInTheDocument()
  })
})
