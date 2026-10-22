import { cleanup, createEvent, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  LAYERS_PANEL_DND_MIME,
  LayersPanel,
  type LayersPanelItem,
} from './LayersPanel'

afterEach(() => {
  cleanup()
})

const TREE: LayersPanelItem[] = [
  {
    id: 'root',
    label: 'Root',
    type: 'Stack',
    children: [
      { id: 'child', label: 'Child', type: 'Text' },
      {
        id: 'branch',
        label: 'Branch',
        type: 'Card',
        children: [{ id: 'leaf', label: 'Leaf', type: 'Button' }],
      },
    ],
  },
]

function dataTransferMock(initial: Record<string, string> = {}) {
  const store = { ...initial }
  return {
    setData: (type: string, value: string) => {
      store[type] = value
    },
    getData: (type: string) => store[type] ?? '',
    types: Object.keys(store),
    effectAllowed: 'all' as DataTransfer['effectAllowed'],
    dropEffect: 'none' as DataTransfer['dropEffect'],
  }
}

describe('LayersPanel', () => {
  it('renders items and selects via onSelect', () => {
    const onSelect = vi.fn()
    render(<LayersPanel items={TREE} selectedId="root" onSelect={onSelect} />)
    expect(screen.getByTestId('layers-panel')).toBeInTheDocument()
    expect(screen.getByTestId('layers-panel-item-child')).toBeInTheDocument()
    screen.getByTestId('layers-panel-item-child').click()
    expect(onSelect).toHaveBeenCalledWith('child', {
      shiftKey: false,
      metaKey: false,
      ctrlKey: false,
    })
  })

  it('calls onItemContextMenu with id on row contextmenu', () => {
    const onItemContextMenu = vi.fn()
    render(
      <LayersPanel items={TREE} selectedId="root" onItemContextMenu={onItemContextMenu} />,
    )
    fireEvent.contextMenu(screen.getByTestId('layers-panel-item-child'))
    expect(onItemContextMenu).toHaveBeenCalledTimes(1)
    expect(onItemContextMenu.mock.calls[0]?.[0]).toBe('child')
  })

  it('marks selected row with aria-current', () => {
    render(<LayersPanel items={TREE} selectedId="child" />)
    expect(screen.getByTestId('layers-panel-item-child')).toHaveAttribute('aria-current', 'true')
    expect(screen.getByTestId('layers-panel-item-root')).not.toHaveAttribute('aria-current')
  })

  it('highlights multi-selection via selectedIds', () => {
    render(
      <LayersPanel
        items={TREE}
        selectedId="branch"
        selectedIds={['child', 'branch']}
      />,
    )
    expect(screen.getByTestId('layers-panel-item-branch')).toHaveAttribute('aria-current', 'true')
    expect(screen.getByTestId('layers-panel-item-branch')).toHaveClass(
      'ds-layers-panel__btn--selected',
    )
    expect(screen.getByTestId('layers-panel-item-child')).toHaveClass(
      'ds-layers-panel__btn--selected',
    )
    expect(screen.getByTestId('layers-panel-item-child')).toHaveClass(
      'ds-layers-panel__btn--multi-selected',
    )
    expect(screen.getByTestId('layers-panel-item-child')).toHaveAttribute(
      'data-multi-selected',
      'true',
    )
    expect(screen.getByTestId('layers-panel-item-root')).not.toHaveClass(
      'ds-layers-panel__btn--selected',
    )
  })

  it('passes modifier keys to onSelect', () => {
    const onSelect = vi.fn()
    render(<LayersPanel items={TREE} selectedId="root" onSelect={onSelect} />)
    fireEvent.click(screen.getByTestId('layers-panel-item-child'), {
      shiftKey: true,
      metaKey: true,
    })
    expect(onSelect).toHaveBeenCalledWith('child', {
      shiftKey: true,
      metaKey: true,
      ctrlKey: false,
    })
  })

  it('renders an optional row icon', () => {
    render(
      <LayersPanel
        items={[{ id: 'root', label: 'Root', icon: <span data-testid="layer-icon">S</span> }]}
      />,
    )
    expect(screen.getByTestId('layer-icon')).toBeInTheDocument()
  })

  it('shows empty label when items is empty', () => {
    render(<LayersPanel items={[]} emptyLabel="No layers yet" />)
    expect(screen.getByText('No layers yet')).toBeInTheDocument()
  })

  it('collapses branch children via chevron', () => {
    render(<LayersPanel items={TREE} defaultExpanded />)
    expect(screen.getByTestId('layers-panel-item-leaf')).toBeInTheDocument()
    const branchBtn = screen.getByTestId('layers-panel-item-branch')
    const row = branchBtn.closest('.ds-layers-panel__row')
    expect(row).toBeTruthy()
    const chevron = within(row as HTMLElement).getByRole('button', { name: 'Collapse' })
    expect(chevron).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(chevron)
    expect(chevron).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByTestId('layers-panel-item-leaf')).toBeNull()
  })

  it('calls onMoveUp / onMoveDown and disables edges', () => {
    const onMoveUp = vi.fn()
    const onMoveDown = vi.fn()
    render(
      <LayersPanel
        items={TREE}
        selectedId="child"
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
      />,
    )
    // child is first sibling under root → up disabled, down enabled
    expect(screen.getByTestId('layers-panel-move-up-child')).toBeDisabled()
    const downChild = screen.getByTestId('layers-panel-move-down-child')
    expect(downChild).not.toBeDisabled()
    fireEvent.click(downChild)
    expect(onMoveDown).toHaveBeenCalledWith('child')

    // branch is last sibling under root → down disabled, up enabled
    const upBranch = screen.getByTestId('layers-panel-move-up-branch')
    expect(screen.getByTestId('layers-panel-move-down-branch')).toBeDisabled()
    expect(upBranch).not.toBeDisabled()
    fireEvent.click(upBranch)
    expect(onMoveUp).toHaveBeenCalledWith('branch')

    // sole root: both disabled
    expect(screen.getByTestId('layers-panel-move-up-root')).toBeDisabled()
    expect(screen.getByTestId('layers-panel-move-down-root')).toBeDisabled()
  })

  it('falls back to onReorder when directional props omitted', () => {
    const onReorder = vi.fn()
    render(<LayersPanel items={TREE} onReorder={onReorder} />)
    fireEvent.click(screen.getByTestId('layers-panel-move-down-child'))
    expect(onReorder).toHaveBeenCalledWith('child', 'down')
  })

  it('toggles hide / lock via callbacks and reflects item flags', () => {
    const onToggleHidden = vi.fn()
    const onToggleLocked = vi.fn()
    const items: LayersPanelItem[] = [
      {
        id: 'root',
        label: 'Root',
        children: [
          { id: 'a', label: 'A', hidden: true },
          { id: 'b', label: 'B', locked: true },
        ],
      },
    ]
    render(
      <LayersPanel
        items={items}
        onToggleHidden={onToggleHidden}
        onToggleLocked={onToggleLocked}
      />,
    )
    const hideA = screen.getByTestId('layers-panel-hide-a')
    expect(hideA).toHaveAttribute('aria-pressed', 'true')
    expect(hideA).toHaveAttribute('aria-label', 'Show layer')
    fireEvent.click(hideA)
    expect(onToggleHidden).toHaveBeenCalledWith('a')

    const lockB = screen.getByTestId('layers-panel-lock-b')
    expect(lockB).toHaveAttribute('aria-pressed', 'true')
    expect(lockB).toHaveAttribute('aria-label', 'Unlock layer')
    fireEvent.click(lockB)
    expect(onToggleLocked).toHaveBeenCalledWith('b')

    expect(screen.getByTestId('layers-panel-row-a')).toHaveClass('ds-layers-panel__row--hidden')
    expect(screen.getByTestId('layers-panel-row-b')).toHaveClass('ds-layers-panel__row--locked')
  })

  it('fires onReorderDrop for sibling drag with before/after', () => {
    const onReorderDrop = vi.fn()
    render(<LayersPanel items={TREE} onReorderDrop={onReorderDrop} />)

    const childRow = screen.getByTestId('layers-panel-row-child')
    expect(childRow).toHaveAttribute('draggable', 'true')

    const dtStart = dataTransferMock()
    fireEvent.dragStart(childRow, { dataTransfer: dtStart })
    expect(dtStart.getData(LAYERS_PANEL_DND_MIME)).toBe('child')

    const fireDropAt = (clientY: number) => {
      const branchRow = screen.getByTestId('layers-panel-row-branch')
      const dt = dataTransferMock({
        [LAYERS_PANEL_DND_MIME]: 'child',
        'text/plain': 'child',
      })
      Object.defineProperty(branchRow, 'getBoundingClientRect', {
        configurable: true,
        value: () => ({
          top: 100,
          height: 40,
          bottom: 140,
          left: 0,
          right: 100,
          width: 100,
          x: 0,
          y: 100,
          toJSON: () => ({}),
        }),
      })
      const over = createEvent.dragOver(branchRow)
      Object.defineProperty(over, 'clientY', { get: () => clientY })
      Object.defineProperty(over, 'dataTransfer', { get: () => dt })
      fireEvent(branchRow, over)

      const rowAfterOver = screen.getByTestId('layers-panel-row-branch')
      const drop = createEvent.drop(rowAfterOver)
      Object.defineProperty(drop, 'clientY', { get: () => clientY })
      Object.defineProperty(drop, 'dataTransfer', { get: () => dt })
      fireEvent(rowAfterOver, drop)
    }

    fireDropAt(110)
    expect(onReorderDrop).toHaveBeenCalledWith('child', 'branch', 'before')

    onReorderDrop.mockClear()
    fireDropAt(130)
    expect(onReorderDrop).toHaveBeenCalledWith('child', 'branch', 'after')
  })

  it('fires onReorderDrop for nest-into and cross-parent drops', () => {
    const onReorderDrop = vi.fn()
    const items: LayersPanelItem[] = [
      {
        id: 'root',
        label: 'Root',
        acceptsChildren: true,
        children: [
          { id: 'a', label: 'A' },
          {
            id: 'b',
            label: 'B',
            acceptsChildren: true,
            children: [{ id: 'c', label: 'C' }],
          },
        ],
      },
    ]
    render(<LayersPanel items={items} onReorderDrop={onReorderDrop} />)

    const branchRow = screen.getByTestId('layers-panel-row-b')
    Object.defineProperty(branchRow, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        top: 100,
        height: 60,
        bottom: 160,
        left: 0,
        right: 100,
        width: 100,
        x: 0,
        y: 100,
        toJSON: () => ({}),
      }),
    })

    const fireAt = (draggedId: string, clientY: number) => {
      const dt = dataTransferMock({
        [LAYERS_PANEL_DND_MIME]: draggedId,
        'text/plain': draggedId,
      })
      const row = screen.getByTestId('layers-panel-row-b')
      const over = createEvent.dragOver(row)
      Object.defineProperty(over, 'clientY', { get: () => clientY })
      Object.defineProperty(over, 'dataTransfer', { get: () => dt })
      fireEvent(row, over)
      const drop = createEvent.drop(screen.getByTestId('layers-panel-row-b'))
      Object.defineProperty(drop, 'clientY', { get: () => clientY })
      Object.defineProperty(drop, 'dataTransfer', { get: () => dt })
      fireEvent(screen.getByTestId('layers-panel-row-b'), drop)
    }

    // Middle of row (container) → into — wide nest zone
    fireAt('a', 130)
    expect(onReorderDrop).toHaveBeenCalledWith('a', 'b', 'into')

    onReorderDrop.mockClear()
    // Child onto parent middle → still fires (app may no-op)
    fireAt('c', 130)
    expect(onReorderDrop).toHaveBeenCalledWith('c', 'b', 'into')
  })

  it('fires into for any drop on empty acceptsChildren row', () => {
    const onReorderDrop = vi.fn()
    const items: LayersPanelItem[] = [
      {
        id: 'root',
        label: 'Root',
        acceptsChildren: true,
        children: [
          { id: 'box', label: 'SiteContainer', acceptsChildren: true },
          { id: 'link', label: 'SiteLink' },
        ],
      },
    ]
    render(<LayersPanel items={items} onReorderDrop={onReorderDrop} />)

    const box = screen.getByTestId('layers-panel-row-box')
    Object.defineProperty(box, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        top: 100,
        height: 40,
        bottom: 140,
        left: 0,
        right: 100,
        width: 100,
        x: 0,
        y: 100,
        toJSON: () => ({}),
      }),
    })
    const dt = dataTransferMock({
      [LAYERS_PANEL_DND_MIME]: 'link',
      'text/plain': 'link',
    })
    // Top edge would be "before" for filled containers — empty forces into
    const over = createEvent.dragOver(box)
    Object.defineProperty(over, 'clientY', { get: () => 102 })
    Object.defineProperty(over, 'dataTransfer', { get: () => dt })
    fireEvent(box, over)
    const drop = createEvent.drop(screen.getByTestId('layers-panel-row-box'))
    Object.defineProperty(drop, 'clientY', { get: () => 102 })
    Object.defineProperty(drop, 'dataTransfer', { get: () => dt })
    fireEvent(screen.getByTestId('layers-panel-row-box'), drop)
    expect(onReorderDrop).toHaveBeenCalledWith('link', 'box', 'into')
  })

  it('does not drag locked rows', () => {
    const onReorderDrop = vi.fn()
    const items: LayersPanelItem[] = [
      {
        id: 'root',
        label: 'Root',
        children: [
          { id: 'a', label: 'A', locked: true },
          { id: 'b', label: 'B' },
        ],
      },
    ]
    render(<LayersPanel items={items} onReorderDrop={onReorderDrop} />)

    expect(screen.getByTestId('layers-panel-row-a')).toHaveAttribute('draggable', 'false')
    expect(screen.getByTestId('layers-panel-row-b')).toHaveAttribute('draggable', 'true')
  })
})
