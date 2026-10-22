import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ComponentType } from 'react'
import { INSPECT_GLYPH_SIZE } from './InspectLayoutGlyphs'
import * as IconExports from './icons'
import {
  IconAlignLeft,
  IconBordersAll,
  IconBordersNone,
  IconBordersRow,
  IconDensityComfortable,
  IconDensityCompact,
  IconDensityDefault,
  IconGap,
  IconMargin,
  IconPadding,
  IconPlus,
  IconRadius,
  IconSpaceBetween,
  IconTableAddColumn,
  IconTableAddRow,
  IconWarning,
} from './icons'
import { Text } from './Text'

type IconComponent = ComponentType<{ size?: number }>

const ALL_ICONS = Object.entries(IconExports)
  .filter(([name, value]) => name.startsWith('Icon') && typeof value === 'function')
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([name, Node]) => ({ name, Node: Node as IconComponent }))

const meta = {
  title: 'Foundation/Icons',
  parameters: {
    docs: {
      description: {
        component:
          'All Icon* exports are custom (`ds-ui-icon`). Lucide dependency removed. Spec: zaoly-ui-icon-language.md',
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

function IconGrid({
  items,
  size = 20,
}: {
  items: readonly { name: string; Node: IconComponent }[]
  size?: number
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(8rem, 1fr))',
        gap: '1rem',
        color: 'var(--ink)',
      }}
    >
      {items.map(({ name, Node }) => (
        <div
          key={name}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem',
            border: '1px solid var(--line)',
            borderRadius: 8,
            background: 'var(--bg1)',
          }}
        >
          <Node size={size} />
          <Text role="meta" as="span">
            {name}
          </Text>
        </div>
      ))}
    </div>
  )
}

/** Full catalog — every `Icon*` export from `@zaoly/ui`. */
export const All: Story = {
  name: 'All icons',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Text role="meta">
        {ALL_ICONS.length} icons · size {INSPECT_GLYPH_SIZE.md}px
      </Text>
      <IconGrid items={ALL_ICONS} size={INSPECT_GLYPH_SIZE.md} />
    </div>
  ),
}

export const SizeLadder: Story = {
  name: 'Size ladder (16 → 48)',
  render: () => {
    const samples = [IconPlus, IconAlignLeft, IconSpaceBetween, IconWarning] as const
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, color: 'var(--ink)' }}>
        {(
          [
            ['sm', INSPECT_GLYPH_SIZE.sm],
            ['md', INSPECT_GLYPH_SIZE.md],
            ['lg', INSPECT_GLYPH_SIZE.lg],
            ['xl', INSPECT_GLYPH_SIZE.xl],
          ] as const
        ).map(([token, size]) => (
          <div key={token}>
            <Text role="meta">
              {token} · {size}px
            </Text>
            <div style={{ display: 'flex', gap: 16, marginTop: 8, alignItems: 'center' }}>
              {samples.map((Node, i) => (
                <Node key={i} size={size} />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  },
}

/** Box-model spacing trio for HUD / inspect — Gap · Pad (inner) · Margin (outer). */
export const BoxSpacing: Story = {
  name: 'Box spacing (Gap / Pad / Margin)',
  render: () => {
    const items = [
      {
        name: 'IconGap',
        Node: IconGap,
        note: 'Sibling spacing between children',
      },
      {
        name: 'IconPadding',
        Node: IconPadding,
        note: 'Inner — solid frame, filled inset, ticks point in',
      },
      {
        name: 'IconMargin',
        Node: IconMargin,
        note: 'Outer — dashed ring, hollow content, ticks point out',
      },
      {
        name: 'IconRadius',
        Node: IconRadius,
        note: 'Corner radius (pair for length menus)',
      },
    ] as const
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, color: 'var(--ink)' }}>
        <Text role="meta">
          CREATION Smart HUD tokenLength triggers · Wave 3 · compare at {INSPECT_GLYPH_SIZE.lg}px and
          HUD density 1.25rem
        </Text>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(11rem, 1fr))',
            gap: '1rem',
          }}
        >
          {items.map(({ name, Node, note }) => (
            <div
              key={name}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '1rem',
                border: '1px solid var(--line)',
                borderRadius: 8,
                background: 'var(--bg1)',
                textAlign: 'center',
              }}
            >
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <Node size={INSPECT_GLYPH_SIZE.md} />
                <Node size={INSPECT_GLYPH_SIZE.lg} />
                <span style={{ width: '1.25rem', height: '1.25rem', display: 'inline-flex' }}>
                  <Node size={20} />
                </span>
              </div>
              <Text role="label" as="span">
                {name}
              </Text>
              <Text role="meta" as="span">
                {note}
              </Text>
            </div>
          ))}
        </div>
      </div>
    )
  },
}

