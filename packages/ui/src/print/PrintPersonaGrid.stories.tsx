import type { Meta, StoryObj } from '@storybook/react-vite'
import { PrintPage, PrintPersonaGrid } from './PrintPrimitives'

const meta = {
  title: 'Print/PersonaGrid',
  component: PrintPersonaGrid,
  tags: ['print', 'magazine'],
} satisfies Meta<typeof PrintPersonaGrid>

export default meta
type Story = StoryObj<typeof meta>

const sample = [
  {
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
  },
  {
    name: 'Jonas Sucher',
    segment: 'Privatkunde',
    confidence: 0.71,
    bio: 'Vergleicht online und erwartet Prompt-taugliche Antworten.',
    traits: [
      { displayName: 'Recherche-Tiefe', score: 84 },
      { displayName: 'Lokalbezug', score: 55 },
    ],
    goals: ['Passende Variante finden'],
    painPoints: ['Widersprüchliche Specs'],
  },
]

export const Default: Story = {
  render: () => (
    <PrintPage>
      <PrintPersonaGrid personas={sample} />
    </PrintPage>
  ),
}

export const Spread: Story = {
  render: () => (
    <PrintPage>
      <PrintPersonaGrid personas={[sample[0]!]} />
    </PrintPage>
  ),
}
