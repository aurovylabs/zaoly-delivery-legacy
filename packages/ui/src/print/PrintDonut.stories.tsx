import type { Meta, StoryObj } from '@storybook/react-vite'
import { PrintDonut, PrintPage } from './PrintPrimitives'

const meta = {
  title: 'Print/Donut',
  component: PrintDonut,
  tags: ['print', 'magazine'],
} satisfies Meta<typeof PrintDonut>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <PrintPage>
      <PrintDonut
        slices={[
          { id: 'standard', label: 'Standard', value: 22 },
          { id: 'complex', label: 'Komplex', value: 26 },
          { id: 'very', label: 'Sehr komplex', value: 2 },
        ]}
        centerValue={10.2}
        centerLabel="Score"
      />
    </PrintPage>
  ),
}
