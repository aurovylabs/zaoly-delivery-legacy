import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Button } from './Button'
import { ChatOverlay } from './ChatOverlay'

const meta = {
  title: 'Organisms/ChatOverlay',
  component: ChatOverlay,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ChatOverlay>

export default meta
type Story = StoryObj<typeof meta>

function Demo({ placement }: { placement: 'dock-end' | 'center' }) {
  const [open, setOpen] = useState(true)
  return (
    <div style={{ minHeight: '100vh', padding: '1.5rem' }}>
      <Button type="button" onClick={() => setOpen(true)}>
        Open chat
      </Button>
      <ChatOverlay
        open={open}
        onOpenChange={setOpen}
        title="Assistant"
        placement={placement}
      >
        <p className="ds-text">Slot body — compose turns or mount an iframe.</p>
      </ChatOverlay>
    </div>
  )
}

export const DockEnd: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    children: null,
  },
  render: () => <Demo placement="dock-end" />,
}

export const Center: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    children: null,
  },
  render: () => <Demo placement="center" />,
}

export const IframeSlot: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    children: null,
  },
  render: () => {
    const [open, setOpen] = useState(true)
    return (
      <div style={{ minHeight: '100vh', padding: '1.5rem' }}>
        <Button type="button" onClick={() => setOpen(true)}>
          Open embed shell
        </Button>
        <ChatOverlay open={open} onOpenChange={setOpen} title="Platform assistant" placement="dock-end">
          <iframe
            title="Assistant embed stub"
            srcDoc="<p style='font:14px system-ui;padding:1rem'>Embed iframe stub</p>"
            style={{ border: 0, width: '100%', height: '100%', minHeight: '16rem', flex: 1 }}
          />
        </ChatOverlay>
      </div>
    )
  },
}

export const ComposedPanel: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    children: null,
  },
  render: () => {
    const [open, setOpen] = useState(true)
    return (
      <div style={{ minHeight: '100vh', padding: '1.5rem' }}>
        <Button type="button" onClick={() => setOpen(true)}>
          Open composed panel
        </Button>
        <ChatOverlay
          open={open}
          onOpenChange={setOpen}
          title="Assistant"
          placement="dock-end"
          headerActions={
            <Button type="button" variant="subtle" size="sm">
              Expand
            </Button>
          }
        >
          <div className="chat-panel chat-panel-compact">
            <p className="ds-text">Native composed chat body (no iframe).</p>
          </div>
        </ChatOverlay>
      </div>
    )
  },
}
