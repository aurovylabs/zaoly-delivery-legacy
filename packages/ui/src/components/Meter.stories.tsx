import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Meter, MeterList } from './Meter'

const meta = {
  title: 'Molecules/Meter',
  component: Meter,
} satisfies Meta<typeof Meter>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: function DefaultStory() {
    const [value, setValue] = useState(50)
    return (
      <MeterList aria-label="Example meters">
        <Meter
          label="Risk aversion"
          hint=" · Prefer safe paths"
          valueLabel={`${value}%`}
          value={value}
          onChange={setValue}
        />
      </MeterList>
    )
  },
}

export const DimensionList: Story = {
  render: function ListStory() {
    const [dims, setDims] = useState({
      risk: 50,
      time: 40,
      explore: 65,
    })
    return (
      <MeterList aria-label="Journey dimensions">
        <Meter
          label="Risk aversion"
          valueLabel={`${dims.risk}%`}
          value={dims.risk}
          onChange={(n) => setDims((d) => ({ ...d, risk: n }))}
        />
        <Meter
          label="Time pressure"
          valueLabel={`${dims.time}%`}
          value={dims.time}
          onChange={(n) => setDims((d) => ({ ...d, time: n }))}
        />
        <Meter
          label="Exploration"
          valueLabel={`${dims.explore}%`}
          value={dims.explore}
          onChange={(n) => setDims((d) => ({ ...d, explore: n }))}
        />
      </MeterList>
    )
  },
}

export const Disabled: Story = {
  render: () => (
    <MeterList aria-label="Disabled">
      <Meter label="Locked" valueLabel="35%" value={35} disabled />
    </MeterList>
  ),
}
