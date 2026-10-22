import type { Meta, StoryObj } from '@storybook/react-vite'
import { TokenKindGlyph, tokenKindGlyphId } from './TokenKindGlyph'
import { Text } from './Text'

const meta = {
  title: 'Molecules/TokenKindGlyph',
  component: TokenKindGlyph,
  parameters: {
    docs: {
      description: {
        component:
          '16px kind metaphors for Token Studio filters and structured rows. Value chips stay on TokenPreview.',
      },
    },
  },
} satisfies Meta<typeof TokenKindGlyph>

export default meta
type Story = StoryObj<typeof meta>

const KINDS = [
  'all',
  'color',
  'space',
  'radius',
  'opacity',
  'size',
  'type',
  'shadow',
  'asset',
] as const

export const Catalog: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, color: 'var(--ink)' }}>
      {KINDS.map((id) => (
        <div
          key={id}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            padding: 10,
            border: '1px solid var(--line)',
            borderRadius: 8,
            background: 'var(--bg1)',
            minWidth: 72,
          }}
        >
          <TokenKindGlyph id={id} />
          <Text role="meta">{id}</Text>
        </div>
      ))}
    </div>
  ),
}

export const FromStudioTypes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {['color', 'spacing', 'typography', 'shadow', 'asset'].map((type) => (
        <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <TokenKindGlyph id={tokenKindGlyphId(type)} />
          <Text role="meta">{type}</Text>
        </div>
      ))}
    </div>
  ),
}
