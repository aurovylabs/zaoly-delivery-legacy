import type { Meta, StoryObj } from '@storybook/react-vite'
import { narrowViewportGlobals } from '../storybook/viewports'
import { RankedList, RankedRow } from './RankedList'
import { Text } from './Text'

const meta = {
  title: 'Organisms/RankedList',
  component: RankedList,
} satisfies Meta<typeof RankedList>

export default meta
type Story = StoryObj<typeof meta>

const rows = [
  { label: 'MARKET', value: 20, secondary: '50%', barPct: 100 },
  { label: 'TECHNOLOGY', value: 10, secondary: '25%', barPct: 50 },
  { label: 'REGULATORY', value: 6, secondary: '15%', barPct: 30 },
  { label: 'POLITICS', value: 4, secondary: '10%', barPct: 20 },
]

export const Default: Story = {
  args: {
    hint: (
      <Text role="hint" className="category-rank-hint">
        n=40 · click row → Signals
      </Text>
    ),
    children: rows.map((row, i) => (
      <RankedRow
        key={row.label}
        index={i + 1}
        label={row.label}
        value={row.value}
        secondary={row.secondary}
        barPct={row.barPct}
        onActivate={() => undefined}
      />
    )),
  },
}

export const Narrow: Story = {
  ...Default,
  globals: narrowViewportGlobals,
}

export const StaticNoBars: Story = {
  args: {
    children: (
      <>
        <RankedRow index={1} label="Alpha" value={0.92} />
        <RankedRow index={2} label="Beta" value={0.81} />
        <RankedRow index={12} label="Gamma" value={0.44} />
      </>
    ),
  },
}
