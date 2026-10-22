import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Lede, LedeStrip } from './Lede'
import { DivergingBarList } from './DivergingBar'

const meta = {
  title: 'Molecules/Lede',
  component: LedeStrip,
  tags: ['magazine'],
} satisfies Meta<typeof LedeStrip>

export default meta
type Story = StoryObj<typeof meta>

export const Metrics: Story = {
  render: () => (
    <LedeStrip aria-label="Wave summary" columns={3}>
      <Lede value={33} unit="%" label="Task completion" tone="low" />
      <Lede value={33} unit="%" label="Valid evidence" tone="low" />
      <Lede value={100} unit="%" label="Infrastructure block" tone="neg" />
    </LedeStrip>
  ),
}

export const Steps: Story = {
  render: function StepsStory() {
    const [activeIndex, setActiveIndex] = useState(1)
    return (
      <LedeStrip
        variant="steps"
        activeIndex={activeIndex}
        onStepSelect={setActiveIndex}
        steps={[
          { id: 'basics', label: 'Basics' },
          { id: 'traits', label: 'Traits' },
          { id: 'review', label: 'Review' },
          { id: 'publish', label: 'Publish' },
        ]}
      />
    )
  },
}

export const WithBars: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <LedeStrip aria-label="Scores" columns={2}>
        <Lede value={1.4} label="Trust" tone="pos" />
        <Lede value={-0.9} label="Friction" tone="neg" />
      </LedeStrip>
      <DivergingBarList
        items={[
          { id: 'a', label: 'Affordance', value: -0.67 },
          { id: 'c', label: 'Copy', value: 1.5 },
        ]}
      />
    </div>
  ),
}
