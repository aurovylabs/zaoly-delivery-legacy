import type { Meta, StoryObj } from '@storybook/react-vite'
import { TopStatus } from './TopStatus'

const meta = {
  title: 'Molecules/TopStatus',
  component: TopStatus,
} satisfies Meta<typeof TopStatus>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    level: 'ok',
    primary: 'Workspace ready',
    secondary: '12 complete',
    live: true,
  },
}

export const Warn: Story = {
  args: {
    level: 'warn',
    primary: 'Sync delayed',
    secondary: 'Retry in 30s',
  },
}

export const Critical: Story = {
  args: {
    level: 'critical',
    primary: 'Ingest blocked',
    secondary: 'Token missing',
  },
}
