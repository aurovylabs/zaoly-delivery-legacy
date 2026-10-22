import type { Meta, StoryObj } from '@storybook/react-vite'
import { Svg } from './Svg'
import { SITE_SVG_MARKS, SITE_SVG_DEFAULT_MARK_ID } from '../svg-marks'

const defaultMark = SITE_SVG_MARKS.find((m) => m.id === SITE_SVG_DEFAULT_MARK_ID)!

const meta = {
  title: 'Site/Svg',
  component: Svg,
  tags: ['site-kit'],
  args: {
    markup: defaultMark.markup,
    alt: defaultMark.alt,
    style: { width: 48, color: '#141414' },
  },
} satisfies Meta<typeof Svg>

export default meta

export const Default: StoryObj<typeof meta> = {}

export const Recolor: StoryObj<typeof meta> = {
  args: {
    style: { color: '#00ca55', width: 64 },
    alt: 'Brand mark',
  },
}

export const Seal: StoryObj<typeof meta> = {
  args: {
    markup: SITE_SVG_MARKS.find((m) => m.id === 'seal')!.markup,
    alt: 'Seal',
  },
}

export const Check: StoryObj<typeof meta> = {
  args: {
    markup: SITE_SVG_MARKS.find((m) => m.id === 'check')!.markup,
    alt: 'Check',
  },
}

export const Arrow: StoryObj<typeof meta> = {
  args: {
    markup: SITE_SVG_MARKS.find((m) => m.id === 'arrow')!.markup,
    alt: 'Arrow',
  },
}

export const Star: StoryObj<typeof meta> = {
  args: {
    markup: SITE_SVG_MARKS.find((m) => m.id === 'star')!.markup,
    alt: 'Star',
  },
}

export const Plus: StoryObj<typeof meta> = {
  args: {
    markup: SITE_SVG_MARKS.find((m) => m.id === 'plus')!.markup,
    alt: 'Plus',
  },
}

export const Diamond: StoryObj<typeof meta> = {
  args: {
    markup: SITE_SVG_MARKS.find((m) => m.id === 'diamond')!.markup,
    alt: 'Diamond',
  },
}

/** Gallery of all curated kit marks (Phase 2). */
export const MarksGallery: StoryObj<typeof meta> = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
      {SITE_SVG_MARKS.map((mark) => (
        <div key={mark.id} style={{ textAlign: 'center', width: 72 }}>
          <Svg markup={mark.markup} alt={mark.alt} style={{ width: 48, color: '#141414' }} />
          <div style={{ fontSize: 12, marginTop: 8 }}>{mark.label}</div>
        </div>
      ))}
    </div>
  ),
}
