import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'

/** Hydrated from CREATION — Master named variants as CSF substories + Controls.variant. */
const meta = {
  title: 'Site/Button',
  component: Button,
  tags: ['site-kit', 'named-variants'],
  args: {
    children: "Get started",
    variant: "Default",
  },
  argTypes: {
    variant: {
      name: 'variant',
      description: 'Master named variant',
      control: { type: 'select' },
      options: ["Default","test"],
    },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { variant: "Default" },
}

export const Test: Story = {
  args: { variant: "test" },
}
