import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'
import { EntityCard } from './EntityCard'

const meta = {
  title: 'Molecules/EntityCard',
  component: EntityCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Catalog card shell (meta · title · toolbar · preview · footer). Brandion TokenCard chrome without token contracts.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '18rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EntityCard>

export default meta
type Story = StoryObj<typeof meta>

export const ColorPreview: Story = {
  args: {
    meta: 'Color',
    title: 'color.brand.primary',
    headActions: (
      <button type="button" className="ds-entity-card__icon-btn" aria-label="Edit">
        ✎
      </button>
    ),
    children: (
      <>
        <div className="ds-entity-card__swatch" style={{ background: '#0B3D2E' }} />
        <p className="ds-entity-card__value">#0B3D2E</p>
      </>
    ),
    footer: (
      <Button size="sm" variant="subtle">
        Approve
      </Button>
    ),
  },
}

export const TypePreview: Story = {
  args: {
    meta: 'Typography',
    title: 'font.heading',
    badge: <span style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>pending</span>,
    children: <p className="ds-entity-card__specimen">Aa Bb Cc</p>,
  },
}

export const WithActions: Story = {
  args: {
    meta: 'Spacing',
    title: 'space.md',
    toolbar: (
      <Button size="sm" variant="ghost">
        Channel
      </Button>
    ),
    headActions: (
      <>
        <button type="button" className="ds-entity-card__icon-btn" aria-label="Edit">
          ✎
        </button>
        <button type="button" className="ds-entity-card__icon-btn" aria-label="More">
          …
        </button>
      </>
    ),
    children: <p className="ds-entity-card__value">1rem</p>,
    footer: (
      <>
        <Button size="sm">Save</Button>
        <Button size="sm" variant="ghost">
          Discard
        </Button>
      </>
    ),
  },
}

export const Tall: Story = {
  args: {
    ...ColorPreview.args,
    size: 'tall',
    meta: 'Layout',
    title: 'layout.grid.magazine',
  },
}
