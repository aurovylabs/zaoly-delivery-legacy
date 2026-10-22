import type { Meta, StoryObj } from '@storybook/react-vite'
import { PrintPage, PrintTraitBars } from './PrintPrimitives'

const meta = {
  title: 'Print/TraitBars',
  component: PrintTraitBars,
  tags: ['print', 'magazine'],
} satisfies Meta<typeof PrintTraitBars>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <PrintPage>
      <PrintTraitBars
        traits={[
          { displayName: 'Preis-Sensibilität', score: 62 },
          { displayName: 'Markenvertrauen', score: 78 },
          { displayName: 'Recherche-Tiefe', score: 84 },
        ]}
      />
    </PrintPage>
  ),
}
