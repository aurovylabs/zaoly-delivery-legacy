import type { Meta, StoryObj } from '@storybook/react-vite'
import { Grid } from './Grid'

const meta = {
  title: 'Atoms/Grid',
  component: Grid,
  args: {
    children: 'Grid',
  },
} satisfies Meta<typeof Grid>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
