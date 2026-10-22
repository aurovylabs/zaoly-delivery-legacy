import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'
import { EventFooter } from './EventFooter'

const meta = {
  title: 'Molecules/EventFooter',
  component: EventFooter,
} satisfies Meta<typeof EventFooter>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    summary: 'Inspection finished.',
    children: <p className="ds-event-footer-meta">Friction 4/10 · Persona fit 7/10</p>,
    actions: (
      <>
        <a href="#rec">Open recording</a>
        <Button type="button" size="sm" variant="ghost">
          Convert
        </Button>
      </>
    ),
  },
}

export const SummaryOnly: Story = {
  args: {
    summary: 'Tool completed.',
  },
}
