import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { AppProviders } from '../components/app-providers'
import { EditorCommentsPanel } from '../components/editor-comments-panel'

describe('EditorCommentsPanel (P82b)', () => {
  it('lists comments, adds, and resolves for a selected node', () => {
    const onAdd = vi.fn()
    const onSetResolved = vi.fn()
    const onClose = vi.fn()
    render(
      <AppProviders>
        <EditorCommentsPanel
          open
          onClose={onClose}
          selectedNodeId="n1"
          selectedNodeLabel="Title"
          comments={[
            {
              id: 'c1',
              nodeId: 'n1',
              body: 'Check kerning',
              author: 'designer',
              createdAt: '2026-08-14T10:00:00.000Z',
              resolved: false,
            },
          ]}
          onAdd={onAdd}
          onSetResolved={onSetResolved}
        />
      </AppProviders>,
    )
    expect(screen.getByTestId('editor-comments-panel')).toBeInTheDocument()
    expect(screen.getByText('Check kerning')).toBeInTheDocument()
    fireEvent.change(screen.getByTestId('editor-comments-draft'), {
      target: { value: 'Also folio' },
    })
    fireEvent.click(screen.getByTestId('editor-comments-add'))
    expect(onAdd).toHaveBeenCalledWith('Also folio')
    fireEvent.click(screen.getByTestId('editor-comment-resolve-c1'))
    expect(onSetResolved).toHaveBeenCalledWith('c1', true)
    fireEvent.click(screen.getByTestId('editor-comments-close'))
    expect(onClose).toHaveBeenCalled()
  })

  it('hides when closed', () => {
    render(
      <AppProviders>
        <EditorCommentsPanel
          open={false}
          onClose={() => undefined}
          selectedNodeId={null}
          selectedNodeLabel={null}
          comments={[]}
          onAdd={() => undefined}
          onSetResolved={() => undefined}
        />
      </AppProviders>,
    )
    expect(screen.queryByTestId('editor-comments-panel')).toBeNull()
  })
})
