import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  GridColumnGlyph,
  GridSpanGlyph,
  INSPECT_GLYPH_SIZE,
  MediaFitGlyph,
  SizeModeGlyph,
  columnGlyphForPresetLabel,
  mediaFitLabel,
} from './InspectLayoutGlyphs'
import {
  AutoFlowGlyph,
  BgPositionGlyph,
  BorderStyleGlyph,
  CellParkGlyph,
  ClipPresetGlyph,
  DistributeGlyph,
  FlowDirectionGlyph,
  OverflowGlyph,
  PositionGlyph,
  WrapGlyph,
} from './InspectLayoutGlyphsExtra'
import {
  SelfParkGlyph,
  NinePointGlyph,
  TextAlignGlyph,
  AspectRatioGlyph,
  GapAxisGlyph,
  DisplayModeGlyph,
} from './InspectLayoutGlyphsMore'
import {
  VisibilityGlyph,
  BoxSizingGlyph,
  WhiteSpaceGlyph,
  FloatGlyph,
  WritingModeGlyph,
  MarginPaddingGlyph,
  StackOrderGlyph,
} from './InspectLayoutGlyphsCatalog'
import { IconBox, IconColumns, IconMaximize, IconMinimize, IconStretch } from './icons'
import { Text } from './Text'

const meta = {
  title: 'Foundation/Inspect Layout Glyphs',
  parameters: {
    docs: {
      description: {
        component:
          'Inspect diagrams tuned to Foundation Lucide icons (default 16px via INSPECT_GLYPH_SIZE.sm). Use md/lg/xl (24/32/48) for denser chrome, Storybook review, and docs tiles — geometry scales, strokes stay hairline. Accents use `--accent`. Compare with Icons via Vs Icons; theme toolbar for light/dark.',
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

function Tile({
  label,
  children,
  active,
  minWidth = 48,
}: {
  label: string
  children: React.ReactNode
  active?: boolean
  minWidth?: number
}) {
  return (
    <div
      className={active ? 'ds-inspect-glyph-tile is-active' : 'ds-inspect-glyph-tile'}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        minWidth,
        padding: '8px 10px',
        borderRadius: 6,
        border: active
          ? '1px solid color-mix(in srgb, var(--accent) 55%, var(--line))'
          : '1px solid var(--line)',
        background: active
          ? 'color-mix(in srgb, var(--accent) 12%, transparent)'
          : 'var(--bg1)',
        color: 'var(--ink)',
        fontSize: 11,
      }}
    >
      {children}
      <span>{label}</span>
    </div>
  )
}

function SizeRow({
  title,
  size,
  children,
}: {
  title: string
  size: number
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Text role="meta">
        {title} · {size}px
      </Text>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {children}
      </div>
    </div>
  )
}

export const SizeModes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Text role="meta">Width axis</Text>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(['hug', 'fill', 'fixed'] as const).map((id, i) => (
          <Tile key={id} label={id} active={i === 1}>
            <SizeModeGlyph id={id} axis="width" />
          </Tile>
        ))}
      </div>
      <Text role="meta">Height axis</Text>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(['hug', 'fill', 'fixed'] as const).map((id) => (
          <Tile key={id} label={id}>
            <SizeModeGlyph id={id} axis="height" />
          </Tile>
        ))}
      </div>
    </div>
  ),
}

export const MediaFit: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {(['cover', 'contain', 'auto', 'fill', 'none', 'scale-down'] as const).map((id, i) => (
        <Tile key={id} label={mediaFitLabel(id)} active={i === 0}>
          <MediaFitGlyph id={id} />
        </Tile>
      ))}
    </div>
  ),
}

export const GridColumns: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {[
        '1 Col',
        '2 Col',
        '3 Col',
        '4 Col',
        '6 Col',
        '12 Col',
        'Auto-Fit',
        'Auto-Fill',
        '1 : 2',
        '2 : 1',
        'Sidebar',
        '3-Pane',
      ].map((label, i) => (
        <Tile key={label} label={label} active={i === 2}>
          <GridColumnGlyph id={columnGlyphForPresetLabel(label)} />
        </Tile>
      ))}
    </div>
  ),
}

