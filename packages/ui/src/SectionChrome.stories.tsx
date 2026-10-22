import type { Meta, StoryObj } from '@storybook/react-vite'
import { SectionChrome } from './SectionChrome'
import { Button, IconResearch, IconZap } from './index'

const meta = {
  title: 'Molecules/SectionChrome',
  component: SectionChrome,
  args: {
    title: 'Research',
    quiet: false,
  },
} satisfies Meta<typeof SectionChrome>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    icon: <IconResearch size={16} />,
    meta: 'n=42',
    action: (
      <Button variant="ghost" size="sm">
        Open
      </Button>
    ),
    role: 'research',
  },
}

export const Quiet: Story = {
  args: {
    title: 'Categories',
    quiet: true,
    meta: 'sample',
  },
}

export const WithRole: Story = {
  args: {
    title: 'Signals',
    icon: <IconZap size={16} />,
    role: 'signals',
  },
}
