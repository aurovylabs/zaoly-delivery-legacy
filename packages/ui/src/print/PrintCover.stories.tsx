import type { Meta, StoryObj } from '@storybook/react-vite'
import { PrintCover, PrintPage } from './PrintPrimitives'

const meta = {
  title: 'Print/Cover',
  component: PrintCover,
  tags: ['print', 'magazine'],
} satisfies Meta<typeof PrintCover>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <PrintPage>
      <PrintCover
        eyebrow="Zaoly · Quick Check"
        title="beispiel.de — Quick Check"
        url="https://beispiel.de"
        meta="Demo-Projekt · 12.08.2026"
        fazit="Solide Domain-Basis, GEO-Sichtbarkeit ausbaufähig."
        kpis={[
          { label: 'Domain', value: '57', ringPct: 57 },
          { label: 'GEO', value: '42', ringPct: 42 },
          { label: 'Seiten', value: '50' },
          { label: 'Fehler', value: '213' },
        ]}
      />
    </PrintPage>
  ),
}
