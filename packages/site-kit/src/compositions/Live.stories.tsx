import type { Meta, StoryObj } from '@storybook/react-vite'

/**
 * Always-on story for Coolify static Storybook.
 * Pattern Live requires Collection view token (SK-S3) — open from CREATION editor.
 * Named Master variants: Controls → variantName, or Component Set axis args from CSF.
 * Polls every 4s (preview decorator) — content hot-reload without rebuild.
 * Spec: site-kit-compositions.md · kit-master-axes-export.md
 */
const meta = {
  title: 'Compositions/Live',
  tags: ['site-kit', 'composition', 'live'],
  parameters: {
    docs: {
      description: {
        component:
          'Live CREATION Patterns (Collection-gated). Open from the editor with zaolyViewToken, then set Controls → componentId (e.g. Composition~…~Hero). Optional variantName selects a flat named variant; Component Set stories expose one Select per Master axis instead.',
      },
    },
  },
  argTypes: {
    componentId: {
      control: 'text',
      description: 'Override id from CREATION (Composition~{scope}~{Name} or legacy Composition{Name})',
    },
    variantName: {
      control: 'text',
      description: 'Master named variant name (flat list; ignored when override has axes)',
    },
  },
  args: {
    componentId: '',
    variantName: '',
  },
  render: (args: { componentId?: string; variantName?: string }) => {
    if (!args.componentId?.trim()) {
      return (
        <p style={{ fontFamily: 'system-ui', color: '#555', maxWidth: 36 + 'rem' }}>
          Open this Storybook from <strong>CREATION</strong> (Collection-scoped link), then set{' '}
          <strong>componentId</strong> in Controls, or use <strong>Compositions/Catalog</strong>.
          Optional <strong>variantName</strong> (flat) or axis Selects (Component Set) pick the cell.
        </p>
      )
    }
    // Live paint comes from the preview decorator when args.componentId is set.
    return (
      <p style={{ fontFamily: 'system-ui', color: '#888' }}>
        Loading {args.componentId}
        {args.variantName?.trim() ? ` · ${args.variantName}` : ''}… (polling CREATION)
      </p>
    )
  },
} satisfies Meta<{ componentId: string; variantName: string }>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
