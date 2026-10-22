import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { BreakpointSwitcher, type EditorBreakpoint } from './BreakpointSwitcher'

const meta = {
  title: 'Molecules/BreakpointSwitcher',
  component: BreakpointSwitcher,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Mobile / tablet / desktop segmented control for editor preview chrome. Apps may pass `print` via options; map value → artboard size.',
      },
    },
  },
} satisfies Meta<typeof BreakpointSwitcher>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    value: 'desktop',
    onChange: () => undefined,
  },
}

export const Interactive: Story = {
  render: function InteractiveStory() {
    const [value, setValue] = useState<EditorBreakpoint>('tablet')
    return <BreakpointSwitcher value={value} onChange={setValue} />
  },
}

export const CustomLabels: Story = {
  args: {
    value: 'mobile',
    onChange: () => undefined,
    labels: {
      mobile: 'SM',
      tablet: 'MD',
      desktop: 'LG',
    },
  },
}

export const WithPrint: Story = {
  args: {
    value: 'print',
    onChange: () => undefined,
    options: ['mobile', 'tablet', 'desktop', 'print'],
    labels: {
      print: 'Print',
    },
  },
}

export const Icon: Story = {
  args: {
    value: 'desktop',
    onChange: () => undefined,
    variant: 'icon',
    options: ['mobile', 'tablet', 'desktop', 'print'],
  },
}
