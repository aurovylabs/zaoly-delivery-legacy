import type { Meta, StoryObj } from '@storybook/react-vite'
import { BrandCornerProductMenu } from './BrandCornerProductMenu'

const PRODUCTS = [
  { id: 'plexon', label: 'PLEXON', href: '#' },
  { id: 'audion', label: 'AUDION', href: '#' },
  { id: 'checkion', label: 'CHECKION', href: '#' },
  { id: 'brandion', label: 'BRANDION', href: '#' },
  { id: 'creation', label: 'CREATION', href: '#' },
  { id: 'echon', label: 'ECHON', href: '#', disabled: true },
]

const meta = {
  title: 'Molecules/BrandCornerProductMenu',
  component: BrandCornerProductMenu,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof BrandCornerProductMenu>

export default meta
type Story = StoryObj<typeof meta>

export const CreationHost: Story = {
  args: {
    label: 'CREATION',
    currentProductId: 'creation',
    items: PRODUCTS,
    menuLabel: 'Zaoly products',
    footer: <a href="#">All products in PLEXON</a>,
  },
  render: (args) => (
    <div style={{ minHeight: '14rem', position: 'relative' }}>
      <BrandCornerProductMenu {...args} />
    </div>
  ),
}
