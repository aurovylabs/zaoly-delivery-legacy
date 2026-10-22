import type { Meta, StoryObj } from '@storybook/react-vite'
import { Table, TableCell, TableRow } from './Table'
import { Text } from './Text'

const meta = {
  title: 'Site/Table',
  component: Table,
  tags: ['site-kit'],
} satisfies Meta<typeof Table>

export default meta

export const Default: StoryObj<typeof meta> = {
  render: (args) => (
    <Table {...args}>
      <thead>
        <TableRow header>
          <TableCell header>
            <Text role="label">Plan</Text>
          </TableCell>
          <TableCell header>
            <Text role="label">Price</Text>
          </TableCell>
          <TableCell header>
            <Text role="label">Seats</Text>
          </TableCell>
        </TableRow>
      </thead>
      <tbody>
        <TableRow>
          <TableCell>
            <Text>Starter</Text>
          </TableCell>
          <TableCell>
            <Text>$29</Text>
          </TableCell>
          <TableCell>
            <Text>5</Text>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <Text>Growth</Text>
          </TableCell>
          <TableCell>
            <Text>$79</Text>
          </TableCell>
          <TableCell>
            <Text>25</Text>
          </TableCell>
        </TableRow>
      </tbody>
    </Table>
  ),
  args: {
    density: 'default',
    borders: 'row',
    striped: false,
    caption: 'Pricing',
  },
}

export const StripedCompact: StoryObj<typeof meta> = {
  ...Default,
  args: {
    density: 'compact',
    borders: 'all',
    striped: true,
    caption: 'Compact striped',
  },
}
