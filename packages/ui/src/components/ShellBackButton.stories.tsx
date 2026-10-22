import type { Meta, StoryObj } from '@storybook/react-vite'
import { ShellBackButton } from './ShellBackButton'

const meta = {
  title: 'Molecules/ShellBackButton',
  component: ShellBackButton,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    label: 'Back',
  },
} satisfies Meta<typeof ShellBackButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <div style={{ minHeight: '10rem', position: 'relative' }}>
      <ShellBackButton {...args} onClick={() => undefined} />
    </div>
  ),
}

export const AsLink: Story = {
  args: {
    href: '#previous',
  },
  render: (args) => (
    <div style={{ minHeight: '10rem', position: 'relative' }}>
      <ShellBackButton {...args} />
    </div>
  ),
}
