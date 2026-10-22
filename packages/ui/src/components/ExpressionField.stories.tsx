import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { ExpressionField } from './ExpressionField'

const meta = {
  title: 'Molecules/ExpressionField',
  component: ExpressionField,
  args: {
    label: 'Path',
    value: '{{ scan.overallScore }}',
    hint: 'Bare path or {{ expression }}',
  },
} satisfies Meta<typeof ExpressionField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Interactive: Story = {
  render: function InteractiveRender() {
    const [value, setValue] = useState('scan.overallScore')
    return (
      <ExpressionField
        label="Compare path"
        value={value}
        onChange={setValue}
        hint="Click JsonTree leaves to insert"
      />
    )
  },
}

export const WithSuggestions: Story = {
  render: function WithSuggestionsRender() {
    const [value, setValue] = useState('kpi:kpi-hired')
    return (
      <ExpressionField
        label="Value"
        value={value}
        onChange={setValue}
        placeholder="Drop a KPI or pick from the list"
        suggestions={[
          { value: 'kpi:kpi-hired', label: 'Hired' },
          { value: 'kpi:kpi-apps', label: 'Applications' },
          { value: 'kpi:kpi-fill', label: 'Fill rate' },
        ]}
      />
    )
  },
}
