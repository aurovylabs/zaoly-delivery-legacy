import type { Meta, StoryObj } from '@storybook/react-vite'
import { Divider } from './Divider'
const meta = { title: 'Site/Divider', component: Divider, tags: ['site-kit'] } satisfies Meta<typeof Divider>
export default meta
export const Default: StoryObj<typeof meta> = {}
