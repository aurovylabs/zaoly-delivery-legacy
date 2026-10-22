import type { Meta, StoryObj } from '@storybook/react-vite'
import { DivergingBarList } from './DivergingBar'

const meta = {
  title: 'Molecules/DivergingBar',
  component: DivergingBarList,
} satisfies Meta<typeof DivergingBarList>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    'aria-label': 'Category scores',
    domain: 2,
    items: [
      { id: 'trust', label: 'Trust', value: 1.4 },
      { id: 'clarity', label: 'Clarity', value: 0.6 },
      { id: 'friction', label: 'Friction', value: -0.9 },
      { id: 'novelty', label: 'Novelty', value: -0.2 },
      { id: 'neutral', label: 'Baseline', value: 0 },
    ],
  },
}
