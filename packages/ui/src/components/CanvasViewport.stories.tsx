import type { Meta, StoryObj } from '@storybook/react-vite'
import { CanvasViewport } from './CanvasViewport'
import { SelectionHandles } from './SelectionHandles'
import { Text } from './Text'

const meta = {
  title: 'Organisms/CanvasViewport',
  component: CanvasViewport,
  args: {
    zoom: 1,
    artboardWidth: 640,
    artboardHeight: 400,
  },
  render: (args) => (
    <div style={{ height: 360 }}>
      <CanvasViewport {...args}>
        <div style={{ padding: 24 }}>
          <Text>Artboard content</Text>
        </div>
      </CanvasViewport>
    </div>
  ),
} satisfies Meta<typeof CanvasViewport>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const ZoomedAndPanned: Story = {
  args: {
    zoom: 0.75,
    panX: 40,
    panY: 24,
  },
}

export const WithSelectionOverlay: Story = {
  args: {
    overlays: (
      <SelectionHandles left={48} top={48} width={160} height={96} interactive />
    ),
  },
}
