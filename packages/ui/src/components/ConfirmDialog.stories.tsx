import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Button } from './Button'
import { ConfirmDialog } from './ConfirmDialog'

const meta = {
  title: 'Organisms/ConfirmDialog',
  component: ConfirmDialog,
} satisfies Meta<typeof ConfirmDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: function ConfirmStory() {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button size="sm" onClick={() => setOpen(true)}>
          Archive
        </Button>
        <ConfirmDialog
          open={open}
          onClose={() => setOpen(false)}
          onConfirm={() => undefined}
          title="Archive persona?"
          confirmLabel="Archive"
          danger
        >
          This hides the persona from the active index.
        </ConfirmDialog>
      </>
    )
  },
}
