import type { Meta, StoryObj } from '@storybook/react-vite'
import { Tooltip } from './Tooltip'
import { Button } from './Button'
const meta = {
  title: 'Atoms/Tooltip',
  component: Tooltip,
} satisfies Meta<typeof Tooltip>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: () => (
    <Tooltip content="Ranked by score">
      <Button variant="ghost" size="sm">Hover me</Button>
    </Tooltip>
  ),
}
