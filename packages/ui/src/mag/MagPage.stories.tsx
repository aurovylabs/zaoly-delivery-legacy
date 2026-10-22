/**
 * Docs-only Mag Page chrome — logo + footer. No @react-pdf/renderer import.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'

function MagPageDocs() {
  return (
    <div style={{ fontFamily: 'ui-sans-serif, system-ui', maxWidth: 640, lineHeight: 1.5 }}>
      <p>
        <code>MagPage</code> is the A4 page shell (margins, footer folio, optional logo). Apps inject{' '}
        <code>logo</code> (e.g. creation/plexon <code>ZaolyLogoPdf</code>) and set{' '}
        <code>showLogo</code>.
      </p>
      <pre style={{ background: '#f4f4f0', padding: 12, fontSize: 12, overflow: 'auto' }}>
{`<MagPage footerTitle="beispiel.de" showLogo logo={<ZaolyLogoPdf … />} >
  {children}
</MagPage>`}
      </pre>
    </div>
  )
}

const meta = {
  title: 'Mag/Page',
  component: MagPageDocs,
  tags: ['mag', 'docs'],
} satisfies Meta<typeof MagPageDocs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
