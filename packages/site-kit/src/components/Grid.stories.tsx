import type { Meta, StoryObj } from '@storybook/react-vite'
import { Grid } from './Grid'
import { Text } from './Text'

const meta = { title: 'Site/Grid', component: Grid, tags: ['site-kit'] } satisfies Meta<typeof Grid>
export default meta
export const Default: StoryObj<typeof meta> = {
  render: () => (
    <Grid>
      <Text role="title">A</Text>
      <Text role="title">B</Text>
    </Grid>
  ),
}
