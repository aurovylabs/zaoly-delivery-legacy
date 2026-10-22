import type { Meta, StoryObj } from '@storybook/react-vite'
import { InspectDock } from './InspectDock'
import { EventFooter } from './EventFooter'

const meta = {
  title: 'Molecules/InspectDock',
  component: InspectDock,
} satisfies Meta<typeof InspectDock>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    'aria-label': 'UX journey inspect',
    children: (
      <>
        <p style={{ margin: 0, color: 'var(--muted)' }}>Step strip / live frame slot</p>
        <EventFooter summary="Inspection finished." actions={<a href="#rec">Open recording</a>} />
      </>
    ),
  },
}
