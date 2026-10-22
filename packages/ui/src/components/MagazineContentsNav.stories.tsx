import type { Meta, StoryObj } from '@storybook/react-vite'
import { MagazineContentsNav } from './MagazineContentsNav'

const brandionItems = [
  { id: 'tokens', index: '01', label: 'Tokens', href: '#tokens' },
  { id: 'compliance', index: '02', label: 'Compliance', href: '#compliance' },
  { id: 'evaluate', index: '03', label: 'Evaluate', href: '#evaluate' },
]

const checkionItems = [
  { id: 'overview', index: '01', label: 'Overview', href: '#overview' },
  { id: 'issues', index: '02', label: 'Issues', href: '#issues' },
  { id: 'detail', index: '03', label: 'Detail', href: '#detail' },
]

const meta = {
  title: 'Molecules/MagazineContentsNav',
  component: MagazineContentsNav,
  args: {
    items: brandionItems,
    activeId: 'tokens',
    label: 'Contents',
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Sticky magazine Contents nav (Brandion Guideline Studio / Checkion Result). Auto-compacts on scroll past sentinel.',
      },
    },
  },
} satisfies Meta<typeof MagazineContentsNav>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Compact: Story = {
  args: {
    compact: true,
    activeId: 'evaluate',
  },
}

export const WithExit: Story = {
  args: {
    exit: <a href="#hub">Analysis Hub</a>,
    activeId: 'compliance',
  },
}

export const BrandionStudio: Story = {
  name: 'Brandion · Guideline Studio',
  args: {
    items: brandionItems,
    activeId: 'evaluate',
    label: 'Contents',
    exit: <a href="#hub">Analysis Hub</a>,
    'aria-label': 'Guideline sections',
  },
}

export const CheckionResult: Story = {
  name: 'Checkion · Result sections',
  args: {
    items: checkionItems,
    activeId: 'issues',
    label: 'Contents',
    'aria-label': 'Result sections',
  },
}

export const FourColumns: Story = {
  args: {
    columns: 4,
    items: [
      ...brandionItems,
      { id: 'assets', index: '04', label: 'Assets', href: '#assets' },
    ],
    activeId: 'assets',
  },
}
