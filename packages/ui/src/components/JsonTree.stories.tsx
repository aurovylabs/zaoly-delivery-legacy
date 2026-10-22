import type { Meta, StoryObj } from '@storybook/react-vite'
import { JsonTree } from './JsonTree'

const meta = {
  title: 'Molecules/JsonTree',
  component: JsonTree,
  args: {
    items: [
      { path: 'scan.overallScore', value: '82' },
      { path: 'scan.issues.items[0].ruleId', value: 'color-contrast' },
      { path: 'journey.taskCompleted', value: 'true' },
    ],
  },
} satisfies Meta<typeof JsonTree>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Empty: Story = {
  args: { items: [], emptyLabel: 'Noch kein Run-Context' },
}

export const Selectable: Story = {
  args: {
    onSelectPath: (path: string) => {
      console.log('select', path)
    },
  },
}
