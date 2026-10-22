import type { Meta, StoryObj } from '@storybook/react-vite'
import { Field } from './Field'
import { Input } from './Input'
import { InspectSection } from './InspectSection'
import { PropertyInspector } from './PropertyInspector'
import { TokenPicker } from './TokenPicker'

const meta = {
  title: 'Molecules/InspectSection',
  component: InspectSection,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Dense titled block for PropertyInspector — Penpot-like inspect section chrome.',
      },
    },
  },
} satisfies Meta<typeof InspectSection>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Appearance',
    titleId: 'inspect-appearance',
    children: (
      <TokenPicker
        label="Radius"
        value="radius.md"
        options={[
          { path: 'radius.sm', label: 'radius.sm' },
          { path: 'radius.md', label: 'radius.md' },
        ]}
      />
    ),
  },
}

export const InPropertyInspector: Story = {
  name: 'Stacked in PropertyInspector',
  render: () => (
    <div style={{ maxWidth: '18rem', border: '1px solid var(--border, #ddd)' }}>
      <PropertyInspector title="Inspector">
        <InspectSection title="Component">
          <Field label="Name">
            <Input defaultValue="Hero title" />
          </Field>
        </InspectSection>
        <InspectSection title="Fill & stroke">
          <TokenPicker
            label="Color"
            allowNone
            onClear={() => undefined}
            value="color.accent"
            options={[
              { path: 'color.accent', preview: '#224455', label: 'color.accent' },
              { path: 'color.muted', preview: '#666666', label: 'color.muted' },
            ]}
          />
        </InspectSection>
      </PropertyInspector>
    </div>
  ),
}
