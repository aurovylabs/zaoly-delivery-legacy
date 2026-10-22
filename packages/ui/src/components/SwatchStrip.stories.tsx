import type { Meta, StoryObj } from '@storybook/react-vite'
import { SwatchStrip } from './SwatchStrip'

const meta = {
  title: 'Atoms/SwatchStrip',
  component: SwatchStrip,
  args: {
    swatches: ['#0B3D2E', '#C4A35A', '#F4F0E6', '#1A1A1A'],
    label: '4 colors',
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Horizontal color swatch row — Brandion chapter teaser strip.',
      },
    },
  },
} satisfies Meta<typeof SwatchStrip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Empty: Story = {
  args: { swatches: [], label: undefined },
}

export const CapMax: Story = {
  args: {
    swatches: ['#111', '#222', '#333', '#444', '#555', '#666', '#777', '#888', '#999'],
    max: 5,
    label: 'showing 5',
  },
}
