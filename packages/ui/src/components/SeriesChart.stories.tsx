import type { Meta, StoryObj } from '@storybook/react-vite'
import { SeriesChart } from './SeriesChart'

const meta = {
  title: 'Molecules/SeriesChart',
  component: SeriesChart,
  args: {
    title: 'Position over time',
    height: 220,
    series: [
      {
        id: 'target',
        label: 'example.com',
        points: [
          { label: '01.09', value: 4 },
          { label: '08.09', value: 3 },
          { label: '15.09', value: 2 },
          { label: '22.09', value: 2 },
        ],
      },
      {
        id: 'rival',
        label: 'rival.com',
        points: [
          { label: '01.09', value: 1 },
          { label: '08.09', value: 2 },
          { label: '15.09', value: 1 },
          { label: '22.09', value: 3 },
        ],
      },
    ],
  },
} satisfies Meta<typeof SeriesChart>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const InvertY: Story = {
  args: {
    title: 'Citation rank (lower is better)',
    invertY: true,
  },
}

export const WithGaps: Story = {
  args: {
    title: 'Gaps when not cited',
    series: [
      {
        id: 'target',
        label: 'example.com',
        points: [
          { label: 'W1', value: 3 },
          { label: 'W2', value: null },
          { label: 'W3', value: 2 },
          { label: 'W4', value: 1 },
        ],
      },
    ],
  },
}

export const Empty: Story = {
  args: {
    title: 'Empty',
    series: [],
  },
}
