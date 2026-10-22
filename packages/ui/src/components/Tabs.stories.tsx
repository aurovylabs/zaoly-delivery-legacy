import type { Meta, StoryObj } from '@storybook/react-vite'
import { Tabs } from './Tabs'

const meta = {
  title: 'Molecules/Tabs',
  component: Tabs,
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (<Tabs aria-label="Example tabs" value="overview" onChange={() => {}} items={[{ id: "overview", label: "Overview", panel: "Overview content" }, { id: "details", label: "Details", panel: "Detail content" }]} />),
}
