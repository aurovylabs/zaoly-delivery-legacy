import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconJourneys, IconOverview, IconPersonas, IconProjects, IconResearch } from './icons'
import { NavRail } from './NavRail'

const meta = {
  title: 'Organisms/NavRail',
  component: NavRail,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof NavRail>

export default meta
type Story = StoryObj<typeof meta>

const items = [
  { id: 'overview', label: 'Overview', href: '#overview', icon: <IconOverview />, active: true },
  { id: 'personas', label: 'Personas', href: '#personas', icon: <IconPersonas /> },
  { id: 'research', label: 'Research', href: '#research', icon: <IconResearch /> },
  { id: 'journeys', label: 'Journeys', href: '#journeys', icon: <IconJourneys /> },
  { id: 'projects', label: 'Projects', href: '#projects', icon: <IconProjects /> },
]

export const Default: Story = {
  render: () => (
    <div style={{ minHeight: '24rem', position: 'relative' }}>
      <NavRail
        dockable={false}
        logo={<span>AU</span>}
        logoLabel="Home"
        items={items}
        footerItems={[{ id: 'settings', label: 'Settings', href: '#settings' }]}
      />
    </div>
  ),
}

export const HorizontalTop: Story = {
  render: () => (
    <div style={{ minHeight: '8rem', position: 'relative' }}>
      <NavRail
        dockable={false}
        defaultDockEdge="top"
        logo={<span>PX</span>}
        items={items.slice(0, 4)}
      />
    </div>
  ),
}

export const HorizontalBottom: Story = {
  render: () => (
    <div style={{ minHeight: '12rem', position: 'relative' }}>
      <NavRail
        dockable={false}
        defaultDockEdge="bottom"
        logo={<span>PX</span>}
        items={items}
        footerItems={[{ id: 'settings', label: 'Settings', href: '#settings' }]}
      />
    </div>
  ),
}
