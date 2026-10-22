import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { InspectSection } from './InspectSection'
import { InspectTabs } from './InspectTabs'
import { PropertyInspector } from './PropertyInspector'

const meta = {
  title: 'Molecules/InspectTabs',
  component: InspectTabs,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Dense Design | CSS tablist for the inspect rail. Labels are props; panels stay in the app.',
      },
    },
  },
} satisfies Meta<typeof InspectTabs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    value: 'design',
    onChange: () => undefined,
  },
}

export const CustomLabels: Story = {
  args: {
    value: 'css',
    onChange: () => undefined,
    designLabel: 'Tokens',
    cssLabel: 'Raw CSS',
  },
}

export const WithInspector: Story = {
  name: 'Above PropertyInspector',
  render: function ComposedStory() {
    const [tab, setTab] = useState('design')
    return (
      <div style={{ maxWidth: '18rem', border: '1px solid var(--border, #ddd)' }}>
        <InspectTabs value={tab} onChange={setTab} />
        {tab === 'design' ? (
          <PropertyInspector title="Inspector">
            <InspectSection title="Fill">Design fields…</InspectSection>
          </PropertyInspector>
        ) : (
          <pre style={{ margin: 0, padding: '0.75rem', fontSize: '0.75rem' }}>
            {`.hero { color: var(--color-accent); }`}
          </pre>
        )}
      </div>
    )
  },
}
