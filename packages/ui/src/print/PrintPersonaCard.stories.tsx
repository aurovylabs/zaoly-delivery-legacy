import type { Meta, StoryObj } from '@storybook/react-vite'
import { PrintPage, PrintPersonaCard } from './PrintPrimitives'

const meta = {
  title: 'Print/PersonaCard',
  component: PrintPersonaCard,
  tags: ['print', 'magazine'],
} satisfies Meta<typeof PrintPersonaCard>

export default meta
type Story = StoryObj<typeof meta>

const sample = {
  name: 'Anna Planer',
  segment: 'B2B Entscheiderin',
  confidence: 0.82,
  bio: 'Plant Einrichtungen für Filialen und braucht belastbare Lieferversprechen.',
  traits: [
    { displayName: 'Preis-Sensibilität', score: 62 },
    { displayName: 'Markenvertrauen', score: 78 },
  ],
  goals: ['Schnelle Verfügbarkeit', 'Klare Konfiguration'],
  painPoints: ['Unklare Lieferzeiten', 'Fehlende Montageinfos'],
}

export const Default: Story = {
  render: () => (
    <PrintPage>
      <PrintPersonaCard persona={sample} />
    </PrintPage>
  ),
}

export const Spread: Story = {
  render: () => (
    <PrintPage>
      <PrintPersonaCard persona={sample} spread />
    </PrintPage>
  ),
}