export const GridSpan: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Text role="meta">Column span</Text>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(['span-auto', 'span-1', 'span-2', 'span-3', 'span-4', 'span-full'] as const).map(
          (id) => (
            <Tile key={id} label={id.replace('span-', '')}>
              <GridSpanGlyph id={id} axis="col" />
            </Tile>
          ),
        )}
      </div>
      <Text role="meta">Row span</Text>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(['span-auto', 'span-1', 'span-2', 'span-3', 'span-full'] as const).map((id) => (
          <Tile key={id} label={id.replace('span-', '')}>
            <GridSpanGlyph id={id} axis="row" />
          </Tile>
        ))}
      </div>
    </div>
  ),
}

export const AllFamilies: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Text role="title">Size</Text>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <SizeModeGlyph id="hug" />
          <SizeModeGlyph id="fill" />
          <SizeModeGlyph id="fixed" />
        </div>
      </div>
      <div>
        <Text role="title">Fit</Text>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <MediaFitGlyph id="cover" />
          <MediaFitGlyph id="contain" />
          <MediaFitGlyph id="fill" />
        </div>
      </div>
      <div>
        <Text role="title">Grid</Text>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <GridColumnGlyph id="cols-3" />
          <GridColumnGlyph id="sidebar" />
          <GridSpanGlyph id="span-2" axis="col" />
        </div>
      </div>
    </div>
  ),
}

/** Side-by-side with Foundation Lucide icons — optical parity check. */
export const VsIcons: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: 16,
        color: 'var(--ink)',
      }}
    >
      {[
        {
          label: 'Columns',
          icons: [<IconColumns key="i" />, <GridColumnGlyph key="g" id="cols-3" />],
        },
        {
          label: 'Stretch / Fill',
          icons: [<IconStretch key="i" />, <SizeModeGlyph key="g" id="fill" axis="width" />],
        },
        {
          label: 'Box / Fixed',
          icons: [<IconBox key="i" />, <SizeModeGlyph key="g" id="fixed" axis="width" />],
        },
        {
          label: 'Min / Hug',
          icons: [<IconMinimize key="i" />, <SizeModeGlyph key="g" id="hug" axis="width" />],
        },
        {
          label: 'Max / Cover',
          icons: [<IconMaximize key="i" />, <MediaFitGlyph key="g" id="cover" />],
        },
      ].map((row) => (
        <div
          key={row.label}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            padding: 12,
            border: '1px solid var(--line)',
            borderRadius: 8,
            background: 'var(--bg1)',
          }}
        >
          <Text role="meta">{row.label}</Text>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>{row.icons}</div>
        </div>
      ))}
    </div>
  ),
}


export const DistributeAndPark: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Tile label="Packed">
          <DistributeGlyph id="packed" />
        </Tile>
        <Tile label="Even" active>
          <DistributeGlyph id="even" />
        </Tile>
      </div>
      <Text role="meta">Cell park (horizontal)</Text>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(['start', 'center', 'end', 'stretch'] as const).map((id) => (
          <Tile key={id} label={id}>
            <CellParkGlyph id={id} axis="h" />
          </Tile>
        ))}
      </div>
    </div>
  ),
}

export const FlowWrapAutoFlow: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {(['row', 'column', 'row-reverse', 'column-reverse'] as const).map((id) => (
        <Tile key={id} label={id}>
          <FlowDirectionGlyph id={id} />
        </Tile>
      ))}
      <Tile label="nowrap">
        <WrapGlyph id="nowrap" />
      </Tile>
      <Tile label="wrap">
        <WrapGlyph id="wrap" />
      </Tile>
      {(['row', 'column', 'dense'] as const).map((id) => (
        <Tile key={`af-${id}`} label={`flow ${id}`}>
          <AutoFlowGlyph id={id} />
        </Tile>
      ))}
    </div>
  ),
}

