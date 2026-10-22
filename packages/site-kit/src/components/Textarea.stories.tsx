import type { Meta, StoryObj } from '@storybook/react-vite'
import { Textarea } from './Textarea'
const meta = { title: 'Site/Textarea', component: Textarea, tags: ['site-kit'], args: { placeholder: 'Message' } } satisfies Meta<typeof Textarea>
export default meta
export const Default: StoryObj<typeof meta> = {}
