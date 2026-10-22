import type { Meta, StoryObj } from '@storybook/react-vite'
import { Image, SITE_IMAGE_PLACEHOLDER_SRC } from './Image'

const meta = {
  title: 'Site/Image',
  component: Image,
  tags: ['site-kit'],
  args: {
    src: SITE_IMAGE_PLACEHOLDER_SRC,
    alt: 'Placeholder',
  },
} satisfies Meta<typeof Image>

export default meta
export const Default: StoryObj<typeof meta> = {}
