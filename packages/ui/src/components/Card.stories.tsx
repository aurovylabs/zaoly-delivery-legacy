import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'
import { Card } from './Card'
import { CardActions } from './CardActions'
import { Chip } from './Chip'
import { StatusDot } from './StatusDot'

const meta = {
  title: 'Atoms/Card',
  component: Card,
  args: {
    children: 'Card',
  },
  argTypes: {
    clipInset: { control: 'object' },
  },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** Bottom edge slants down to the right (BL raised). */
export const BottomSlant: Story = {
  args: {
    clipInset: { bottomLeft: { y: '12%' } },
    style: {
      background: 'var(--surface-2, #e8eee9)',
      padding: '1.5rem',
      minHeight: '8rem',
    },
    children: 'Bottom slant — clipInset.bottomLeft.y = 12%',
  },
}

/** Browse / media tile — native Card slots + CardActions. */
export const MediaBrowse: Story = {
  args: {
    children: undefined,
    href: '#',
    media: (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #2a2a2a, #555)',
        }}
      />
    ),
    title: 'cutdown_advertising.mp4',
    meta: (
      <>
        <StatusDot level="ok" />
        <Chip static size="sm">
          ready
        </Chip>
        <Chip static size="sm">
          Analysiert
        </Chip>
        <Chip static size="sm">
          00:56
        </Chip>
      </>
    ),
    actions: (
      <CardActions>
        <Button variant="ghost" size="sm">
          Öffnen
        </Button>
        <Button variant="ghost" size="sm">
          Analysen
        </Button>
        <Button variant="ghost" size="sm">
          Cuts
        </Button>
      </CardActions>
    ),
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '18rem' }}>
        <Story />
      </div>
    ),
  ],
}
