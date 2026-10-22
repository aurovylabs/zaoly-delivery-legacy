import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { MarkerCanvas, type MarkerCanvasRect } from './MarkerCanvas'

const sampleMarkers: MarkerCanvasRect[] = [
  { id: 'color', x: 0.08, y: 0.55, w: 0.22, h: 0.22, tone: 'fail', label: 'Primary blue' },
  { id: 'type', x: 0.08, y: 0.28, w: 0.4, h: 0.08, tone: 'warn', label: 'Display type' },
  { id: 'logo', x: 0.55, y: 0.12, w: 0.3, h: 0.12, tone: 'pass', label: 'Logo clearspace', selected: true },
]

const meta = {
  title: 'Organisms/MarkerCanvas',
  component: MarkerCanvas,
  args: {
    markers: sampleMarkers,
    'aria-label': 'Measured evidence preview',
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Normalized marker overlay on a media frame — Brandion Findings / Detection Lab evidence pattern without PDF domain logic.',
      },
    },
  },
} satisfies Meta<typeof MarkerCanvas>

export default meta
type Story = StoryObj<typeof meta>

export const MediaSlot: Story = {
  args: {
    media: (
      <div
        style={{
          width: '100%',
          height: '100%',
          background:
            'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
          display: 'grid',
          placeItems: 'center',
          color: '#64748b',
          fontFamily: 'var(--font-display, system-ui)',
        }}
      >
        CD kit placeholder
      </div>
    ),
  },
}

export const SelectedFail: Story = {
  args: {
    media: (
      <div style={{ width: '100%', height: '100%', background: '#fff' }} />
    ),
    markers: sampleMarkers.map((m) => ({
      ...m,
      selected: m.id === 'color',
    })),
  },
}

export const Interactive: Story = {
  render: function InteractiveStory() {
    const [selected, setSelected] = useState('logo')
    return (
      <MarkerCanvas
        aria-label="Interactive markers"
        media={<div style={{ width: '100%', height: '100%', background: '#fff' }} />}
        markers={sampleMarkers.map((m) => ({ ...m, selected: m.id === selected }))}
        onMarkerActivate={setSelected}
      />
    )
  },
}

export const Empty: Story = {
  args: {
    markers: [],
    empty: <p>No evidence page loaded</p>,
  },
}

export const HiddenMarkers: Story = {
  args: {
    media: <div style={{ width: '100%', height: '100%', background: '#eef2ff' }} />,
    showMarkers: false,
  },
}
