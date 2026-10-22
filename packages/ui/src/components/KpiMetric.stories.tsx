import type { Meta, StoryObj } from '@storybook/react-vite'
import { Panel } from './Panel'
import { KpiMetric } from './KpiMetric'
import { WidgetGrid } from './WidgetGrid'

const meta = {
  title: 'Molecules/KpiMetric',
  component: KpiMetric,
  args: {
    label: 'Hired',
    value: '128',
  },
} satisfies Meta<typeof KpiMetric>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Hero: Story = {
  args: { density: 'hero', value: '1.2k', meta: 'vs last week' },
}

export const InJoinedBoard: Story = {
  render: () => (
    <WidgetGrid columns={12} joined>
      <WidgetGrid.Item colSpan={4}>
        <Panel variant="card" data-row-start="true">
          <KpiMetric label="Hired" value="42" />
        </Panel>
      </WidgetGrid.Item>
      <WidgetGrid.Item colSpan={4}>
        <Panel variant="card">
          <KpiMetric label="Apps" value="310" />
        </Panel>
      </WidgetGrid.Item>
      <WidgetGrid.Item colSpan={4}>
        <Panel variant="card" data-row-end="true" data-last-row="true">
          <KpiMetric label="Offer" value="18" meta="filter=EMEA" />
        </Panel>
      </WidgetGrid.Item>
    </WidgetGrid>
  ),
}
