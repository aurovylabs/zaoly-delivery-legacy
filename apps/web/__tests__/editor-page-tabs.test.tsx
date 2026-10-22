import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { EditorPageTabs } from '../components/editor-page-tabs'

const labels = {
  ariaLabel: 'Pages',
  addPage: 'Add page',
  rename: 'Rename',
  duplicate: 'Duplicate',
  delete: 'Delete',
  renamePrompt: 'Page name',
  moreActions: 'Page actions',
}

describe('EditorPageTabs (P80 wave 3)', () => {
  it('renders tabs and switches via onSelect', () => {
    const onSelect = vi.fn()
    render(
      <EditorPageTabs
        pages={[
          { id: 'page-home', name: 'Home', root: { id: 'root-home', type: 'SiteStack' } },
          { id: 'page-contact', name: 'Contact', root: { id: 'root-contact', type: 'SiteStack' } },
        ]}
        activePageId="page-home"
        onSelect={onSelect}
        onAdd={vi.fn()}
        onRename={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        labels={labels}
      />,
    )
    expect(screen.getByTestId('editor-page-tabs')).toBeInTheDocument()
    expect(screen.getByTestId('editor-page-tab-page-home')).toHaveAttribute('aria-selected', 'true')
    fireEvent.click(screen.getByTestId('editor-page-tab-page-contact'))
    expect(onSelect).toHaveBeenCalledWith('page-contact')
  })

  it('calls onAdd from the plus control', () => {
    const onAdd = vi.fn()
    render(
      <EditorPageTabs
        pages={[{ id: 'page-home', name: 'Home', root: { id: 'root-home', type: 'SiteStack' } }]}
        activePageId="page-home"
        onSelect={vi.fn()}
        onAdd={onAdd}
        onRename={vi.fn()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        labels={labels}
      />,
    )
    fireEvent.click(screen.getByTestId('editor-page-add'))
    expect(onAdd).toHaveBeenCalled()
  })
})
