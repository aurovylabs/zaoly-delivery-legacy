import type { Meta, StoryObj } from '@storybook/react-vite'
import { Checkbox } from './Checkbox'
const meta = { title: 'Site/Checkbox', component: Checkbox, tags: ['site-kit'], args: { children: 'Remember me' } } satisfies Meta<typeof Checkbox>
export default meta
export const Default: StoryObj<typeof meta> = {}
