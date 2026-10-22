import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Table, TableCell, TableRow } from './Table'
import { Text } from './Text'

describe('Site Kit Table', () => {
  it('renders semantic table with caption, header cells, and body cells', () => {
    render(
      <Table caption="Specs" density="compact" borders="all" striped>
        <thead>
          <TableRow header>
            <TableCell header>
              <Text>Feature</Text>
            </TableCell>
          </TableRow>
        </thead>
        <tbody>
          <TableRow>
            <TableCell align="center">
              <Text>Value</Text>
            </TableCell>
          </TableRow>
        </tbody>
      </Table>,
    )
    const table = screen.getByRole('table')
    expect(table.className).toContain('site-table')
    expect(table.className).toContain('site-table--compact')
    expect(table.className).toContain('site-table--borders-all')
    expect(table.className).toContain('site-table--striped')
    expect(screen.getByText('Specs').tagName).toBe('CAPTION')
    expect(screen.getByRole('columnheader').textContent).toBe('Feature')
    expect(screen.getByRole('cell').textContent).toBe('Value')
  })

  it('wraps loose TableRow children in thead/tbody (CompositionPreview / library atom)', () => {
    const { container } = render(
      <Table caption="Loose">
        <TableRow header>
          <TableCell header>
            <Text>Col</Text>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <Text>Val</Text>
          </TableCell>
        </TableRow>
      </Table>,
    )
    const table = container.querySelector('table')
    expect(table?.querySelector(':scope > tr')).toBeNull()
    expect(table?.querySelector('thead tr.site-table-row--header')).toBeTruthy()
    expect(table?.querySelector('tbody tr:not(.site-table-row--header)')).toBeTruthy()
    expect(screen.getByText('Col').closest('th')).toBeTruthy()
    expect(screen.getByText('Val').closest('td')).toBeTruthy()
  })
})


