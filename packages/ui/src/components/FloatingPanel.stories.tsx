import type { Meta, StoryObj } from '@storybook/react-vite'
import { FloatingPanel } from './FloatingPanel'

const meta = {
  title: 'Organisms/FloatingPanel',
  component: FloatingPanel,
  tags: ['magazine'],
  args: {
    storageKey: 'zaoly.story.floatingPanel',
    title: 'Inspector',
    children: (
      <p style={{ margin: 0, fontSize: '0.85rem' }}>
        Solid hairline shell — magazine workspace chrome.
      </p>
    ),
  },
  decorators: [
    (Story) => (
      <div
        style={{
          position: 'relative',
          minHeight: '18rem',
          border: '1px solid var(--line)',
          background: 'var(--bg0, #f4f2ee)',
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FloatingPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Toolbar: Story = {
  args: {
    storageKey: 'zaoly.story.floatingPanel.toolbar',
    variant: 'toolbar',
    title: undefined,
    children: (
      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
        <button type="button">Test</button>
        <button type="button">Save</button>
      </div>
    ),
  },
}

export const Strip: Story = {
  args: {
    storageKey: 'zaoly.story.floatingPanel.strip',
    variant: 'strip',
    title: 'Live Run',
    defaultEdge: 'bottom',
    children: <span style={{ fontSize: '0.8rem' }}>status · steps · job</span>,
  },
}

export const Glass: Story = {
  tags: ['workstation'],
  args: {
    storageKey: 'zaoly.story.floatingPanel.glass',
    surface: 'glass',
    title: 'Glass (opt-in)',
  },
}
