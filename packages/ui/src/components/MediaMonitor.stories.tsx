import type { Meta, StoryObj } from '@storybook/react-vite'
import { MediaMonitor } from './MediaMonitor'
import { ToolButton } from './ToolButton'

const meta = {
  title: 'Organisms/MediaMonitor',
  component: MediaMonitor,
  args: {
    label: 'Program',
    actions: <ToolButton label="Fullscreen">⛶</ToolButton>,
    media: <div style={{ color: '#fff', padding: 24 }}>Preview surface</div>,
  },
} satisfies Meta<typeof MediaMonitor>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
