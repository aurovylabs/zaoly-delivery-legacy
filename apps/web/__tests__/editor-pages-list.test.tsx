import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { EditorPagesList } from '../components/editor-pages-list'

const labels = {
  ariaLabel: 'Pages',
  addPage: 'Add page',
  rename: 'Rename',
  duplicate: 'Duplicate',
  delete: 'Delete',
  renamePrompt: 'Page name',
  moreActions: 'Page actions',
  setAsCover: 'Set as cover',
  coverBadge: 'Cover',
}

const pages = [
  { id: 'page-home', name: 'Home', root: { id: 'root-home', type: 'SiteStack' } },
  { id: 'page-pdp', name: 'PDP', root: { id: 'root-pdp', type: 'SiteStack' } },
]

describe('EditorPagesList page actions', () => {
  it('exposes a visible overflow menu for rename and delete', () => {
    const onRename = vi.fn()
    const onDelete = vi.fn()
    render(
      <EditorPagesList
        pages={pages}
        activePageId="page-home"
        onSelect={vi.fn()}
        onAdd={vi.fn()}
        onRename={onRename}
        onDuplicate={vi.fn()}
        onDelete={onDelete}
        labels={labels}
      />,
    )

    fireEvent.click(screen.getByTestId('editor-page-more-page-pdp'))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Rename' }))
    const input = screen.getByTestId('editor-page-rename-page-pdp')
    fireEvent.change(input, { target: { value: 'Product' } })
    fireEvent.blur(input)
    expect(onRename).toHaveBeenCalledWith('page-pdp', 'Product')

    fireEvent.click(screen.getByTestId('editor-page-more-page-pdp'))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }))
    expect(onDelete).toHaveBeenCalledWith('page-pdp')
  })

  it('disables delete when only one page remains', () => {
    render(
      <EditorPagesList
        pages={[pages[0]!]}
        activePageId="page-home"
        onSelect={vi.fn()}
        onAdd={vi.fn()}
        onRename={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        labels={labels}
      />,
    )
    fireEvent.click(screen.getByTestId('editor-page-more-page-home'))
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeDisabled()
  })

  it('sets cover from overflow menu and shows cover badge', () => {
    const onSetCover = vi.fn()
    render(
      <EditorPagesList
        pages={pages}
        activePageId="page-home"
        coverPageId="page-pdp"
        onSelect={vi.fn()}
        onAdd={vi.fn()}
        onRename={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        onSetCover={onSetCover}
        labels={labels}
      />,
    )
    expect(screen.getByTestId('editor-page-cover-page-pdp')).toHaveTextContent('Cover')
    fireEvent.click(screen.getByTestId('editor-page-more-page-home'))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Set as cover' }))
    expect(onSetCover).toHaveBeenCalledWith('page-home')
  })

  it('exposes Save page as Pattern when Collection is bound', () => {
    const onSaveAsPattern = vi.fn()
    render(
      <EditorPagesList
        pages={pages}
        activePageId="page-home"
        onSelect={vi.fn()}
        onAdd={vi.fn()}
        onRename={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        onSaveAsPattern={onSaveAsPattern}
        patternActionsEnabled
        labels={{
          ...labels,
          saveAsPattern: 'Save page as Pattern',
        }}
      />,
    )
    fireEvent.click(screen.getByTestId('editor-page-more-page-home'))
    fireEvent.click(screen.getByTestId('editor-page-save-as-pattern'))
    expect(onSaveAsPattern).toHaveBeenCalledWith('page-home')
  })
})
