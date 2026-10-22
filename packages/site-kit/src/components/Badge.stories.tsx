import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from './Badge'
const meta = { title: 'Site/Badge', component: Badge, tags: ['site-kit'], args: { children: 'New' } } satisfies Meta<typeof Badge>
export default meta
export const Default: StoryObj<typeof meta> = {}
