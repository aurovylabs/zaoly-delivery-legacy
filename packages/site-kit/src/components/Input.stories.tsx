import type { Meta, StoryObj } from '@storybook/react-vite'
import { Input } from './Input'
const meta = { title: 'Site/Input', component: Input, tags: ['site-kit'], args: { placeholder: 'Email' } } satisfies Meta<typeof Input>
export default meta
export const Default: StoryObj<typeof meta> = {}
