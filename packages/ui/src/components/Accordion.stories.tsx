import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Accordion } from './Accordion'

const meta = {
  title: 'Molecules/Accordion',
  component: Accordion,
} satisfies Meta<typeof Accordion>

export default meta
type Story = StoryObj<typeof meta>

function Demo() {
  const [value, setValue] = useState<string | null>('company')
  return (
    <Accordion
      aria-label="Knowledge chapters"
      value={value}
      onChange={setValue}
      footer={<button type="button">Add chapter</button>}
      items={[
        {
          id: 'company',
          title: 'Company',
          preview: 'B2B research platform for brand teams…',
          panel: <p>B2B research platform helping brand teams ground decisions in living persona magazines.</p>,
        },
        {
          id: 'market',
          title: 'Market',
          preview: 'Mid-market brand and insights teams…',
          panel: <p>Mid-market brand and insights teams who need shared audience truth.</p>,
        },
        {
          id: 'voice',
          title: 'Brand voice',
          preview: 'Clear, editorial, confident…',
          panel: <p>Clear, editorial, confident — magazine not dashboard.</p>,
        },
      ]}
    />
  )
}

export const Default: Story = {
  render: () => <Demo />,
}
