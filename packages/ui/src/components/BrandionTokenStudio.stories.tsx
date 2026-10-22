import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { AddTile } from './AddTile'
import { Button } from './Button'
import { Dialog } from './Dialog'
import { EntityCard } from './EntityCard'
import { Field } from './Field'
import { FormSection } from './FormSection'
import { Input } from './Input'
import { Select } from './Select'
import { SwatchStrip } from './SwatchStrip'

/**
 * Composition-only Storybook surface: Brandion Design Token Studio chrome
 * without Brandion contracts / TokenTypedFields.
 */
function TokenStudioComposition() {
  const [open, setOpen] = useState(true)
  return (
    <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '52rem' }}>
      <header style={{ display: 'grid', gap: '0.5rem' }}>
        <h2 style={{ margin: 0, fontWeight: 300, letterSpacing: '-0.03em' }}>Color</h2>
        <SwatchStrip
          swatches={['#0B3D2E', '#C4A35A', '#F4F0E6', '#1A1A1A']}
          label="Chapter teaser"
        />
      </header>

      <div className="ds-token-studio-grid">
        <EntityCard
          meta="Color"
          title="color.brand.primary"
          headActions={
            <button type="button" className="ds-entity-card__icon-btn" aria-label="Edit">
              ✎
            </button>
          }
          footer={
            <Button size="sm" variant="subtle">
              Approve
            </Button>
          }
        >
          <div className="ds-entity-card__swatch" style={{ background: '#0B3D2E' }} />
          <p className="ds-entity-card__value">#0B3D2E</p>
        </EntityCard>

        <EntityCard meta="Color" title="color.brand.accent">
          <div className="ds-entity-card__swatch" style={{ background: '#C4A35A' }} />
          <p className="ds-entity-card__value">#C4A35A</p>
        </EntityCard>

        <AddTile label="Add" onClick={() => setOpen(true)} />
      </div>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Add token"
        className="ds-token-editor-dialog"
        actions={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Save</Button>
          </>
        }
      >
        <div className="ds-token-editor-stack">
          <FormSection title="Identity" columns={2}>
            <Field label="Path">
              <Input defaultValue="color.brand.new" />
            </Field>
            <Field label="Type">
              <Select defaultValue="color">
                <option value="color">Color</option>
                <option value="typography">Typography</option>
                <option value="spacing">Spacing</option>
              </Select>
            </Field>
          </FormSection>
          <FormSection title="Value">
            <Field label="Hex" hint="Stub field — typed editors stay in Brandion">
              <Input defaultValue="#336655" />
            </Field>
          </FormSection>
          <FormSection title="Lab / advanced" tone="advanced">
            <Field label="Raw">
              <Input defaultValue='{"$type":"color","$value":"#336655"}' />
            </Field>
          </FormSection>
        </div>
      </Dialog>
    </div>
  )
}

const meta = {
  title: 'Templates/BrandionTokenStudio',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Composition of Dialog · FormSection · EntityCard · AddTile · SwatchStrip mirroring Brandion Design Token Studio chrome. Typed token fields remain app-local.',
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const BoardAndDialog: Story = {
  name: 'Board + Add dialog',
  render: () => <TokenStudioComposition />,
}
