import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChatAlertBlock } from './ChatAlertBlock'

const meta = {
  title: 'Molecules/ChatAlertBlock',
  component: ChatAlertBlock,
  args: {
    title: 'Hinweis',
    message: 'Status-Hinweise mit tone: success, warning, error, info.',
    tone: 'info' as const,
  },
} satisfies Meta<typeof ChatAlertBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Info: Story = {}

export const Warning: Story = {
  args: { title: 'Sync', message: 'Mirror pending — Retry in a moment.', tone: 'warning' },
}

export const Error: Story = {
  args: { title: 'Fehler', message: 'Scan konnte nicht gestartet werden.', tone: 'error' },
}

export const Success: Story = {
  args: { title: 'Fertig', message: 'Personas synchronisiert.', tone: 'success' },
}
