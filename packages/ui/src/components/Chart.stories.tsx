import type { Meta, StoryObj } from '@storybook/react-vite'
import { Chart, CHART_VARIANTS } from './Chart'

const sample = [
  { label: 'Mon', value: 4 },
  { label: 'Tue', value: 7 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 9 },
  { label: 'Fri', value: 6 },
]

const funnel = [
  { label: 'Applied', value: 120 },
  { label: 'Screened', value: 80 },
  { label: 'Interview', value: 40 },
  { label: 'Offer', value: 18 },
  { label: 'Hired', value: 12 },
]

const meta = {
  title: 'Molecules/Chart',
  component: Chart,
  args: {
    data: sample,
    title: 'Applications / day',
  },
} satisfies Meta<typeof Chart>

export default meta
type Story = StoryObj<typeof meta>

export const Bar: Story = { args: { variant: 'bar' } }
export const BarHorizontal: Story = { args: { variant: 'bar_horizontal', title: 'Ranked' } }
export const Line: Story = { args: { variant: 'line' } }
export const Area: Story = { args: { variant: 'area' } }
export const Scatter: Story = { args: { variant: 'scatter' } }
export const Pie: Story = { args: { variant: 'pie', title: 'Share' } }
export const Donut: Story = { args: { variant: 'donut', title: 'Share' } }
export const Funnel: Story = { args: { variant: 'funnel', data: funnel, title: 'Pipeline' } }
export const Empty: Story = { args: { data: [], title: 'No data' } }
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {CHART_VARIANTS.map((variant) => (
        <Chart
          key={variant}
          variant={variant}
          title={variant}
          data={variant === 'funnel' ? funnel : sample}
          height={200}
        />
      ))}
    </div>
  ),
}
