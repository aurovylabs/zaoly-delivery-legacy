import type { Meta, StoryObj } from '@storybook/react-vite'
import { PrintPage, PrintTwoColumn, PrintRankedList } from './PrintPrimitives'

const meta = {
  title: 'Print/TwoColumn',
  component: PrintTwoColumn,
  tags: ['print', 'magazine'],
} satisfies Meta<typeof PrintTwoColumn>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <PrintPage>
      <PrintTwoColumn
        left={
          <div>
            <p className="zaoly-print-sub-eyebrow">Überblick</p>
            <p className="zaoly-print-body">
              Solide Domain-Basis mit ausbaufähiger GEO-Sichtbarkeit. Die Kernseiten tragen,
              Prompt-Antworten bleiben jedoch dünn bei Lieferversprechen.
            </p>
          </div>
        }
        right={
          <div>
            <p className="zaoly-print-sub-eyebrow">Findings</p>
            <PrintRankedList
              compact
              items={[
                { label: 'FAQ-Schema fehlt auf Ratgeberseiten' },
                { label: 'Autorenboxen inkonsistent' },
                { label: 'Lokale Landingpages ohne Prompt-Anker' },
              ]}
            />
          </div>
        }
      />
    </PrintPage>
  ),
}