/** SiteTable structure actions — Add row / Add column. */
export const TableStructure: Story = {
  name: 'Table structure (Add row / Add col)',
  render: () => {
    const items = [
      {
        name: 'IconTableAddRow',
        Node: IconTableAddRow,
        note: 'Append body row — grid + bottom plus',
      },
      {
        name: 'IconTableAddColumn',
        Node: IconTableAddColumn,
        note: 'Append column — grid + side plus',
      },
    ] as const
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, color: 'var(--ink)' }}>
        <Text role="meta">
          CREATION Smart HUD table structureOps · Wave 3 · compare at {INSPECT_GLYPH_SIZE.lg}px and HUD
          density 1.25rem
        </Text>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(11rem, 1fr))',
            gap: '1rem',
          }}
        >
          {items.map(({ name, Node, note }) => (
            <div
              key={name}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '1rem',
                border: '1px solid var(--line)',
                borderRadius: 8,
                background: 'var(--bg1)',
                textAlign: 'center',
              }}
            >
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <Node size={INSPECT_GLYPH_SIZE.md} />
                <Node size={INSPECT_GLYPH_SIZE.lg} />
                <span style={{ width: '1.25rem', height: '1.25rem', display: 'inline-flex' }}>
                  <Node size={20} />
                </span>
              </div>
              <Text role="label" as="span">
                {name}
              </Text>
              <Text role="meta" as="span">
                {note}
              </Text>
            </div>
          ))}
        </div>
      </div>
    )
  },
}

/** SiteTable density + borders segmented metaphors. */
export const TableSegmented: Story = {
  name: 'Table segmented (Density / Borders)',
  render: () => {
    const density = [
      { name: 'IconDensityCompact', Node: IconDensityCompact, note: 'Tight row rhythm' },
      { name: 'IconDensityDefault', Node: IconDensityDefault, note: 'Default row rhythm' },
      {
        name: 'IconDensityComfortable',
        Node: IconDensityComfortable,
        note: 'Wide / filled row rhythm',
      },
    ] as const
    const borders = [
      { name: 'IconBordersNone', Node: IconBordersNone, note: 'Soft empty frame' },
      { name: 'IconBordersRow', Node: IconBordersRow, note: 'Horizontal rules' },
      { name: 'IconBordersAll', Node: IconBordersAll, note: 'Full cell grid' },
    ] as const
    const renderGroup = (
      title: string,
      items: readonly { name: string; Node: IconComponent; note: string }[],
    ) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Text role="label">{title}</Text>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(10rem, 1fr))',
            gap: '1rem',
          }}
        >
          {items.map(({ name, Node, note }) => (
            <div
              key={name}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.85rem',
                border: '1px solid var(--line)',
                borderRadius: 8,
                background: 'var(--bg1)',
                textAlign: 'center',
              }}
            >
              <Node size={INSPECT_GLYPH_SIZE.lg} />
              <Text role="meta" as="span">
                {name}
              </Text>
              <Text role="meta" as="span">
                {note}
              </Text>
            </div>
          ))}
        </div>
      </div>
    )
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, color: 'var(--ink)' }}>
        <Text role="meta">CREATION SiteTable HUD segmented · Wave 3 · Wave C control language</Text>
        {renderGroup('Density', density)}
        {renderGroup('Borders', borders)}
      </div>
    )
  },
}
