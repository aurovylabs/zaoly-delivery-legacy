import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'
import { CardActions } from './CardActions'
import { CollectionHubCard, CollectionHubMetric } from './CollectionHubCard'

const meta = {
  title: 'Molecules/CollectionHubCard',
  component: CollectionHubCard,
} satisfies Meta<typeof CollectionHubCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    kicker: 'example.com',
    badge: 'In sync',
    badgeStatus: 'in_sync',
    title: 'North Collection',
    hint: undefined,
    stats: (
      <>
        <CollectionHubMetric icon={<span aria-hidden>○</span>} value="12" label="Analyses" />
        <CollectionHubMetric icon={<span aria-hidden>□</span>} value="3" label="Guidelines" />
      </>
    ),
    actions: (
      <CardActions>
        <Button variant="ghost" size="sm">
          Open
        </Button>
        <Button variant="ghost" size="sm">
          Edit
        </Button>
      </CardActions>
    ),
  },
}

export const Pending: Story = {
  args: {
    ...Default.args,
    badge: 'Pending',
    badgeStatus: 'pending',
    hint: 'Capability mirror not yet linked.',
  },
}

export const Create: Story = {
  args: {
    variant: 'create',
    title: 'New project',
    hint: 'Creates a Collection-bound capability project.',
    onClick: () => undefined,
  },
}
