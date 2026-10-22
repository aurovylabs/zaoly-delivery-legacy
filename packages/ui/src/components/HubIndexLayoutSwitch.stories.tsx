import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { HubIndexLayoutSwitch, type HubIndexLayout } from './HubIndexLayoutSwitch'

function Demo() {
  const [value, setValue] = useState<HubIndexLayout>('cards')
  return (
    <HubIndexLayoutSwitch
      value={value}
      onChange={setValue}
      aria-label="Layout"
      cardsLabel="Cards"
      listLabel="List"
    />
  )
}

const meta = {
  title: 'Molecules/HubIndexLayoutSwitch',
  component: HubIndexLayoutSwitch,
} satisfies Meta<typeof HubIndexLayoutSwitch>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <Demo />,
}
