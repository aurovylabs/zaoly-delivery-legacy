import type { Meta, StoryObj } from '@storybook/react-vite'
import { narrowViewportGlobals } from '../storybook/viewports'
import { Dialog } from './Dialog'

const meta = {
  title: 'Organisms/Dialog',
  component: Dialog,
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (<Dialog open onClose={() => {}} title="Confirm action">Dialog content</Dialog>),
}

export const Narrow: Story = {
  ...Default,
  globals: narrowViewportGlobals,
}
