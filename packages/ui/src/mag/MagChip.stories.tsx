/**
 * Docs-only Mag Chip — PDF twin of Print/Chip. No @react-pdf/renderer import.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'

function MagChipDocs() {
  return (
    <div style={{ fontFamily: 'ui-sans-serif, system-ui', maxWidth: 640, lineHeight: 1.5 }}>
      <p>
        <code>MagChip</code> / <code>MagChipRow</code> twin <strong>Print/Chip</strong>. Colors follow{' '}
        <code>MagThemeProvider</code> when set; else DS <code>magColors</code>.
      </p>
      <p>
        Visual preview: Storybook <code>Print/Chip</code> (incl. <code>Tones</code>).
        PDF prop: <code>tone</code> — <code>default | muted | accent | solid</code> (P92).
      </p>
    </div>
  )
}

const meta = {
  title: 'Mag/Chip',
  component: MagChipDocs,
  tags: ['mag', 'docs'],
} satisfies Meta<typeof MagChipDocs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
