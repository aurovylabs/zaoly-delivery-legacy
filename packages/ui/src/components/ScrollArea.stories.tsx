import type { Meta, StoryObj } from '@storybook/react-vite'
import { ScrollArea } from './ScrollArea'

const meta = {
  title: 'Molecules/ScrollArea',
  component: ScrollArea,
} satisfies Meta<typeof ScrollArea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <ScrollArea style={{ maxHeight: '8rem', maxWidth: '16rem', border: '1px solid var(--line)' }}>
      {Array.from({ length: 24 }, (_, i) => (
        <p key={i} style={{ margin: '0.35rem 0.5rem' }}>
          Scroll line {i + 1}
        </p>
      ))}
    </ScrollArea>
  ),
}

export const Horizontal: Story = {
  render: () => (
    <ScrollArea
      orientation="horizontal"
      style={{ maxWidth: '16rem', border: '1px solid var(--line)', whiteSpace: 'nowrap' }}
    >
      <div style={{ display: 'inline-flex', gap: '1rem', padding: '0.75rem' }}>
        {Array.from({ length: 12 }, (_, i) => (
          <span key={i} style={{ padding: '0.5rem 1rem', border: '1px solid var(--line)' }}>
            Card {i + 1}
          </span>
        ))}
      </div>
    </ScrollArea>
  ),
}
