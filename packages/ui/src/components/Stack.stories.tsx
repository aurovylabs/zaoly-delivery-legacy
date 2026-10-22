import type { Meta, StoryObj } from '@storybook/react-vite'
import { Stack } from './Stack'

const meta = {
  title: 'Atoms/Stack',
  component: Stack,
  args: {
    children: 'Stack',
  },
  argTypes: {
    clipInset: { control: 'object' },
  },
} satisfies Meta<typeof Stack>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** Bottom edge slants down to the right (BL raised). */
export const BottomSlant: Story = {
  args: {
    clipInset: { bottomLeft: { y: '12%' } },
    style: {
      background: 'var(--accent, #2a6)',
      color: 'var(--ink-on-accent, #fff)',
      padding: '1.5rem',
      minHeight: '8rem',
    },
    children: 'Bottom slant — clipInset.bottomLeft.y = 12%',
  },
}
