import type { Meta, StoryObj } from '@storybook/react-vite'
import { HubIndexCard } from './HubIndexCard'

const meta = {
  title: 'Molecules/HubIndexCard',
  component: HubIndexCard,
  args: {
    title: 'North Collection',
    meta: '3 personas · active',
  },
} satisfies Meta<typeof HubIndexCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithMedia: Story = {
  args: {
    title: 'Landing',
    meta: 'Draft · Updated today',
    media: (
      <div
        style={{
          height: '7.5rem',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 100%)',
        }}
      />
    ),
  },
}

export const Create: Story = {
  args: {
    variant: 'create',
    title: 'New composition',
    meta: 'Blank scene bound to a Collection',
    media: undefined,
  },
}
