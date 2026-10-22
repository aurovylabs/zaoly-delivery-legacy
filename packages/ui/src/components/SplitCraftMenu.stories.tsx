import type { Meta, StoryObj } from '@storybook/react-vite'
import { SplitCraftMenu } from './SplitCraftMenu'

const meta = {
  title: 'Molecules/SplitCraftMenu',
  component: SplitCraftMenu,
  args: {
    title: 'Style',
    leftLabel: 'Fonts',
    rightLabel: 'Properties',
    left: (
      <ul style={{ margin: 0, padding: '0 0 0 0.25rem', listStyle: 'none' }}>
        {['Inter', 'Geist', 'Noto Sans', 'Roboto'].map((f) => (
          <li key={f} style={{ padding: '0.35rem 0.4rem', fontSize: 12 }}>
            {f}
          </li>
        ))}
      </ul>
    ),
    right: (
      <div style={{ display: 'grid', gap: 8, fontSize: 12 }}>
        <label>
          Size
          <input defaultValue="16px" style={{ width: '100%' }} />
        </label>
        <label>
          Weight
          <input defaultValue="400" style={{ width: '100%' }} />
        </label>
        <span>Italic · Color</span>
      </div>
    ),
  },
} satisfies Meta<typeof SplitCraftMenu>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithFooter: Story = {
  args: {
    footer: <span style={{ fontSize: 11, opacity: 0.7 }}>Promote unbound literals via +</span>,
  },
}
