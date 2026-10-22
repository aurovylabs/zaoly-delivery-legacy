import type { Meta, StoryObj } from '@storybook/react-vite'
import { Divider } from './Divider'
const meta = {
  title: 'Atoms/Divider',
  component: Divider,
} satisfies Meta<typeof Divider>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const Vertical: Story = {
  render: () => (
    <div style={{ display: 'flex', height: 48, gap: 12, alignItems: 'stretch' }}>
      <span>A</span>
      <Divider orientation="vertical" />
      <span>B</span>
    </div>
  ),
}
