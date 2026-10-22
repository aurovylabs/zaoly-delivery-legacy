import type { Meta, StoryObj } from '@storybook/react-vite'
import { Field } from './Field'
import { Input } from './Input'
import { InspectSection } from './InspectSection'
import { PropertyInspector } from './PropertyInspector'
import { TokenPicker } from './TokenPicker'

const meta = {
  title: 'Organisms/PropertyInspector',
  component: PropertyInspector,
  parameters: {
    docs: {
      description: {
        component:
          'Dense property rail shell. Apps supply InspectSection children and field catalogs.',
      },
    },
  },
} satisfies Meta<typeof PropertyInspector>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  args: {
    title: 'Inspector',
  },
}

export const WithSections: Story = {
  render: () => (
    <div style={{ maxWidth: '18rem', minHeight: '24rem', border: '1px solid var(--border, #ddd)' }}>
      <PropertyInspector title="Inspector">
        <InspectSection title="Component">
          <Field label="Name">
            <Input defaultValue="Title" />
          </Field>
        </InspectSection>
        <InspectSection title="Appearance">
          <TokenPicker
            label="Radius"
            value="radius.md"
            options={[
              { path: 'radius.sm' },
              { path: 'radius.md' },
              { path: 'radius.lg' },
            ]}
            onClear={() => undefined}
          />
        </InspectSection>
      </PropertyInspector>
    </div>
  ),
}
