import type { Meta, StoryObj } from '@storybook/react-vite'
import { TokenPreview } from './TokenPreview'

const meta = {
  title: 'Molecules/TokenPreview',
  component: TokenPreview,
  args: {
    kind: 'color',
    value: '#224455',
    size: 'md',
  },
} satisfies Meta<typeof TokenPreview>

export default meta
type Story = StoryObj<typeof meta>

export const Color: Story = {}

export const Space: Story = {
  args: { kind: 'space', value: '24px' },
}

export const Radius: Story = {
  args: { kind: 'radius', value: '12px' },
}

export const Opacity: Story = {
  args: { kind: 'opacity', value: '0.4' },
}

export const Type: Story = {
  args: { kind: 'type', value: '16px' },
}
