import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  PrintChapter,
  PrintCover,
  PrintDonut,
  PrintLedger,
  PrintPage,
  PrintPersonaGrid,
  PrintPullQuote,
  PrintRankedList,
  PrintScoreRing,
  PrintTable,
  PrintTwoColumn,
} from './PrintPrimitives'

const meta = {
  title: 'Print/QuickCheck',
  component: PrintPage,
  tags: ['print', 'magazine'],
} satisfies Meta<typeof PrintPage>

export default meta
type Story = StoryObj<typeof meta>

/** Full Quick Check print template twin — chapter rhythm for design review. */
export const MagazineDeck: Story = {
  render: () => (
    <PrintPage folioTitle="beispiel.de" folioPage="1 — 6">
      <PrintCover
        eyebrow="Zaoly · Quick Check"
        title="beispiel.de — Quick Check"
        url="https://beispiel.de"
        meta="Collection Demo · 12.08.2026"
        fazit="Domain tragfähig; GEO-Prompts zeigen Lücken bei Lieferversprechen."
        kpis={[
          { label: 'Domain', value: '57', ringPct: 57 },
          { label: 'GEO', value: '41', ringPct: 41 },
          { label: 'Seiten', value: '50' },
        ]}
      />

      <PrintChapter index="01" eyebrow="Domain-Scan" title="Domain & Barrierefreiheit" lede="beispiel.de">
        <PrintTwoColumn
          left={
            <div style={{ display: 'flex', marginBottom: '0.75rem' }}>
              <div style={{ marginRight: '1rem' }}>
                <PrintScoreRing value={57} label="Score" />
              </div>
              <div>
                <div className="zaoly-print-kpi__value">50</div>
                <div className="zaoly-print-kpi__label">Seiten</div>
                <p className="zaoly-print-meta">Fehler 213 · Warnungen 0</p>
              </div>
            </div>
          }
          right={
            <div>
              <p className="zaoly-print-sub-eyebrow">Top Issues</p>
              <PrintRankedList
                compact
                items={[
                  { label: 'Form without submit button', meta: '50×' },
                  { label: 'Img with empty alt', meta: '49×' },
                  { label: 'Link without discernible name', meta: '31×' },
                ]}
              />
            </div>
          }
        />
      </PrintChapter>

      <PrintChapter index="02" eyebrow="Verteilungen" title="Anteil am Corpus" lede="Donuts in einer Zeile.">
        <div className="zaoly-print-dist-grid">
          <div>
            <p className="zaoly-print-eyebrow">Lesbarkeit</p>
            <PrintDonut
              slices={[
                { id: 'standard', label: 'Standard', value: 22 },
                { id: 'complex', label: 'Komplex', value: 26 },
              ]}
              centerValue={10.2}
              centerLabel="Score"
            />
          </div>
          <div>
            <p className="zaoly-print-eyebrow">Eco-Noten</p>
            <PrintDonut
              slices={[
                { id: 'C', label: 'C', value: 26 },
                { id: 'F', label: 'F', value: 14 },
              ]}
              centerValue="C"
              centerLabel="Modus"
            />
          </div>
          <div>
            <p className="zaoly-print-eyebrow">Link-Mix</p>
            <PrintDonut
              slices={[
                { id: 'internal', label: 'Intern', value: 19689 },
                { id: 'external', label: 'Extern', value: 656 },
              ]}
              centerValue={0}
              centerLabel="defekt"
            />
          </div>
        </div>
      </PrintChapter>

      <PrintChapter index="03" eyebrow="Personas" title="Personas">
        <PrintPersonaGrid
          personas={[
            {
              name: 'Anna Planer',
              segment: 'B2B',
              confidence: 0.82,
              bio: 'Plant Filialausstattung und braucht belastbare Lieferversprechen.',
              traits: [
                { displayName: 'Preis', score: 62 },
                { displayName: 'Vertrauen', score: 78 },
              ],
              goals: ['Schnelle Verfügbarkeit'],
              painPoints: ['Unklare Lieferzeiten'],
            },
            {
              name: 'Jonas Sucher',
              segment: 'Privat',
              confidence: 0.71,
              bio: 'Vergleicht online und erwartet Prompt-taugliche Antworten.',
              traits: [{ displayName: 'Recherche', score: 84 }],
              goals: ['Passende Variante'],
            },
          ]}
        />
      </PrintChapter>

      <PrintChapter index="04" eyebrow="E-E-A-T" title="E-E-A-T">
        <PrintPullQuote body="Schwächste Signale zuerst — Erfahrung und lokal nachweisbare Expertise." />
        <PrintLedger
          items={[
            { label: 'Erfahrung', score: 34, detail: 'Wenig First-Hand-Nachweis' },
            { label: 'Fachkompetenz', score: 58 },
            { label: 'Autorität', score: 71 },
            { label: 'Vertrauen', score: 82 },
          ]}
        />
      </PrintChapter>

      <PrintChapter index="05" eyebrow="Vergleich" title="Domain-Vergleich">
        <PrintTable
          columns={['Domain', 'Rolle', 'Score', 'Seiten']}
          rows={[
            ['beispiel.de', 'Eigen', 57, 50],
            ['wettbewerber.de', 'Wettbewerb', 61, 120],
          ]}
        />
      </PrintChapter>

      <PrintChapter index="06" eyebrow="GEO" title="GEO-Empfehlungen">
        <PrintRankedList
          columns={2}
          items={[
            { label: 'FAQ-Schema ergänzen', meta: 'Strukturierte Antworten für LLMs.' },
            { label: 'Autorenboxen auf Ratgeberseiten' },
            { label: 'Lokale Landingpages mit Prompt-Ankern' },
            { label: 'Lieferversprechen standardisieren' },
          ]}
        />
      </PrintChapter>
    </PrintPage>
  ),
}