export const PositionOverflowBorder: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {(['static', 'relative', 'absolute', 'fixed', 'sticky'] as const).map((id) => (
        <Tile key={id} label={id}>
          <PositionGlyph id={id} />
        </Tile>
      ))}
      {(['visible', 'hidden', 'scroll', 'auto'] as const).map((id) => (
        <Tile key={`o-${id}`} label={id}>
          <OverflowGlyph id={id} />
        </Tile>
      ))}
      {(['solid', 'dashed', 'dotted', 'none'] as const).map((id) => (
        <Tile key={`b-${id}`} label={id}>
          <BorderStyleGlyph id={id} />
        </Tile>
      ))}
    </div>
  ),
}

export const BgPosAndClip: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(['center', 'top', 'bottom', 'left', 'right'] as const).map((id) => (
          <Tile key={id} label={id}>
            <BgPositionGlyph id={id} />
          </Tile>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(
          [
            'none',
            'slant-bottom',
            'slant-bottom-flip',
            'slant-top',
            'trapezoid',
            'parallelogram',
          ] as const
        ).map((id) => (
          <Tile key={id} label={id}>
            <ClipPresetGlyph id={id} />
          </Tile>
        ))}
      </div>
    </div>
  ),
}

export const Catalog: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, color: 'var(--ink)' }}>
      <SizeModeGlyph id="hug" />
      <SizeModeGlyph id="fill" />
      <SizeModeGlyph id="fixed" />
      <MediaFitGlyph id="cover" />
      <DistributeGlyph id="even" />
      <CellParkGlyph id="center" axis="h" />
      <FlowDirectionGlyph id="row" />
      <WrapGlyph id="wrap" />
      <AutoFlowGlyph id="dense" />
      <PositionGlyph id="sticky" />
      <OverflowGlyph id="hidden" />
      <BorderStyleGlyph id="dashed" />
      <BgPositionGlyph id="top" />
      <ClipPresetGlyph id="trapezoid" />
      <SelfParkGlyph id="stretch" />
      <NinePointGlyph id="center" />
      <TextAlignGlyph id="justify" />
      <AspectRatioGlyph id="16-9" />
      <DisplayModeGlyph id="grid" />
      <VisibilityGlyph id="hidden" />
      <BoxSizingGlyph id="border-box" />
      <FloatGlyph id="left" />
      <WhiteSpaceGlyph id="nowrap" />
      <WritingModeGlyph id="vertical" />
      <GapAxisGlyph id="both" />
      <GridColumnGlyph id="cols-3" />
      <GridSpanGlyph id="span-2" axis="col" />
    </div>
  ),
}


export const SelfParkAndNinePoint: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(['auto', 'start', 'center', 'end', 'stretch'] as const).map((id) => (
          <Tile key={id} label={id}>
            <SelfParkGlyph id={id} axis="v" />
          </Tile>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(
          [
            'top-left',
            'top',
            'top-right',
            'left',
            'center',
            'right',
            'bottom-left',
            'bottom',
            'bottom-right',
          ] as const
        ).map((id) => (
          <Tile key={id} label={id}>
            <NinePointGlyph id={id} />
          </Tile>
        ))}
      </div>
    </div>
  ),
}

export const TextAspectDisplay: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {(['start', 'center', 'end', 'justify'] as const).map((id) => (
        <Tile key={id} label={id}>
          <TextAlignGlyph id={id} />
        </Tile>
      ))}
      {(['free', '1-1', '16-9', '9-16'] as const).map((id) => (
        <Tile key={id} label={id}>
          <AspectRatioGlyph id={id} />
        </Tile>
      ))}
      {(['both', 'row', 'column'] as const).map((id) => (
        <Tile key={`g-${id}`} label={`gap ${id}`}>
          <GapAxisGlyph id={id} />
        </Tile>
      ))}
    </div>
  ),
}

