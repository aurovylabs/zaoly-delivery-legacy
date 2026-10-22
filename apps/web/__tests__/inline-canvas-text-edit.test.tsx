import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { useRef, useState } from 'react'
import { InlineCanvasTextEdit } from '../components/editor/inline-canvas-text-edit'
import { paths } from '../lib/paths'

function Harness({
  initial = 'Hello',
  onCommit,
  onCancel,
}: {
  initial?: string
  onCommit: (text: string) => void
  onCancel: () => void
}) {
  const ref = useRef<HTMLSpanElement | null>(null)
  const [value] = useState(initial)
  return (
    <InlineCanvasTextEdit
      editRef={ref}
      value={value}
      onCommit={onCommit}
      onCancel={onCancel}
    />
  )
}

describe('InlineCanvasTextEdit', () => {
  it('commits textContent on blur', () => {
    const onCommit = vi.fn()
    const onCancel = vi.fn()
    render(<Harness onCommit={onCommit} onCancel={onCancel} />)
    const editor = screen.getByTestId('creation-inline-edit')
    editor.textContent = 'Updated'
    fireEvent.blur(editor)
    expect(onCommit).toHaveBeenCalledWith('Updated')
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('Escape cancels without commit even when blur follows unmount', () => {
    const onCommit = vi.fn()
    const onCancel = vi.fn()
    const { unmount } = render(<Harness onCommit={onCommit} onCancel={onCancel} />)
    const editor = screen.getByTestId('creation-inline-edit')
    editor.textContent = 'Draft that must discard'
    fireEvent.keyDown(editor, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalled()
    // Parent typically unmounts on cancel; blur must not commit the draft.
    fireEvent.blur(editor)
    unmount()
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('dispatches inline-edit-active window events for HUD gate', () => {
    const seen: boolean[] = []
    const onActive = (e: Event) => {
      seen.push(Boolean((e as CustomEvent<{ active?: boolean }>).detail?.active))
    }
    window.addEventListener(paths.inlineEditActiveEvent, onActive)
    const onCommit = vi.fn()
    const onCancel = vi.fn()
    const { unmount } = render(<Harness onCommit={onCommit} onCancel={onCancel} />)
    expect(seen).toEqual([true])
    unmount()
    expect(seen).toEqual([true, false])
    window.removeEventListener(paths.inlineEditActiveEvent, onActive)
  })
})
