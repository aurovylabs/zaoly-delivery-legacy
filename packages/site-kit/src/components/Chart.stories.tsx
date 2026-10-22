import type { Meta, StoryObj } from '@storybook/react-vite'
import { Chart } from './Chart'

const meta = {
  title: 'Site/Chart',
  component: Chart,
  tags: ['site-kit'],
  args: {
    variant: 'bar',
    title: 'Sample',
    height: 220,
    data: [
      { label: 'A', value: 42 },
      { label: 'B', value: 28 },
      { label: 'C', value: 65 },
      { label: 'D', value: 18 },
    ],
  },
} satisfies Meta<typeof Chart>

export default meta
export const Default: StoryObj<typeof meta> = {}
export const Donut: StoryObj<typeof meta> = {
  args: { variant: 'donut', title: 'Share' },
}
