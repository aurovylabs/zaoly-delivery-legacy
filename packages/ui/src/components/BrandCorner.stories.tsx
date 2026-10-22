import type { Meta, StoryObj } from '@storybook/react-vite'
import { BrandCorner } from './BrandCorner'

const meta = {
  title: 'Molecules/BrandCorner',
  component: BrandCorner,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof BrandCorner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    label: 'AUDION',
  },
  render: (args) => (
    <div style={{ minHeight: '10rem', position: 'relative' }}>
      <BrandCorner {...args} />
    </div>
  ),
}

export const WithoutLogo: Story = {
  render: () => (
    <div style={{ minHeight: '10rem', position: 'relative' }}>
      <BrandCorner label="CHECKION" showLogo={false} />
    </div>
  ),
}

export const AlwaysExpanded: Story = {
  args: {
    label: 'PLEXON',
    labelReveal: 'always',
  },
  render: (args) => (
    <div style={{ minHeight: '10rem', position: 'relative' }}>
      <BrandCorner {...args} />
    </div>
  ),
}
