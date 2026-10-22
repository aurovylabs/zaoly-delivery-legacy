import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Panel } from './Panel'
import { StepStrip, StepStripItem } from './StepStrip'

const meta = {
  title: 'Molecules/StepStrip',
  component: StepStrip,
} satisfies Meta<typeof StepStrip>

export default meta
type Story = StoryObj<typeof meta>

function Demo() {
  const [selected, setSelected] = useState<number | null>(0)
  const [expanded, setExpanded] = useState<number | null>(0)
  return (
    <StepStrip
      header={<h3 style={{ margin: 0 }}>Steps</h3>}
      hint="Select a step to keep chatting about that moment."
      scrollToIndex={expanded ?? selected}
    >
      {[0, 1, 2].map((i) => (
        <StepStripItem
          key={i}
          index={i}
          label={`Step ${i + 1}`}
          selected={selected === i}
          expanded={expanded === i}
          active={i === 2}
          onActivate={() => {
            setSelected(i)
            setExpanded((prev) => (prev === i ? null : i))
          }}
        >
          <Panel as="div" style={{ padding: '0.75rem' }}>
            <strong>Step {String(i + 1).padStart(2, '0')}</strong>
            <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)' }}>
              {expanded === i ? 'Expanded detail body.' : 'Compact preview.'}
            </p>
          </Panel>
        </StepStripItem>
      ))}
    </StepStrip>
  )
}

export const Default: Story = {
  render: () => <Demo />,
}

export const Vertical: Story = {
  render: () => (
    <div style={{ width: '20rem', border: '1px solid var(--line)', padding: '0.75rem' }}>
      <StepStrip orientation="vertical" hint="Drawer / inspect stack" scrollToIndex={1}>
        {['Import', 'Metadaten', 'Szenen', 'Audio'].map((label, i) => (
          <StepStripItem key={label} index={i} label={label} selected={i === 1} active={i === 2}>
            <Panel as="div" style={{ padding: '0.55rem 0.65rem' }}>
              <strong>{label}</strong>
              <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.8rem' }}>Fertig</p>
            </Panel>
          </StepStripItem>
        ))}
      </StepStrip>
    </div>
  ),
}