export const DisplayModes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {(
        [
          'block',
          'inline-block',
          'inline',
          'flex',
          'inline-flex',
          'grid',
          'inline-grid',
          'table',
          'list-item',
          'contents',
          'none',
        ] as const
      ).map((id) => (
        <Tile key={id} label={id}>
          <DisplayModeGlyph id={id} />
        </Tile>
      ))}
    </div>
  ),
}

export const CatalogReserve: Story = {
  name: 'Catalog reserve (unused consumers OK)',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {(['visible', 'hidden', 'collapse'] as const).map((id) => (
          <Tile key={id} label={id}>
            <VisibilityGlyph id={id} />
          </Tile>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {(['content-box', 'border-box'] as const).map((id) => (
          <Tile key={id} label={id}>
            <BoxSizingGlyph id={id} />
          </Tile>
        ))}
        {(['none', 'left', 'right'] as const).map((id) => (
          <Tile key={`f-${id}`} label={`float ${id}`}>
            <FloatGlyph id={id} />
          </Tile>
        ))}
        {(['horizontal', 'vertical'] as const).map((id) => (
          <Tile key={`w-${id}`} label={id}>
            <WritingModeGlyph id={id} />
          </Tile>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {(['normal', 'nowrap', 'pre', 'pre-wrap'] as const).map((id) => (
          <Tile key={id} label={id}>
            <WhiteSpaceGlyph id={id} />
          </Tile>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {(['margin', 'padding', 'both'] as const).map((id) => (
          <Tile key={id} label={id}>
            <MarginPaddingGlyph id={id} />
          </Tile>
        ))}
        {(['front', 'forward', 'backward', 'back'] as const).map((id) => (
          <Tile key={`z-${id}`} label={id}>
            <StackOrderGlyph id={id} />
          </Tile>
        ))}
      </div>
    </div>
  ),
}

/** Side-by-side size tokens for optical check when scaling. */
export const SizeLadder: Story = {
  name: 'Size ladder (16 → 48)',
  render: () => {
    const samples = [
      { label: 'fill', node: (s: number) => <SizeModeGlyph id="fill" axis="width" size={s} /> },
      { label: 'cover', node: (s: number) => <MediaFitGlyph id="cover" size={s} /> },
      { label: 'cols-3', node: (s: number) => <GridColumnGlyph id="cols-3" size={s} /> },
      { label: 'even', node: (s: number) => <DistributeGlyph id="even" size={s} /> },
      { label: 'center', node: (s: number) => <NinePointGlyph id="center" size={s} /> },
      { label: '16-9', node: (s: number) => <AspectRatioGlyph id="16-9" size={s} /> },
      { label: 'grid', node: (s: number) => <DisplayModeGlyph id="grid" size={s} /> },
      { label: 'hidden', node: (s: number) => <VisibilityGlyph id="hidden" size={s} /> },
      { label: 'gap', node: (s: number) => <GapAxisGlyph id="both" size={s} /> },
    ] as const

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, color: 'var(--ink)' }}>
        {(
          [
            ['sm', INSPECT_GLYPH_SIZE.sm],
            ['md', INSPECT_GLYPH_SIZE.md],
            ['lg', INSPECT_GLYPH_SIZE.lg],
            ['xl', INSPECT_GLYPH_SIZE.xl],
          ] as const
        ).map(([token, size]) => (
          <SizeRow key={token} title={`INSPECT_GLYPH_SIZE.${token}`} size={size}>
            {samples.map((sample) => (
              <Tile key={sample.label} label={sample.label} minWidth={size + 24}>
                {sample.node(size)}
              </Tile>
            ))}
          </SizeRow>
        ))}
      </div>
    )
  },
}

/** Full catalog at xl — primary Storybook review surface. */
export const Large: Story = {
  name: 'Large (48px catalog)',
  render: () => {
    const s = INSPECT_GLYPH_SIZE.xl
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, color: 'var(--ink)' }}>
        <SizeRow title="Size / fit / grid" size={s}>
          {(['hug', 'fill', 'fixed'] as const).map((id) => (
            <Tile key={id} label={id} minWidth={72}>
              <SizeModeGlyph id={id} axis="width" size={s} />
            </Tile>
          ))}
          {(['cover', 'contain', 'fill'] as const).map((id) => (
            <Tile key={`fit-${id}`} label={id} minWidth={72}>
              <MediaFitGlyph id={id} size={s} />
            </Tile>
          ))}
          <Tile label="cols-3" minWidth={72}>
            <GridColumnGlyph id="cols-3" size={s} />
          </Tile>
          <Tile label="span-2" minWidth={72}>
            <GridSpanGlyph id="span-2" axis="col" size={s} />
          </Tile>
        </SizeRow>
        <SizeRow title="Distribute / park / flow" size={s}>
          <Tile label="packed" minWidth={72}>
            <DistributeGlyph id="packed" size={s} />
          </Tile>
          <Tile label="even" minWidth={72}>
            <DistributeGlyph id="even" size={s} />
          </Tile>
          {(['start', 'center', 'stretch'] as const).map((id) => (
            <Tile key={id} label={id} minWidth={72}>
              <CellParkGlyph id={id} axis="h" size={s} />
            </Tile>
          ))}
          <Tile label="row" minWidth={72}>
            <FlowDirectionGlyph id="row" size={s} />
          </Tile>
          <Tile label="wrap" minWidth={72}>
            <WrapGlyph id="wrap" size={s} />
          </Tile>
          <Tile label="dense" minWidth={72}>
            <AutoFlowGlyph id="dense" size={s} />
          </Tile>
        </SizeRow>
        <SizeRow title="Chrome / clip" size={s}>
          {(['relative', 'absolute', 'sticky'] as const).map((id) => (
            <Tile key={id} label={id} minWidth={72}>
              <PositionGlyph id={id} size={s} />
            </Tile>
          ))}
          {(['hidden', 'scroll'] as const).map((id) => (
            <Tile key={`o-${id}`} label={id} minWidth={72}>
              <OverflowGlyph id={id} size={s} />
            </Tile>
          ))}
          {(['solid', 'dashed', 'dotted'] as const).map((id) => (
            <Tile key={`b-${id}`} label={id} minWidth={72}>
              <BorderStyleGlyph id={id} size={s} />
            </Tile>
          ))}
          <Tile label="bg top" minWidth={72}>
            <BgPositionGlyph id="top" size={s} />
          </Tile>
          <Tile label="trapezoid" minWidth={72}>
            <ClipPresetGlyph id="trapezoid" size={s} />
          </Tile>
        </SizeRow>
        <SizeRow title="Self / nine-point / text / aspect / gap" size={s}>
          {(['auto', 'stretch'] as const).map((id) => (
            <Tile key={id} label={id} minWidth={72}>
              <SelfParkGlyph id={id} axis="v" size={s} />
            </Tile>
          ))}
          {(['top-left', 'center', 'bottom-right'] as const).map((id) => (
            <Tile key={id} label={id} minWidth={72}>
              <NinePointGlyph id={id} size={s} />
            </Tile>
          ))}
          {(['start', 'justify'] as const).map((id) => (
            <Tile key={`ta-${id}`} label={id} minWidth={72}>
              <TextAlignGlyph id={id} size={s} />
            </Tile>
          ))}
          {(['free', '1-1', '16-9', '9-16'] as const).map((id) => (
            <Tile key={id} label={id} minWidth={72}>
              <AspectRatioGlyph id={id} size={s} />
            </Tile>
          ))}
          {(['both', 'row', 'column'] as const).map((id) => (
            <Tile key={`g-${id}`} label={id} minWidth={72}>
              <GapAxisGlyph id={id} size={s} />
            </Tile>
          ))}
        </SizeRow>
        <SizeRow title="Display" size={s}>
          {(
            [
              'block',
              'inline-block',
              'flex',
              'grid',
              'table',
              'list-item',
              'contents',
              'none',
            ] as const
          ).map((id) => (
            <Tile key={id} label={id} minWidth={72}>
              <DisplayModeGlyph id={id} size={s} />
            </Tile>
          ))}
        </SizeRow>
        <SizeRow title="Catalog reserve" size={s}>
          {(['visible', 'hidden', 'collapse'] as const).map((id) => (
            <Tile key={id} label={id} minWidth={72}>
              <VisibilityGlyph id={id} size={s} />
            </Tile>
          ))}
          {(['content-box', 'border-box'] as const).map((id) => (
            <Tile key={id} label={id} minWidth={72}>
              <BoxSizingGlyph id={id} size={s} />
            </Tile>
          ))}
          {(['none', 'left', 'right'] as const).map((id) => (
            <Tile key={`f-${id}`} label={`float ${id}`} minWidth={72}>
              <FloatGlyph id={id} size={s} />
            </Tile>
          ))}
          {(['horizontal', 'vertical'] as const).map((id) => (
            <Tile key={`w-${id}`} label={id} minWidth={72}>
              <WritingModeGlyph id={id} size={s} />
            </Tile>
          ))}
          {(['normal', 'nowrap', 'pre'] as const).map((id) => (
            <Tile key={id} label={id} minWidth={72}>
              <WhiteSpaceGlyph id={id} size={s} />
            </Tile>
          ))}
          {(['margin', 'padding', 'both'] as const).map((id) => (
            <Tile key={`mp-${id}`} label={id} minWidth={72}>
              <MarginPaddingGlyph id={id} size={s} />
            </Tile>
          ))}
          {(['front', 'forward', 'back'] as const).map((id) => (
            <Tile key={`z-${id}`} label={id} minWidth={72}>
              <StackOrderGlyph id={id} size={s} />
            </Tile>
          ))}
        </SizeRow>
      </div>
    )
  },
}

/** Same catalog at lg (32px) — segmented-control / chip scale. */
export const LargeMd: Story = {
  name: 'Large (32px catalog)',
  render: () => {
    const s = INSPECT_GLYPH_SIZE.lg
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, color: 'var(--ink)' }}>
        <Tile label="fill" minWidth={64}>
          <SizeModeGlyph id="fill" size={s} />
        </Tile>
        <Tile label="cover" minWidth={64}>
          <MediaFitGlyph id="cover" size={s} />
        </Tile>
        <Tile label="cols-3" minWidth={64}>
          <GridColumnGlyph id="cols-3" size={s} />
        </Tile>
        <Tile label="even" minWidth={64}>
          <DistributeGlyph id="even" size={s} />
        </Tile>
        <Tile label="center" minWidth={64}>
          <NinePointGlyph id="center" size={s} />
        </Tile>
        <Tile label="16-9" minWidth={64}>
          <AspectRatioGlyph id="16-9" size={s} />
        </Tile>
        <Tile label="grid" minWidth={64}>
          <DisplayModeGlyph id="grid" size={s} />
        </Tile>
        <Tile label="sticky" minWidth={64}>
          <PositionGlyph id="sticky" size={s} />
        </Tile>
        <Tile label="hidden" minWidth={64}>
          <VisibilityGlyph id="hidden" size={s} />
        </Tile>
        <Tile label="border-box" minWidth={64}>
          <BoxSizingGlyph id="border-box" size={s} />
        </Tile>
        <Tile label="gap both" minWidth={64}>
          <GapAxisGlyph id="both" size={s} />
        </Tile>
        <Tile label="float left" minWidth={64}>
          <FloatGlyph id="left" size={s} />
        </Tile>
      </div>
    )
  },
}
