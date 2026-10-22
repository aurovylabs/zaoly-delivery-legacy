import type { Meta, StoryObj } from '@storybook/react-vite'
import { Text } from './Text'
const meta = { title: 'Site/Text', component: Text, tags: ['site-kit'], args: { children: 'Body copy', role: 'body' } } satisfies Meta<typeof Text>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const Display: Story = { args: { role: 'display', children: 'Display' } }
