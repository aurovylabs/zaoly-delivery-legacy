import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { LayersPanel, type LayersPanelItem } from './LayersPanel'

const DEMO_TREE: LayersPanelItem[] = [
  {
    id: 'root',
    label: 'Page',
    type: 'Stack',
    children: [
      { id: 'title', label: 'Hero title', type: 'Text' },
      {
        id: 'card',
        label: 'Feature card',
        type: 'Card',
        children: [
          { id: 'cta', label: 'Get started', type: 'Button' },
          { id: 'img', label: 'Hero image', type: 'Image' },
        ],
      },
      { id: 'input', label: 'Email', type: 'Input' },
    ],
  },
]

function cloneTree(items: LayersPanelItem[]): LayersPanelItem[] {
  return items.map((n) => ({
    ...n,
    children: n.children ? cloneTree(n.children) : undefined,
  }))
}

function mapTree(
  items: LayersPanelItem[],
  fn: (n: LayersPanelItem) => LayersPanelItem,
): LayersPanelItem[] {
  return items.map((n) => {
    const next = fn({ ...n })
    if (n.children) next.children = mapTree(n.children, fn)
    return next
  })
}

function reorderSiblings(
  list: LayersPanelItem[],
  id: string,
  direction: 'up' | 'down',
): LayersPanelItem[] {
  const idx = list.findIndex((n) => n.id === id)
  if (idx >= 0) {
    const swap = direction === 'up' ? idx - 1 : idx + 1
    if (swap < 0 || swap >= list.length) return list
    const next = [...list]
    const tmp = next[idx]!
    next[idx] = next[swap]!
    next[swap] = tmp
    return next
  }
  return list.map((n) =>
    n.children ? { ...n, children: reorderSiblings(n.children, id, direction) } : n,
  )
}

function reorderDrop(
  list: LayersPanelItem[],
  id: string,
  targetId: string,
  position: 'before' | 'after',
): LayersPanelItem[] {
  const from = list.findIndex((n) => n.id === id)
  const to = list.findIndex((n) => n.id === targetId)
  if (from >= 0 && to >= 0 && from !== to) {
    const next = [...list]
    const [moved] = next.splice(from, 1)
    let insertAt = next.findIndex((n) => n.id === targetId)
    if (insertAt < 0 || !moved) return list
    if (position === 'after') insertAt += 1
    next.splice(insertAt, 0, moved)
    return next
  }
  return list.map((n) =>
    n.children
      ? { ...n, children: reorderDrop(n.children, id, targetId, position) }
      : n,
  )
}

const meta = {
  title: 'Organisms/LayersPanel',
  component: LayersPanel,
  parameters: {
    docs: {
      description: {
        component:
          'Scene structure tree for composition editors. Apps map domain nodes to { id, label, type?, hidden?, locked?, children? }.',
      },
    },
  },
} satisfies Meta<typeof LayersPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Layers',
    items: DEMO_TREE,
    selectedId: 'title',
  },
}

export const Nested: Story = {
  name: 'Nested selection',
  render: function NestedStory() {
    const [selectedIds, setSelectedIds] = useState<string[]>(['cta'])
    const selectedId = selectedIds[selectedIds.length - 1] ?? null
    return (
      <div style={{ maxWidth: '16rem', border: '1px solid var(--border, #ddd)' }}>
        <LayersPanel
          title="Layers"
          items={DEMO_TREE}
          selectedId={selectedId}
          selectedIds={selectedIds}
          onSelect={(id, mods) => {
            const additive = Boolean(mods?.shiftKey || mods?.metaKey || mods?.ctrlKey)
            setSelectedIds((prev) => {
              if (!additive) return [id]
              if (prev.includes(id)) return prev.filter((x) => x !== id)
              return [...prev, id]
            })
          }}
        />
      </div>
    )
  },
}

export const Empty: Story = {
  args: {
    title: 'Layers',
    items: [],
    emptyLabel: 'No layers',
  },
}

export const WithReorder: Story = {
  name: 'With sibling reorder',
  render: function ReorderStory() {
    const [selectedId, setSelectedId] = useState<string | null>('title')
    const [items, setItems] = useState<LayersPanelItem[]>(DEMO_TREE)

    return (
      <div style={{ maxWidth: '16rem', border: '1px solid var(--border, #ddd)' }}>
        <LayersPanel
          title="Layers"
          items={items}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onReorder={(id, direction) =>
            setItems((prev) => reorderSiblings(prev, id, direction))
          }
        />
      </div>
    )
  },
}

export const WithHideLock: Story = {
  name: 'With hide and lock',
  render: function HideLockStory() {
    const [selectedId, setSelectedId] = useState<string | null>('title')
    const [items, setItems] = useState<LayersPanelItem[]>(() => cloneTree(DEMO_TREE))

    const toggleFlag = (id: string, key: 'hidden' | 'locked') => {
      setItems((prev) =>
        mapTree(prev, (n) => (n.id === id ? { ...n, [key]: !n[key] } : n)),
      )
    }

    return (
      <div style={{ maxWidth: '16rem', border: '1px solid var(--border, #ddd)' }}>
        <LayersPanel
          title="Layers"
          items={items}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onToggleHidden={(id) => toggleFlag(id, 'hidden')}
          onToggleLocked={(id) => toggleFlag(id, 'locked')}
        />
      </div>
    )
  },
}

export const WithDragReorder: Story = {
  name: 'With drag reorder',
  render: function DragReorderStory() {
    const [selectedId, setSelectedId] = useState<string | null>('title')
    const [items, setItems] = useState<LayersPanelItem[]>(() => cloneTree(DEMO_TREE))

    return (
      <div style={{ maxWidth: '16rem', border: '1px solid var(--border, #ddd)' }}>
        <LayersPanel
          title="Layers"
          items={items}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onMoveUp={(id) => setItems((prev) => reorderSiblings(prev, id, 'up'))}
          onMoveDown={(id) => setItems((prev) => reorderSiblings(prev, id, 'down'))}
          onReorderDrop={(id, targetId, position) =>
            setItems((prev) => reorderDrop(prev, id, targetId, position))
          }
          onToggleHidden={(id) =>
            setItems((prev) =>
              mapTree(prev, (n) => (n.id === id ? { ...n, hidden: !n.hidden } : n)),
            )
          }
          onToggleLocked={(id) =>
            setItems((prev) =>
              mapTree(prev, (n) => (n.id === id ? { ...n, locked: !n.locked } : n)),
            )
          }
        />
      </div>
    )
  },
}
