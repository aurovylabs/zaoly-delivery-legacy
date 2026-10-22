import type { Meta, StoryObj } from '@storybook/react-vite'
import { Panel } from './Panel'
import { Chart } from './Chart'
import { Gauge } from './Gauge'
import { WidgetGrid } from './WidgetGrid'

const meta = {
  title: 'Organisms/WidgetGrid',
  component: WidgetGrid,
} satisfies Meta<typeof WidgetGrid>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <WidgetGrid columns={12} gap="md">
      <WidgetGrid.Item colSpan={8}>
        <Panel variant="card">
          <Chart
            title="Applications"
            data={[
              { label: 'W1', value: 12 },
              { label: 'W2', value: 18 },
              { label: 'W3', value: 9 },
              { label: 'W4', value: 22 },
            ]}
          />
        </Panel>
      </WidgetGrid.Item>
      <WidgetGrid.Item colSpan={4}>
        <Panel variant="card">
          <Gauge value={64} label="Hire rate" unit="%" tone="ok" />
        </Panel>
      </WidgetGrid.Item>
      <WidgetGrid.Item colSpan={6}>
        <Panel variant="card">Tile A</Panel>
      </WidgetGrid.Item>
      <WidgetGrid.Item colSpan={6}>
        <Panel variant="card">Tile B</Panel>
      </WidgetGrid.Item>
    </WidgetGrid>
  ),
}

export const Joined: Story = {
  render: () => (
    <WidgetGrid columns={12} joined>
      <WidgetGrid.Item colSpan={4}>
        <Panel variant="card" data-row-start="true">
          KPI A
        </Panel>
      </WidgetGrid.Item>
      <WidgetGrid.Item colSpan={4}>
        <Panel variant="card">KPI B</Panel>
      </WidgetGrid.Item>
      <WidgetGrid.Item colSpan={4}>
        <Panel variant="card" data-row-end="true" data-last-row="true">
          KPI C
        </Panel>
      </WidgetGrid.Item>
    </WidgetGrid>
  ),
}
