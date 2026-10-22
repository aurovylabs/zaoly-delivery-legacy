import type { Meta, StoryObj } from '@storybook/react-vite'
import { Image } from './Image'

const meta = {
  title: 'Atoms/Image',
  component: Image,
  args: {
    src: 'https://placehold.co/320x180',
    alt: 'Placeholder',
  },
} satisfies Meta<typeof Image>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
