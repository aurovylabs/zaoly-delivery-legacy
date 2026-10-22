import type { Meta, StoryObj } from '@storybook/react-vite'
import { Text } from './Text'

const meta = {
  title: 'Atoms/Text',
  component: Text,
  args: { role: 'body', children: 'The quick brown fox' },
  argTypes: {
    role: { control: 'select', options: ['display','headline','title','body','label','meta','hint','mono','numeric'] },
  },
} satisfies Meta<typeof Text>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const Display: Story = { args: { role: 'display', children: 'Signals' } }
export const Hint: Story = { args: { role: 'hint', children: 'click row → detail' } }
