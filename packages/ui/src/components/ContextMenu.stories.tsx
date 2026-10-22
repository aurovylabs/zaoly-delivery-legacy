import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { ContextMenu, type ContextMenuItem } from './ContextMenu'

function Demo() {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ x: 24, y: 24 })
  const [last, setLast] = useState<string | null>(null)

  const items: ContextMenuItem[] = [
    { id: 'sec', label: 'Clip', section: true, onSelect: () => undefined },
    { id: 'dup', label: 'Duplizieren', shortcut: '⌘D', onSelect: () => setLast('dup') },
    {
      id: 'inspect',
      label: 'Inspector öffnen',
      separator: true,
      onSelect: () => setLast('inspect'),
    },
    {
      id: 'del',
      label: 'Löschen',
      shortcut: '⌫',
      danger: true,
      onSelect: () => setLast('del'),
    },
    { id: 'busy', label: 'Disabled', disabled: true, onSelect: () => setLast('busy') },
  ]

  return (
    <div
      style={{ minHeight: 220, padding: 16, border: '1px dashed var(--line)' }}
      onContextMenu={(event) => {
        event.preventDefault()
        setPos({ x: event.clientX, y: event.clientY })
        setOpen(true)
      }}
    >
      <p>Right-click here. Last: {last ?? '—'}</p>
      <ContextMenu
        open={open}
        x={pos.x}
        y={pos.y}
        onClose={() => setOpen(false)}
        items={items}
      />
    </div>
  )
}

const meta = {
  title: 'Molecules/ContextMenu',
  component: ContextMenu,
  render: () => <Demo />,
} satisfies Meta<typeof ContextMenu>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
