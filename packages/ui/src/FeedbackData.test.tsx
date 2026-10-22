import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  Avatar,
  Button,
  DataTable,
  ToastProvider,
  useToast,
} from './index'

describe('Feedback / data primitives (Wave E)', () => {
  it('Avatar shows initials from name', () => {
    render(<Avatar name="Ada Lovelace" />)
    expect(screen.getByRole('img', { name: 'Ada Lovelace' }).textContent).toMatch(/AL/)
  })

  it('Avatar renders image with alt', () => {
    render(
      <Avatar
        name="MSQ"
        alt="Logo"
        src={`data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg"/>')}`}
      />,
    )
    expect(screen.getByRole('img', { name: 'Logo' })).toBeTruthy()
  })

  it('Toast push announces polite and assertive regions', () => {
    function Probe() {
      const { push } = useToast()
      return (
        <>
          <Button onClick={() => push({ message: 'Saved', tone: 'ok' })}>ok</Button>
          <Button onClick={() => push({ message: 'Boom', tone: 'error' })}>err</Button>
        </>
      )
    }
    render(
      <ToastProvider>
        <Probe />
      </ToastProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'ok' }))
    expect(screen.getByRole('status').textContent).toMatch(/Saved/)
    fireEvent.click(screen.getByRole('button', { name: 'err' }))
    expect(screen.getByRole('alert').textContent).toMatch(/Boom/)
  })

  it('DataTable sorts by column', () => {
    type Row = { id: string; name: string; score: number }
    const rows: Row[] = [
      { id: '1', name: 'Beta', score: 2 },
      { id: '2', name: 'Alpha', score: 9 },
    ]
    render(
      <DataTable
        getRowId={(r) => r.id}
        rows={rows}
        columns={[
          {
            id: 'name',
            header: 'Name',
            sortValue: (r) => r.name,
            cell: (r) => r.name,
          },
          {
            id: 'score',
            header: 'Score',
            sortValue: (r) => r.score,
            cell: (r) => String(r.score),
          },
        ]}
      />,
    )
    const table = screen.getByRole('table')
    fireEvent.click(screen.getByRole('button', { name: /Name/i }))
    const bodyRows = within(table).getAllByRole('row').slice(1)
    expect(bodyRows[0]?.textContent).toMatch(/Alpha/)
    expect(bodyRows[1]?.textContent).toMatch(/Beta/)
  })

  it('DataTable empty state', () => {
    render(
      <DataTable
        getRowId={(r: { id: string }) => r.id}
        rows={[]}
        columns={[{ id: 'a', header: 'A', cell: () => null }]}
      />,
    )
    expect(screen.getByText(/No rows/i)).toBeTruthy()
  })
})
