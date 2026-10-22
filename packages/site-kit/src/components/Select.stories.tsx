import type { Meta, StoryObj } from '@storybook/react-vite'
import { Select } from './Select'

const meta = {
  title: 'Site/Select',
  component: Select,
  tags: ['site-kit'],
} satisfies Meta<typeof Select>
export default meta

export const Default: StoryObj<typeof meta> = {
  args: {
    options: 'Option A\nOption B\nopt-c|Option C',
    'aria-label': 'Demo select',
  },
}
