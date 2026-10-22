import type { Meta, StoryObj } from '@storybook/react-vite'
import { StatusDot } from './StatusDot'
const meta = {
  title: 'Atoms/StatusDot',
  component: StatusDot,
  args: { level: 'ok' },
  argTypes: { level: { control: 'select', options: ['ok', 'warn', 'critical'] } },
} satisfies Meta<typeof StatusDot>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const Warn: Story = { args: { level: 'warn' } }
export const Critical: Story = { args: { level: 'critical' } }
