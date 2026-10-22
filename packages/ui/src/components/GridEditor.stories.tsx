import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { GridEditor, type GridEditorMetrics } from './GridEditor'

const meta = {
  title: 'Molecules/GridEditor',
  component: GridEditor,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof GridEditor>

export default meta
type Story = StoryObj<typeof meta>

export const Digital: Story = {
  render: (args) => {
    const [value, setValue] = useState<GridEditorMetrics>({
      columns: 12,
      gutter: '1.5rem',
      margin: '1rem',
      maxWidth: '1200px',
    })
    return <GridEditor {...args} channel="digital" value={value} onChange={setValue} data-testid="story-grid" />
  },
}

export const Print: Story = {
  render: (args) => {
    const [value, setValue] = useState<GridEditorMetrics>({
      columns: 12,
      gutter: '5mm',
      margin: '15mm',
      maxWidth: '210mm',
    })
    return <GridEditor {...args} channel="print" value={value} onChange={setValue} data-testid="story-grid" />
  },
}
