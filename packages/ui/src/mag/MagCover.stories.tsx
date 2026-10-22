/**
 * Docs-only Mag Cover — PDF twin of Print/Cover. No @react-pdf/renderer import.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'

function MagCoverDocs() {
  return (
    <div style={{ fontFamily: 'ui-sans-serif, system-ui', maxWidth: 640, lineHeight: 1.5 }}>
      <p>
        <code>MagCover</code> is the PDF twin of <strong>Print/Cover</strong>. Import from{' '}
        <code>@zaoly/ui/mag</code>. Preview the layout in Storybook under Print/Cover.
      </p>
      <pre style={{ background: '#f4f4f0', padding: 12, fontSize: 12, overflow: 'auto' }}>
{`import { MagCover, MagPage } from '@zaoly/ui/mag'

<MagPage footerTitle="beispiel.de">
  <MagCover eyebrow="Quick Check" title="…" kpis={[…]} />
</MagPage>`}
      </pre>
    </div>
  )
}

const meta = {
  title: 'Mag/Cover',
  component: MagCoverDocs,
  tags: ['mag', 'docs'],
} satisfies Meta<typeof MagCoverDocs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
