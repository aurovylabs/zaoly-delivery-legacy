import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button, ToastProvider, useToast } from '../index'

function ToastDemo() {
  const { push } = useToast()
  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <Button
        size="sm"
        onClick={() => push({ message: 'Saved overview filters', tone: 'ok' })}
      >
        Push ok
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => push({ message: 'Sync running…', tone: 'info' })}
      >
        Push info
      </Button>
      <Button
        size="sm"
        variant="danger"
        onClick={() => push({ message: 'Enrich failed', tone: 'error' })}
      >
        Push error
      </Button>
    </div>
  )
}

const meta = {
  title: 'Molecules/Toast',
  component: ToastDemo,
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
} satisfies Meta<typeof ToastDemo>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <ToastDemo />,
}
