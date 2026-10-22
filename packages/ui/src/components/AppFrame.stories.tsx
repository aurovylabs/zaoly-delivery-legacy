import type { Meta, StoryObj } from '@storybook/react-vite'
import { AppFrame } from './AppFrame'
import { BrandCorner } from './BrandCorner'
import { IconOverview, IconPersonas, IconProjects } from './icons'
import { NavRail } from './NavRail'
import { ShellBackButton } from './ShellBackButton'
import { Text } from './Text'
import { TopStatus } from './TopStatus'

const meta = {
  title: 'Templates/AppFrame',
  component: AppFrame,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof AppFrame>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <AppFrame
      style={{ minHeight: '28rem' }}
      backCorner={<ShellBackButton label="Back" onClick={() => undefined} />}
      brandCorner={<BrandCorner label="AUDION" />}
      rail={
        <NavRail
          dockable={false}
          logo={<span>AU</span>}
          logoLabel="Home"
          items={[
            { id: 'overview', label: 'Overview', href: '#overview', icon: <IconOverview />, active: true },
            { id: 'personas', label: 'Personas', href: '#personas', icon: <IconPersonas /> },
            { id: 'projects', label: 'Projects', href: '#projects', icon: <IconProjects /> },
          ]}
        />
      }
      topbar={<TopStatus level="ok" primary="Workspace ready" secondary="3 live projects" live />}
    >
      <Text role="headline" as="h1">
        Page body
      </Text>
      <Text role="body" as="p">
        AppFrame composes atmosphere, shell cutout corners (BL/BR; TL reserved for back),
        brand corner, nav rail, optional topbar, and page content.
      </Text>
    </AppFrame>
  ),
}

export const RailRight: Story = {
  render: () => (
    <AppFrame
      style={{ minHeight: '22rem' }}
      railEdge="right"
      brandCorner={<BrandCorner label="CHECKION" />}
      rail={
        <NavRail
          dockable={false}
          defaultDockEdge="right"
          logo={<span>CH</span>}
          items={[{ id: 'overview', label: 'Overview', href: '#', icon: <IconOverview />, active: true }]}
        />
      }
    >
      <Text role="body">Rail docked on the right edge.</Text>
    </AppFrame>
  ),
}
