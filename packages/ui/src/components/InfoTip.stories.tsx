import type { Meta, StoryObj } from '@storybook/react-vite'
import { InfoTip } from './InfoTip'

const meta = {
  title: 'Molecules/InfoTip',
  component: InfoTip,
  args: {
    label: 'About accessibility score',
    content: 'How well the page works for people using assistive tech and keyboard navigation.',
  },
} satisfies Meta<typeof InfoTip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const BesideLabel: Story = {
  render: (args) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
      <span>Accessibility</span>
      <InfoTip {...args} />
    </span>
  ),
}

export const Medium: Story = {
  args: {
    size: 'md',
    label: 'About GEO discoverability',
    content: 'How often AI answers cite or surface this brand for the measured prompts.',
  },
}
