import type { Meta, StoryObj } from '@storybook/react-vite'
import { RadarChart } from './RadarChart'

const six = [
  { label: 'Novelty', value: 0.7 },
  { label: 'Action', value: 0.55 },
  { label: 'Impulse', value: 0.8 },
  { label: 'Urgency', value: 0.4 },
  { label: 'Emotional', value: 0.3 },
  { label: 'Cultural', value: 0.6 },
]

const thirteen = [
  { label: 'Format', value: 0.72 },
  { label: 'Composition', value: 0.81 },
  { label: 'Space', value: 0.64 },
  { label: 'Typography', value: 0.58 },
  { label: 'Color', value: 0.77 },
  { label: 'Imagery', value: 0.69 },
  { label: 'Illustration', value: 0.42 },
  { label: 'Brand', value: 0.88 },
  { label: 'Tone', value: 0.75 },
  { label: 'Material', value: 0.51 },
  { label: 'Narrative', value: 0.66 },
  { label: 'Risks', value: 0.28 },
  { label: 'Production', value: 0.61 },
]

const meta = {
  title: 'Molecules/RadarChart',
  component: RadarChart,
  args: {
    data: six,
    title: 'Score profile',
  },
} satisfies Meta<typeof RadarChart>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const ManyAxes: Story = {
  args: { data: thirteen, title: 'Craft groups' },
}
export const Empty: Story = {
  args: { data: [], title: 'No data' },
}
export const Interactive: Story = {
  args: {
    data: thirteen,
    title: 'Click an axis',
    onPointClick: (point) => {
      // Storybook actions via console for local click checks
      console.info('radar click', point.label, point.value)
    },
  },
}
