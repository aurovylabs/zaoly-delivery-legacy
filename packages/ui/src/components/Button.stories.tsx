import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'
import { IconResearch, IconSparkles } from './icons'

const meta = {
  title: 'Atoms/Button',
  component: Button,
  tags: ['magazine'],
  args: {
    children: 'Action',
    variant: 'primary',
    size: 'md',
    shape: 'square',
    disabled: false,
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'ghost', 'subtle', 'danger', 'link'],
    },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    shape: { control: 'select', options: ['square', 'pill', 'rounded'] },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {}

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Ghost' },
}

export const Subtle: Story = {
  args: { variant: 'subtle', children: 'Subtle' },
}

export const Danger: Story = {
  args: { variant: 'danger', children: 'Delete' },
}

export const Link: Story = {
  args: { variant: 'link', children: 'Copy link' },
}

export const Small: Story = {
  args: { size: 'sm', variant: 'ghost', children: 'Dense' },
}

export const Large: Story = {
  args: { size: 'lg', children: 'Start scan' },
}

export const ChatPill: Story = {
  tags: ['workstation'],
  args: { size: 'lg', shape: 'pill', children: 'Send' },
}

export const WithIcon: Story = {
  args: {
    variant: 'primary',
    icon: <IconResearch size={16} />,
    children: 'Research',
  },
}

export const AsAnchor: Story = {
  args: {
    href: '#',
    variant: 'ghost',
    children: 'Open project',
  },
}

export const Disabled: Story = {
  args: { disabled: true, children: 'Disabled' },
}

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {(['primary', 'ghost', 'subtle', 'danger', 'link'] as const).map((variant) => (
        <div
          key={variant}
          style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center' }}
        >
          <span
            style={{
              width: '4.5rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              color: 'var(--muted)',
            }}
          >
            {variant}
          </span>
          <Button variant={variant} size="sm">
            sm
          </Button>
          <Button variant={variant} size="md">
            md
          </Button>
          <Button variant={variant} size="lg">
            lg
          </Button>
          <Button variant={variant} shape="pill" icon={<IconSparkles size={16} />}>
            pill
          </Button>
          <Button variant={variant} shape="rounded">
            soft
          </Button>
          <Button variant={variant} disabled>
            off
          </Button>
        </div>
      ))}
    </div>
  ),
}

export const Default = Primary
