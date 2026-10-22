import type { Meta, StoryObj } from '@storybook/react-vite'
import { Field } from './Field'
import { FormSection } from './FormSection'
import { Input } from './Input'
import { Select } from './Select'

const meta = {
  title: 'Molecules/FormSection',
  component: FormSection,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Titled field block for Dialogs / editors — Brandion token Add/Edit dialog chrome.',
      },
    },
  },
} satisfies Meta<typeof FormSection>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Identity',
    titleId: 'fs-identity',
    children: (
      <>
        <Field label="Path">
          <Input defaultValue="color.brand.primary" />
        </Field>
        <Field label="Type">
          <Select defaultValue="color">
            <option value="color">Color</option>
            <option value="typography">Typography</option>
          </Select>
        </Field>
      </>
    ),
  },
}

export const TwoColumn: Story = {
  args: {
    title: 'Identity',
    columns: 2,
    children: (
      <>
        <Field label="Path">
          <Input defaultValue="color.brand.primary" className="ds-input" />
        </Field>
        <Field label="Type">
          <Select defaultValue="color">
            <option value="color">Color</option>
            <option value="font">Font</option>
          </Select>
        </Field>
      </>
    ),
  },
}

export const AdvancedTone: Story = {
  args: {
    title: 'Lab / advanced',
    tone: 'advanced',
    children: (
      <Field label="Raw value" hint="JSON or CSS string">
        <Input defaultValue="#0B3D2E" />
      </Field>
    ),
  },
}

export const StackedInDialogBody: Story = {
  name: 'Stacked (dialog body)',
  render: () => (
    <div className="ds-token-editor-stack" style={{ maxWidth: '40rem' }}>
      <FormSection title="Identity" columns={2}>
        <Field label="Path">
          <Input defaultValue="color.brand.primary" />
        </Field>
        <Field label="Type">
          <Select defaultValue="color">
            <option value="color">Color</option>
          </Select>
        </Field>
      </FormSection>
      <FormSection title="Value">
        <Field label="Hex">
          <Input defaultValue="#0B3D2E" />
        </Field>
      </FormSection>
      <FormSection title="Lab / advanced" tone="advanced">
        <Field label="Raw">
          <Input defaultValue='{"$value":"#0B3D2E"}' />
        </Field>
      </FormSection>
    </div>
  ),
}
