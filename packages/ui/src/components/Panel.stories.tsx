import type { Meta, StoryObj } from '@storybook/react-vite'
import { Lede, LedeStrip } from './Lede'
import { Panel } from './Panel'
import { SectionChrome } from '../SectionChrome'
import { Text } from './Text'

const meta = {
  title: 'Molecules/Panel',
  component: Panel,
  tags: ['magazine'],
} satisfies Meta<typeof Panel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: 'Editorial (default)',
  render: () => (
    <Panel>
      <SectionChrome quiet title="Chapter band" meta="editorial" />
      <Text role="body" as="p">
        Top hairline, fill-free, square — same language as FilterRow / Lede.
      </Text>
      <LedeStrip columns={2} aria-label="Sample metrics">
        <Lede value="72" unit="%" label="Completion" tone="pos" />
        <Lede value="18" unit="%" label="Block rate" tone="low" />
      </LedeStrip>
    </Panel>
  ),
}

export const Flush: Story = {
  render: () => (
    <Panel variant="flush">
      <Text role="title" as="h3">
        Flush stage
      </Text>
      <Text role="body" as="p">
        No chrome — product owns the frame.
      </Text>
    </Panel>
  ),
}

export const Card: Story = {
  render: () => (
    <div style={{ width: '18rem' }}>
      <Panel variant="card">
        <Text role="title" as="h3">
          Collection tile
        </Text>
        <Text role="body" as="p">
          Square hairline tile — no wash.
        </Text>
      </Panel>
    </div>
  ),
}

export const Workstation: Story = {
  tags: ['workstation'],
  render: () => (
    <Panel variant="default">
      <Text role="title" as="h3">
        Ops module
      </Text>
      <Text role="body" as="p">
        Soft wash + panel radius — workstation only.
      </Text>
    </Panel>
  ),
}
