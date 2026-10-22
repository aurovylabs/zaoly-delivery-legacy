import type { Meta, StoryObj } from '@storybook/react-vite'
import { PrintCallout, PrintPage } from './PrintPrimitives'

const meta = {
  title: 'Print/Callout',
  component: PrintCallout,
} satisfies Meta<typeof PrintCallout>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <PrintPage>
      <PrintCallout label="Hinweis" variant="wash">
        Only contact fields crossed the relevance threshold.
      </PrintCallout>
    </PrintPage>
  ),
}

/** P92 — all PrintCalloutVariant values for HTML ↔ Mag parity smoke. */
export const Variants: Story = {
  render: () => (
    <PrintPage>
      <PrintCallout variant="wash" label="wash">
        Soft wash band for report callouts.
      </PrintCallout>
      <PrintCallout variant="emphasize" label="emphasize">
        Stronger band with accent edge.
      </PrintCallout>
      <PrintCallout variant="quiet" label="quiet">
        Secondary note with hairline border.
      </PrintCallout>
    </PrintPage>
  ),
}
