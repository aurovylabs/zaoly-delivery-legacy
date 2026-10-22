import type { Meta, StoryObj } from '@storybook/react'
import { Shape, SITE_SHAPE_DEFAULT_D } from './Shape'

const meta = {
  title: 'Site/Shape',
  component: Shape,
  args: {
    d: SITE_SHAPE_DEFAULT_D,
    viewBox: '0 0 48 48',
    alt: 'Diamond',
    style: { width: 48, height: 48, color: 'currentColor' },
  },
} satisfies Meta<typeof Shape>

export default meta
type Story = StoryObj<typeof meta>

export const Diamond: Story = {}

export const CircleApprox: Story = {
  args: {
    d: 'M24 4 C35 4 44 13 44 24 C44 35 35 44 24 44 C13 44 4 35 4 24 C4 13 13 4 24 4 Z',
    alt: 'Circle',
  },
}
