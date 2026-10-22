import type { Meta, StoryObj } from '@storybook/react-vite'
import { Stack } from './Stack'
import { Button } from './Button'

const meta = { title: 'Site/Stack', component: Stack, tags: ['site-kit'] } satisfies Meta<typeof Stack>
export default meta
export const Default: StoryObj<typeof meta> = {
  render: () => (
    <Stack direction="row">
      <Button>One</Button>
      <Button>Two</Button>
    </Stack>
  ),
}
